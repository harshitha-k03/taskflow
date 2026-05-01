const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  updateStatus,
  assignTask,
  addComment,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { requireTaskProjectMember } = require('../middleware/rbac');
const { validate, taskSchema } = require('../utils/validators');

router.use(protect);

router.route('/').get(getTasks).post(validate(taskSchema), createTask);

router
  .route('/:id')
  .get(requireTaskProjectMember, getTask)
  .put(requireTaskProjectMember, validate(taskSchema), updateTask)
  .delete(requireTaskProjectMember, deleteTask);

router.patch('/:id/status', requireTaskProjectMember, updateStatus);
router.patch('/:id/assign', requireTaskProjectMember, assignTask);
router.post('/:id/comments', requireTaskProjectMember, addComment);

module.exports = router;
