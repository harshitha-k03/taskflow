const TeamMember = require('../models/TeamMember');
const Task = require('../models/Task');
const AppError = require('../utils/errors');

// Attach the calling user's project membership to req.membership
const loadMembership = async (req, res, next) => {
  const projectId = req.params.id || req.params.projectId || req.body.project;
  if (!projectId) return next();

  const membership = await TeamMember.findOne({
    project: projectId,
    user: req.user._id,
  });

  req.membership = membership || null;
  next();
};

// Must be a member of the project
const requireProjectMember = async (req, res, next) => {
  await loadMembership(req, res, async () => {
    if (!req.membership) {
      return next(new AppError('You are not a member of this project.', 403));
    }
    next();
  });
};

// Must be Admin of the project
const requireProjectAdmin = async (req, res, next) => {
  await loadMembership(req, res, async () => {
    if (!req.membership || req.membership.role !== 'Admin') {
      return next(new AppError('Only project admins can perform this action.', 403));
    }
    next();
  });
};

// For task routes: load project from task, then check membership
const requireTaskProjectMember = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return next(new AppError('Task not found.', 404));

    req.task = task;
    const membership = await TeamMember.findOne({
      project: task.project,
      user: req.user._id,
    });

    req.membership = membership || null;
    if (!req.membership) {
      return next(new AppError('You are not a member of this project.', 403));
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  requireProjectMember,
  requireProjectAdmin,
  requireTaskProjectMember,
};
