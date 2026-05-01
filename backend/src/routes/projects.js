const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  getMembers,
  addMember,
  removeMember,
  updateMemberRole,
} = require('../controllers/projectController');
const { getTasks } = require('../controllers/taskController');
const { getProjectAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { requireProjectMember, requireProjectAdmin } = require('../middleware/rbac');
const { validate, projectSchema } = require('../utils/validators');

router.use(protect);

router.route('/').get(getProjects).post(validate(projectSchema), createProject);

router
  .route('/:id')
  .get(requireProjectMember, getProject)
  .put(requireProjectAdmin, validate(projectSchema), updateProject)
  .delete(requireProjectAdmin, deleteProject);

router.get('/:id/tasks', requireProjectMember, getTasks);
router.get('/:id/analytics', requireProjectMember, getProjectAnalytics);

router
  .route('/:id/members')
  .get(requireProjectMember, getMembers)
  .post(requireProjectAdmin, addMember);

router
  .route('/:id/members/:uid')
  .delete(requireProjectAdmin, removeMember)
  .put(requireProjectAdmin, updateMemberRole);

module.exports = router;
