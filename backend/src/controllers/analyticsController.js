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
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
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

// GET /api/analytics/team-overview
exports.getTeamOverview = async (req, res, next) => {
  try {
    const memberships = await TeamMember.find({ user: req.user._id }).select('project');
    const projectIds = memberships.map((m) => m.project);

    // All unique team members across user's projects
    const allMembers = await TeamMember.find({ project: { $in: projectIds } })
      .populate('user', 'name email avatar availability')
      .lean();

    const seen = new Set();
    const uniqueMembers = allMembers
      .filter((m) => {
        if (!m.user || seen.has(String(m.user._id))) return false;
        seen.add(String(m.user._id));
        return true;
      })
      .map((m) => m.user);

    // Open task count per member
    const taskCounts = await Task.aggregate([
      { $match: { project: { $in: projectIds }, status: { $ne: 'Done' }, assignedTo: { $ne: null } } },
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
    ]);
    const countMap = taskCounts.reduce((acc, t) => { acc[String(t._id)] = t.count; return acc; }, {});

    const data = uniqueMembers.map((u) => ({
      ...u,
      openTasks: countMap[String(u._id)] || 0,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/member/:userId
exports.getMemberDetail = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const targetUserId = req.params.userId;

    // Get the target user's profile
    const profile = await User.findById(targetUserId).select('name email avatar availability createdAt').lean();
    if (!profile) return res.status(404).json({ success: false, message: 'User not found.' });

    // Find shared projects (projects where both current user and target are members)
    const myMemberships = await TeamMember.find({ user: req.user._id }).select('project');
    const myProjectIds = myMemberships.map((m) => m.project);

    const targetMemberships = await TeamMember.find({
      user: targetUserId,
      project: { $in: myProjectIds },
    })
      .populate('project', 'name color status')
      .lean();

    const projects = targetMemberships.map((m) => ({
      ...m.project,
      role: m.role,
    }));

    const sharedProjectIds = targetMemberships.map((m) => m.project._id);

    // Task breakdown
    const [tasksByStatus, recentDone] = await Promise.all([
      Task.aggregate([
        { $match: { project: { $in: sharedProjectIds }, assignedTo: require('mongoose').Types.ObjectId.createFromHexString(targetUserId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.find({
        project: { $in: sharedProjectIds },
        assignedTo: targetUserId,
        status: 'Done',
      })
        .sort({ completedAt: -1, updatedAt: -1 })
        .limit(5)
        .populate('project', 'name color')
        .select('title project completedAt updatedAt')
        .lean(),
    ]);

    const statusMap = tasksByStatus.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {});

    res.json({
      success: true,
      data: {
        profile,
        projects,
        taskStats: {
          done: statusMap.Done || 0,
          inProgress: statusMap['In Progress'] || 0,
          inReview: statusMap['In Review'] || 0,
          toDo: statusMap['To Do'] || 0,
          total: Object.values(statusMap).reduce((a, b) => a + b, 0),
        },
        recentDone,
      },
    });
  } catch (err) {
    next(err);
  }
};
