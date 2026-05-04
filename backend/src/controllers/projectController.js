const Project = require('../models/Project');
const TeamMember = require('../models/TeamMember');
const Task = require('../models/Task');
const User = require('../models/User');
const AppError = require('../utils/errors');
const { createNotification } = require('./notificationController');

// POST /api/projects
exports.createProject = async (req, res, next) => {
  try {
    const { name, description, startDate, endDate, status, color } = req.body;

    const project = await Project.create({
      name,
      description,
      startDate,
      endDate,
      status,
      color,
      creator: req.user._id,
    });

    // Creator is Admin
    await TeamMember.create({
      project: project._id,
      user: req.user._id,
      role: 'Admin',
    });

    res.status(201).json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects
exports.getProjects = async (req, res, next) => {
  try {
    // Get all project IDs the user belongs to
    const memberships = await TeamMember.find({ user: req.user._id }).select('project role');
    const projectIds = memberships.map((m) => m.project);

    const projects = await Project.find({ _id: { $in: projectIds } })
      .populate('creator', 'name email avatar')
      .sort({ updatedAt: -1 });

    // Attach membership info
    const membershipMap = {};
    memberships.forEach((m) => {
      membershipMap[m.project.toString()] = m.role;
    });

    const projectsWithRole = projects.map((p) => ({
      ...p.toObject(),
      myRole: membershipMap[p._id.toString()],
    }));

    // Get task counts per project
    const taskCounts = await Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: '$project', count: { $sum: 1 } } },
    ]);
    const taskCountMap = {};
    taskCounts.forEach((t) => {
      taskCountMap[t._id.toString()] = t.count;
    });

    const result = projectsWithRole.map((p) => ({
      ...p,
      taskCount: taskCountMap[p._id.toString()] || 0,
    }));

    res.json({ success: true, projects: result });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:id
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate('creator', 'name email avatar');
    if (!project) return next(new AppError('Project not found.', 404));

    const members = await TeamMember.find({ project: req.params.id }).populate(
      'user',
      'name email avatar'
    );

    res.json({
      success: true,
      project,
      members,
      myRole: req.membership?.role,
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/projects/:id
exports.updateProject = async (req, res, next) => {
  try {
    const { name, description, startDate, endDate, status, color } = req.body;

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description, startDate, endDate, status, color },
      { new: true, runValidators: true }
    );

    if (!project) return next(new AppError('Project not found.', 404));

    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:id
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return next(new AppError('Project not found.', 404));

    // Delete all related data
    await Promise.all([
      Task.deleteMany({ project: req.params.id }),
      TeamMember.deleteMany({ project: req.params.id }),
      Project.findByIdAndDelete(req.params.id),
    ]);

    res.json({ success: true, message: 'Project deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:id/members
exports.getMembers = async (req, res, next) => {
  try {
    const members = await TeamMember.find({ project: req.params.id }).populate(
      'user',
      'name email avatar createdAt'
    );
    res.json({ success: true, members });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:id/members
exports.addMember = async (req, res, next) => {
  try {
    const { email, role = 'Member' } = req.body;

    const user = await User.findOne({ email });
    if (!user) return next(new AppError('No user found with that email.', 404));

    const existing = await TeamMember.findOne({
      project: req.params.id,
      user: user._id,
    });
    if (existing) return next(new AppError('User is already a member of this project.', 400));

    const member = await TeamMember.create({
      project: req.params.id,
      user: user._id,
      role,
    });

    await member.populate('user', 'name email avatar');

    // Notify added member
    const project = await Project.findById(req.params.id).select('name');
    await createNotification({
      userId: user._id,
      type: 'member_added',
      title: 'Added to a Project',
      message: `${req.user.name} added you to "${project?.name || 'a project'}" as ${role}`,
      link: `/projects/${req.params.id}`,
    });

    res.status(201).json({ success: true, member });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:id/members/:uid
exports.removeMember = async (req, res, next) => {
  try {
    const { uid } = req.params;

    // Prevent removing yourself if you're the last admin
    const adminCount = await TeamMember.countDocuments({
      project: req.params.id,
      role: 'Admin',
    });
    const targetMembership = await TeamMember.findOne({
      project: req.params.id,
      user: uid,
    });

    if (
      targetMembership?.role === 'Admin' &&
      adminCount <= 1 &&
      uid === req.user._id.toString()
    ) {
      return next(new AppError('Cannot remove the only admin from a project.', 400));
    }

    const deleted = await TeamMember.findOneAndDelete({
      project: req.params.id,
      user: uid,
    });

    if (!deleted) return next(new AppError('Member not found.', 404));

    res.json({ success: true, message: 'Member removed successfully.' });
  } catch (err) {
    next(err);
  }
};

// PUT /api/projects/:id/members/:uid
exports.updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['Admin', 'Member'].includes(role)) {
      return next(new AppError('Invalid role. Must be Admin or Member.', 400));
    }

    const member = await TeamMember.findOneAndUpdate(
      { project: req.params.id, user: req.params.uid },
      { role },
      { new: true }
    ).populate('user', 'name email avatar');

    if (!member) return next(new AppError('Member not found.', 404));

    res.json({ success: true, member });
  } catch (err) {
    next(err);
  }
};
