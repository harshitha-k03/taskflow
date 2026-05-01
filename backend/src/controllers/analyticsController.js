const Task = require('../models/Task');
const Project = require('../models/Project');
const TeamMember = require('../models/TeamMember');

// GET /api/analytics/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const memberships = await TeamMember.find({ user: req.user._id }).select('project role');
    const projectIds = memberships.map((m) => m.project);

    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
      totalProjects,
      totalTasks,
      tasksByStatus,
      overdueTasks,
      myTasks,
      completedThisWeek,
      completedThisMonth,
      tasksByPriority,
    ] = await Promise.all([
      Project.countDocuments({ _id: { $in: projectIds } }),
      Task.countDocuments({ project: { $in: projectIds } }),
      Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.countDocuments({
        project: { $in: projectIds },
        dueDate: { $lt: now },
        status: { $ne: 'Done' },
      }),
      Task.find({
        project: { $in: projectIds },
        assignedTo: req.user._id,
        status: { $ne: 'Done' },
      })
        .populate('project', 'name color')
        .sort('dueDate')
        .limit(10),
      Task.countDocuments({
        project: { $in: projectIds },
        status: 'Done',
        completedAt: { $gte: weekAgo },
      }),
      Task.countDocuments({
        project: { $in: projectIds },
        status: 'Done',
        completedAt: { $gte: monthAgo },
      }),
      Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
    ]);

    const totalDone = tasksByStatus.find((s) => s._id === 'Done')?.count || 0;
    const completionRate = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalProjects,
        totalTasks,
        tasksByStatus: tasksByStatus.reduce((acc, s) => {
          acc[s._id] = s.count;
          return acc;
        }, {}),
        overdueTasks,
        myTasks,
        completedThisWeek,
        completedThisMonth,
        completionRate,
        tasksByPriority: tasksByPriority.reduce((acc, p) => {
          acc[p._id] = p.count;
          return acc;
        }, {}),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:id/analytics
exports.getProjectAnalytics = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const now = new Date();

    const [tasksByStatus, tasksByPriority, memberWorkload, overdue, total] = await Promise.all([
      Task.aggregate([
        { $match: { project: require('mongoose').Types.ObjectId.createFromHexString(projectId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: { project: require('mongoose').Types.ObjectId.createFromHexString(projectId) } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: { project: require('mongoose').Types.ObjectId.createFromHexString(projectId) } },
        { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmpty: true } },
        {
          $project: {
            count: 1,
            'user.name': 1,
            'user.email': 1,
            'user.avatar': 1,
          },
        },
      ]),
      Task.countDocuments({
        project: projectId,
        dueDate: { $lt: now },
        status: { $ne: 'Done' },
      }),
      Task.countDocuments({ project: projectId }),
    ]);

    res.json({
      success: true,
      data: {
        tasksByStatus: tasksByStatus.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {}),
        tasksByPriority: tasksByPriority.reduce((acc, p) => { acc[p._id] = p.count; return acc; }, {}),
        memberWorkload,
        overdue,
        total,
        completionRate:
          total > 0
            ? Math.round(((tasksByStatus.find((s) => s._id === 'Done')?.count || 0) / total) * 100)
            : 0,
      },
    });
  } catch (err) {
    next(err);
  }
};
