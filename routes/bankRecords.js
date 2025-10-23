// routes/bankRecords.js
const express = require('express');
const router = express.Router();
const BankRecord = require('../models/BankRecord');
const { auth } = require('../middleware/auth');

router.get('/:uploadId', auth, async (req, res) => {
  try {
    const { uploadId } = req.params;
    const records = await BankRecord.find({ uploadId });
    if (!records.length) {
      return res.status(404).json({ message: 'No records found for this upload ID' });
    }
    res.json(records);
  } catch (error) {
    console.error('Error fetching bank records:', error);
    res.status(500).json({ message: 'Failed to fetch bank records' });
  }
});

module.exports = router;