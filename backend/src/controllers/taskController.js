const Task = require('../models/Task');
const TeamMember = require('../models/TeamMember');
const Comment = require('../models/Comment');
const AppError = require('../utils/errors');

// POST /api/tasks
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, assignedTo, priority, status, dueDate, project, labels } =
      req.body;

    if (!project) return next(new AppError('Project ID is required.', 400));

    // Verify caller is a member
    const membership = await TeamMember.findOne({ project, user: req.user._id });
    if (!membership) return next(new AppError('Not a member of this project.', 403));

    // Verify assignee is a member (if provided)
    if (assignedTo) {
      const assigneeMember = await TeamMember.findOne({ project, user: assignedTo });
      if (!assigneeMember)
        return next(new AppError('Assigned user is not a member of this project.', 400));
    }

    const task = await Task.create({
      title,
      description,
      assignedTo: assignedTo || null,
      priority,
      status,
      dueDate,
      project,
      labels,
      createdBy: req.user._id,
    });

    await task.populate([
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' },
    ]);

    res.status(201).json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks  or  GET /api/projects/:id/tasks
exports.getTasks = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.query.project;
    const { status, priority, assignedTo, search, sort = '-createdAt', page = 1, limit = 50 } =
      req.query;

    // Build base query: only projects user belongs to
    const memberships = await TeamMember.find({ user: req.user._id }).select('project');
    const memberProjectIds = memberships.map((m) => m.project);

    const filter = {
      project: projectId ? projectId : { $in: memberProjectIds },
    };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignedTo', 'name email avatar')
        .populate('createdBy', 'name email avatar')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Task.countDocuments(filter),
    ]);

    res.json({
      success: true,
      tasks,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks/:id
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color');

    if (!task) return next(new AppError('Task not found.', 404));

    const comments = await Comment.find({ task: task._id })
      .populate('author', 'name email avatar')
      .sort('createdAt');

    res.json({ success: true, task, comments });
  } catch (err) {
    next(err);
  }
};

// PUT /api/tasks/:id
exports.updateTask = async (req, res, next) => {
  try {
    const task = req.task; // set by requireTaskProjectMember
    const isAdmin = req.membership?.role === 'Admin';
    const isOwner =
      task.createdBy?.toString() === req.user._id.toString() ||
      task.assignedTo?.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return next(new AppError('You can only edit tasks you created or are assigned to.', 403));
    }

    const { title, description, assignedTo, priority, status, dueDate, labels } = req.body;

    // Verify new assignee is a member
    if (assignedTo) {
      const assigneeMember = await TeamMember.findOne({
        project: task.project,
        user: assignedTo,
      });
      if (!assigneeMember)
        return next(new AppError('Assigned user is not a member of this project.', 400));
    }

    Object.assign(task, { title, description, assignedTo, priority, status, dueDate, labels });
    await task.save();

    await task.populate([
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' },
    ]);

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res, next) => {
  try {
    const task = req.task;
    if (req.membership?.role !== 'Admin') {
      return next(new AppError('Only admins can delete tasks.', 403));
    }

    await Promise.all([
      Task.findByIdAndDelete(task._id),
      Comment.deleteMany({ task: task._id }),
    ]);

    res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/tasks/:id/status
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['To Do', 'In Progress', 'In Review', 'Done'];
    if (!validStatuses.includes(status)) {
      return next(new AppError('Invalid status value.', 400));
    }

    const task = req.task;
    task.status = status;
    await task.save();

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/tasks/:id/assign
exports.assignTask = async (req, res, next) => {
  try {
    const { assignedTo } = req.body;
    const task = req.task;

    if (assignedTo) {
      const assigneeMember = await TeamMember.findOne({
        project: task.project,
        user: assignedTo,
      });
      if (!assigneeMember)
        return next(new AppError('User is not a member of this project.', 400));
    }

    task.assignedTo = assignedTo || null;
    await task.save();
    await task.populate('assignedTo', 'name email avatar');

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// POST /api/tasks/:id/comments
exports.addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return next(new AppError('Comment text is required.', 400));

    const comment = await Comment.create({
      task: req.params.id,
      author: req.user._id,
      text: text.trim(),
    });

    await comment.populate('author', 'name email avatar');
    res.status(201).json({ success: true, comment });
  } catch (err) {
    next(err);
  }
};
