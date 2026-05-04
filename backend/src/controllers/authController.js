const crypto = require('crypto');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const Project = require('../models/Project');
const TeamMember = require('../models/TeamMember');
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

// Fresh demo chat messages recreated on every demo login
const resetDemoMessages = async (demoUserId) => {
  const daysAgo = (n) => new Date(Date.now() - n * 86400000);
  const hoursAgo = (h) => new Date(Date.now() - h * 3600000);
  const minsAgo = (m) => new Date(Date.now() - m * 60000);
  const getDmCh = (a, b) => `dm:${[a.toString(), b.toString()].sort().join('_')}`;

  // Find demo team members
  const demoEmails = ['alex@taskflow.com','sarah@taskflow.com','mike@taskflow.com','priya@taskflow.com'];
  const teammates = await User.find({ email: { $in: demoEmails } });
  if (teammates.length < 4) return; // seed hasn't run yet
  const byEmail = {};
  teammates.forEach(u => { byEmail[u.email] = u; });
  const alex = byEmail['alex@taskflow.com'], sarah = byEmail['sarah@taskflow.com'];
  const mike = byEmail['mike@taskflow.com'], priya = byEmail['priya@taskflow.com'];
  const allIds = [demoUserId, alex._id, sarah._id, mike._id, priya._id];

  // Find demo projects (created by demo user)
  const projects = await Project.find({ creator: demoUserId }).sort({ createdAt: 1 });
  if (projects.length < 3) return;
  const [p1, p2, p3] = projects;

  const tc1 = `team:${p1._id}`, tc2 = `team:${p2._id}`, tc3 = `team:${p3._id}`;
  const dA = getDmCh(demoUserId, alex._id), dS = getDmCh(demoUserId, sarah._id);
  const dM = getDmCh(demoUserId, mike._id), dP = getDmCh(demoUserId, priya._id);

  // Only delete messages in demo-only channels
  await Message.deleteMany({ channel: { $in: [tc1, tc2, tc3, dA, dS, dM, dP] } });

  await Message.insertMany([
    { sender: demoUserId, channel: tc1, text: 'Hey team! Kicking off the v2.0 redesign. Let\'s start with design tokens.', createdAt: hoursAgo(48), readBy: allIds },
    { sender: sarah._id, channel: tc1, text: 'Color palette is ready — uploaded the Figma file. Primary indigo-600, secondary emerald-500 🎨', createdAt: hoursAgo(47), readBy: allIds },
    { sender: alex._id, channel: tc1, text: 'Love it Sarah! I\'ll start the Button component based on those tokens.', createdAt: hoursAgo(46), readBy: allIds },
    { sender: mike._id, channel: tc1, text: 'Heads up — mobile nav is broken on iPhone SE. Filed it as urgent.', createdAt: hoursAgo(24), readBy: allIds },
    { sender: demoUserId, channel: tc1, text: 'Thanks Mike, I\'ll prioritize the mobile fix. Dark mode toggle is done ✅', createdAt: hoursAgo(23), readBy: allIds },
    { sender: alex._id, channel: tc1, text: 'Navbar notifications PR is ready for review! Bell badge + dropdown panel done.', createdAt: hoursAgo(4), readBy: [alex._id] },
    { sender: sarah._id, channel: tc1, text: 'Reviewed it Alex — looks great! Left a comment about animation timing.', createdAt: hoursAgo(3), readBy: [sarah._id, alex._id] },
    { sender: demoUserId, channel: tc1, text: 'Great work everyone! Dashboard redesign almost done. Standup at 10am tomorrow?', createdAt: hoursAgo(1), readBy: [demoUserId] },
    { sender: demoUserId, channel: tc2, text: 'Q3 campaign deadline was yesterday... where are we on tracking pixels?', createdAt: hoursAgo(26), readBy: allIds },
    { sender: alex._id, channel: tc2, text: 'Banner ads in review — 3 size variants ready. Waiting on brand approval.', createdAt: hoursAgo(25), readBy: allIds },
    { sender: priya._id, channel: tc2, text: 'Social media kit is complete! All templates uploaded 📁', createdAt: hoursAgo(22), readBy: allIds },
    { sender: demoUserId, channel: tc2, text: 'Awesome Priya! I still need to set up Meta pixel. Will do today.', createdAt: hoursAgo(20), readBy: allIds },
    { sender: alex._id, channel: tc2, text: 'Got brand approval on banners! Pushing to Google Display now 🚀', createdAt: hoursAgo(5), readBy: [alex._id] },
    { sender: mike._id, channel: tc3, text: 'Auth migration to GraphQL is complete! All mutations passing tests.', createdAt: hoursAgo(36), readBy: allIds },
    { sender: sarah._id, channel: tc3, text: 'Nice Mike! I\'ll start DB indexing audit next week. Any slow queries?', createdAt: hoursAgo(35), readBy: allIds },
    { sender: mike._id, channel: tc3, text: 'Check task listing — doing a full collection scan on filtered queries.', createdAt: hoursAgo(34), readBy: allIds },
    { sender: demoUserId, channel: tc3, text: 'Working on WebSocket notifications. Prototype by end of day.', createdAt: hoursAgo(12), readBy: allIds },
    { sender: priya._id, channel: tc3, text: 'I\'ll start OpenAPI docs once endpoints stabilize. Using swagger-jsdoc.', createdAt: hoursAgo(8), readBy: allIds },
    { sender: mike._id, channel: tc3, text: 'Rate limiting almost done — express-rate-limit with Redis store 🔒', createdAt: hoursAgo(2), readBy: [mike._id] },
    { sender: alex._id, channel: dA, text: 'Hey! Can you review my navbar PR?', createdAt: hoursAgo(6), readBy: [alex._id] },
    { sender: demoUserId, channel: dA, text: 'Sure! I\'ll check after lunch. Did you add the badge animation?', createdAt: hoursAgo(5.5), readBy: [demoUserId, alex._id] },
    { sender: alex._id, channel: dA, text: 'Yep, subtle scale + pulse. Unread count capped at 9+', createdAt: hoursAgo(5), readBy: [alex._id] },
    { sender: demoUserId, channel: dA, text: 'Perfect, exactly the Slack-style pattern 👍', createdAt: hoursAgo(4.5), readBy: [demoUserId, alex._id] },
    { sender: alex._id, channel: dA, text: 'Banner ad approved! Pushing to Google Display now', createdAt: minsAgo(30), readBy: [alex._id] },
    { sender: sarah._id, channel: dS, text: 'Color tokens exported as CSS vars + Tailwind config. Want a walkthrough?', createdAt: hoursAgo(40), readBy: allIds },
    { sender: demoUserId, channel: dS, text: 'That\'d be great! Quick 15-min call tomorrow?', createdAt: hoursAgo(39), readBy: allIds },
    { sender: sarah._id, channel: dS, text: 'Works for me! 10:30am? I\'ll show the Figma → code pipeline', createdAt: hoursAgo(38), readBy: allIds },
    { sender: demoUserId, channel: dS, text: '10:30 works 👍 see you then!', createdAt: hoursAgo(37), readBy: allIds },
    { sender: mike._id, channel: dM, text: 'Found critical bug — mobile hamburger overflows on small screens.', createdAt: hoursAgo(26), readBy: allIds },
    { sender: demoUserId, channel: dM, text: 'Thanks for catching that! Only iPhone SE or other devices too?', createdAt: hoursAgo(25), readBy: allIds },
    { sender: mike._id, channel: dM, text: 'SE and Galaxy Fold — anything under 375px width.', createdAt: hoursAgo(24), readBy: allIds },
    { sender: mike._id, channel: dM, text: 'Rate limiting PR is up for review 🔒', createdAt: minsAgo(45), readBy: [mike._id] },
    { sender: priya._id, channel: dP, text: 'Hey! I\'m OOO this week. A/B test setup when I\'m back Monday.', createdAt: hoursAgo(30), readBy: allIds },
    { sender: demoUserId, channel: dP, text: 'No worries Priya! Enjoy your time off 🌴', createdAt: hoursAgo(29), readBy: allIds },
    { sender: priya._id, channel: dP, text: 'Thanks! Left notes in API docs task about swagger-jsdoc config.', createdAt: hoursAgo(28), readBy: allIds },
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
      resetDemoNotifications(user._id).catch(() => {});
      resetDemoMessages(user._id).catch(() => {});
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
