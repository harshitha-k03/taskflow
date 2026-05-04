const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const {
  signup,
  login,
  logout,
  refresh,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate, signupSchema, loginSchema } = require('../utils/validators');

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// ── Google OAuth ──────────────────────────────────────────────
// Step 1: redirect user to Google consent screen
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// Step 2: Google redirects back here
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }),
  (req, res) => {
    const user = req.user;
    const accessToken  = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Encode user info and tokens into redirect URL
    const params = new URLSearchParams({
      accessToken,
      refreshToken,
      userId:    user._id.toString(),
      name:      user.name,
      email:     user.email,
      avatar:    user.avatar || '',
      isEmailVerified: String(user.isEmailVerified),
    });

    res.redirect(`${process.env.FRONTEND_URL}/oauth-callback?${params.toString()}`);
  }
);

module.exports = router;
