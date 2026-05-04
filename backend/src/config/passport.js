const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Strip characters that fail the User model's name validator
const sanitizeName = (raw = '') =>
  raw.replace(/[^a-zA-Z\s.'-]/g, '').trim().slice(0, 50) || 'User';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5001'}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) return done(new Error('No email returned from Google'), null);

        const name = sanitizeName(profile.displayName);
        const googlePhoto = profile.photos?.[0]?.value || null;

        // 1. Returning Google user — always refresh googleAvatar
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          if (googlePhoto) {
            const oldGoogleAvatar = user.googleAvatar;
            user.googleAvatar = googlePhoto;
            // Restore avatar if user hasn't customized it, or first time migration
            if (!user.avatar || !oldGoogleAvatar || user.avatar === oldGoogleAvatar) {
              user.avatar = googlePhoto;
            }
          }
          user.lastLogin = new Date();
          await user.save({ validateBeforeSave: false });
        } else {
          // 2. Existing local account — link Google
          user = await User.findOne({ email });

          if (user) {
            user.googleId = profile.id;
            user.authProvider = 'google';
            if (googlePhoto) {
              user.googleAvatar = googlePhoto;
              user.avatar = googlePhoto;
            }
            await user.save({ validateBeforeSave: false });
          } else {
            // 3. Brand new user via Google
            user = await User.create({
              name,
              email,
              googleId: profile.id,
              authProvider: 'google',
              avatar: googlePhoto,
              googleAvatar: googlePhoto,
              isEmailVerified: true,
              availability: { status: 'available' },
            });
          }
        }

        return done(null, user);
      } catch (err) {
        console.error('[OAuth] Strategy error:', err.message, err.errors || '');
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
