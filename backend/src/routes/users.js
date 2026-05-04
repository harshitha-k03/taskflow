const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const AppError = require('../utils/errors');

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
    res.json({ success: true, availability: user.availability });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
