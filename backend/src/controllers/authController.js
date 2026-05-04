const crypto = require('crypto');
const User = require('../models/User');
const Notification = require('../models/Notification');
const AppError = require('../utils/errors');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

const DEMO_EMAIL = 'demo@taskflow.com';

// Fresh demo notifications recreated on every login
const resetDemoNotifications = async (userId) => {
  await Notification.deleteMany({ user: userId });
  const now = new Date();
  const daysAgo  = (n) => new Date(now - n * 86400000);
  await Notification.insertMany([
    {
      user: userId, type: 'task_assigned', read: false,
      title: 'New Task Assigned to You',
      message: 'Alex Rivera assigned you "Redesign Dashboard with smart widgets" — due today!',
      createdAt: daysAgo(0),
    },
    {
      user: userId, type: 'task_overdue', read: false,
      title: '🔴 Task Overdue',
      message: '"Fix mobile navigation overflow" was due 2 days ago and is still open.',
      createdAt: daysAgo(0),
    },
    {
      user: userId, type: 'task_overdue', read: false,
      title: '🔴 Task Overdue',
      message: '"Setup Meta & Google tracking pixels" is 1 day overdue. Immediate action needed.',
      createdAt: daysAgo(1),
    },
    {
      user: userId, type: 'member_added', read: false,
      title: 'Added to Backend API v3',
      message: 'Sarah Chen added you as Admin to "Backend API v3".',
      createdAt: daysAgo(2),
    },
    {
      user: userId, type: 'task_due_soon', read: false,
      title: '⏰ Due Tomorrow',
      message: '"Update Navbar with notifications" is due tomorrow. Mark it done if complete!',
      createdAt: daysAgo(1),
    },
    {
      user: userId, type: 'task_assigned', read: true,
      title: 'Task Assigned to You',
      message: 'Mike Johnson assigned you "Add WebSocket real-time notifications" in Backend API v3.',
      createdAt: daysAgo(3),
    },
    {
      user: userId, type: 'member_added', read: true,
      title: 'Added to Q3 Marketing Campaign',
      message: 'Priya Sharma added you to "Q3 Marketing Campaign" as Admin.',
      createdAt: daysAgo(5),
    },
    {
      user: userId, type: 'task_due_soon', read: true,
      title: '⏰ Deadline This Week',
      message: '"Rate limiting & DDoS protection" is due in 3 days. Keep it moving!',
      createdAt: daysAgo(2),
    },
  ]);
};

// Helper to send tokens
const sendTokens = (user, statusCode, res) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  res.status(statusCode).json({
    success: true,
    accessToken,
    refreshToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
    },
  });
};

// POST /api/auth/signup
exports.signup = async (req, res, next) => {
  try {
    const { name, password } = req.body;
    const email = req.body.email?.trim().toLowerCase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email already in use.', 400));
    }

    const user = await User.create({ name, email, password });
    sendTokens(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { password } = req.body;
    const email = req.body.email?.trim().toLowerCase();

    const user = await User.findOne({ email }).select(
      '+password +loginAttempts +lockUntil'
    );

    if (!user) {
      return next(new AppError('Invalid email or password.', 401));
    }

    // Check account lock
    if (user.isLocked()) {
      const waitMin = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return next(
        new AppError(
          `Account locked due to too many failed attempts. Try again in ${waitMin} minute(s).`,
          429
        )
      );
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incLoginAttempts();
      return next(new AppError('Invalid email or password.', 401));
    }

    // Reset failed attempts on success
    await User.findByIdAndUpdate(user._id, {
      $set: { loginAttempts: 0, lastLogin: new Date() },
      $unset: { lockUntil: 1 },
    });

    // Demo user: always reset notifications so they appear fresh
    if (user.email === DEMO_EMAIL) {
      resetDemoNotifications(user._id).catch(() => {}); // fire-and-forget
    }

    sendTokens(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh
exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return next(new AppError('Refresh token required.', 400));

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id);
    if (!user) return next(new AppError('User not found.', 401));

    const accessToken = generateAccessToken(user._id);
    res.json({ success: true, accessToken });
  } catch (err) {
    return next(new AppError('Invalid or expired refresh token.', 401));
  }
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// PUT /api/auth/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return next(new AppError('Current password is incorrect.', 400));

    user.password = newPassword;
    await user.save();

    sendTokens(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const user = await User.findOne({ email });

    // Always respond OK to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If that email exists, a reset link has been sent.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 min
    await user.save({ validateBeforeSave: false });

    // In production, send email here. For now, return token in dev only.
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    console.log(`Password reset URL (dev only): ${resetUrl}`);

    res.json({
      success: true,
      message: 'If that email exists, a reset link has been sent.',
      ...(process.env.NODE_ENV === 'development' && { resetUrl }),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/reset-password/:token
exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) return next(new AppError('Reset token is invalid or has expired.', 400));

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    sendTokens(user, 200, res);
  } catch (err) {
    next(err);
  }
};
