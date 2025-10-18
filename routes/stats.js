const express = require('express');
const router = express.Router();
const MatchedRecord = require('../models/MatchedRecord');
const BankUpload = require('../models/BankUpload');
const ActivityLog = require('../models/ActivityLog');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const uploadIds = await BankUpload.find({ uploadedBy: req.user.userId }).distinct('_id');
    const stats = await MatchedRecord.aggregate([
      { $match: { uploadId: { $in: uploadIds } } },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          fraudCount: { $sum: { $cond: [{ $eq: ['$status', 'Fraud'] }, 1, 0] } },
          suspectedCount: { $sum: { $cond: [{ $eq: ['$status', 'Suspected'] }, 1, 0] } },
          reportedCount: { $sum: { $cond: [{ $eq: ['$status', 'Reported'] }, 1, 0] } },
          spamCount: { $sum: { $cond: [{ $eq: ['$status', 'Spam'] }, 1, 0] } },
        },
      },
    ]);

    res.json(stats[0] || { totalRecords: 0, fraudCount: 0, suspectedCount: 0, reportedCount: 0, spamCount: 0 });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

router.get('/recent-activity', auth, async (req, res) => {
  try {
    const activities = await ActivityLog.find({ userId: req.user.userId })
      .populate('userId', 'email')
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(activities);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ message: 'Error fetching recent activity' });
  }
});

module.exports = router; // Ensure router is exported