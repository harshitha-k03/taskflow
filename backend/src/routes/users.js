const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const AppError = require('../utils/errors');
const Ably = require('ably');

// Lazy-init Ably REST client
let ablyRest = null;
const getAbly = () => {
  if (!ablyRest && process.env.ABLY_API_KEY) {
    ablyRest = new Ably.Rest({ key: process.env.ABLY_API_KEY });
  }
  return ablyRest;
};

router.use(protect);

// PATCH /api/users/availability
router.patch('/availability', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['available', 'busy', 'ooo'].includes(status)) {
      return next(new AppError('Invalid availability status.', 400));
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 'availability.status': status, 'availability.updatedAt': new Date() },
      { new: true }
    );

    // Broadcast status change to all connected clients via Ably
    const ably = getAbly();
    if (ably) {
      try {
        const channel = ably.channels.get('taskflow:status');
        channel.publish('status_change', {
          userId: user._id.toString(),
          name: user.name,
          status,
        });
      } catch (ablyErr) {
        console.error('[Ably] Status broadcast error:', ablyErr.message);
      }
    }

    res.json({ success: true, availability: user.availability });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/reset-avatar — restore Google profile photo
router.patch('/reset-avatar', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.googleAvatar) {
      return res.status(400).json({ success: false, message: 'No Google avatar found. Log in with Google first.' });
    }
    user.avatar = user.googleAvatar;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, user: { avatar: user.avatar, googleAvatar: user.googleAvatar } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
