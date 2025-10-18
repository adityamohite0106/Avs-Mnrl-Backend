const MatchedRecord = require('../models/MatchedRecord');
const ActivityLog = require('../models/ActivityLog');

const getStats = async (req, res) => {
  try {
    const totalRecords = await MatchedRecord.countDocuments();
    const reportedCount = await MatchedRecord.countDocuments({ status: 'reported' });
    const suspectedCount = await MatchedRecord.countDocuments({ status: 'suspected' });

    res.json({
      totalRecords,
      reportedCount,
      suspectedCount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getRecentActivity = async (req, res) => {
  try {
    const activities = await ActivityLog.find()
      .populate('userId', 'email')
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getStats, getRecentActivity };