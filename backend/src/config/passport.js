const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) return done(new Error('No email from Google'), null);

        // Check if user already exists (by googleId or email)
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Try matching by email (user may have a local account)
          user = await User.findOne({ email });

          if (user) {
            // Link Google to existing local account
            user.googleId = profile.id;
            user.authProvider = 'google';
            if (!user.avatar && profile.photos?.[0]?.value) {
              user.avatar = profile.photos[0].value;
            }
            await user.save({ validateBeforeSave: false });
          } else {
            // Brand new user via Google
            user = await User.create({
              name: profile.displayName,
              email,
              googleId: profile.id,
              authProvider: 'google',
              avatar: profile.photos?.[0]?.value || null,
              isEmailVerified: true, // Google emails are verified
              availability: { status: 'available' },
            });
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
