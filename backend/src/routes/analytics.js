const express = require('express');
const router = express.Router();
const { getDashboard, getTeamOverview, getMemberDetail } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/dashboard', getDashboard);
router.get('/team-overview', getTeamOverview);
router.get('/member/:userId', getMemberDetail);

module.exports = router;
