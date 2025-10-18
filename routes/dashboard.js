const express = require('express');
const router = express.Router();
const { getStats, getRecentActivity } = require('../controllers/dashboardController');
const { auth, admin } = require('../middleware/auth');

router.get('/stats', auth, getStats);
router.get('/recent-activity', auth, admin, getRecentActivity);

module.exports = router;