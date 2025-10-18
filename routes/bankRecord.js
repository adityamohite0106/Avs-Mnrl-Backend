const express = require('express');
const router = express.Router();
const BankRecord = require('../models/BankRecord');
const { auth } = require('../middleware/auth');

router.get('/:uploadId', auth, async (req, res) => {
  try {
    const records = await BankRecord.find({ uploadId: req.params.uploadId }).populate('uploadId', 'filename');
    if (!records.length) {
      return res.status(404).json({ message: 'No records found for this upload ID' });
    }
    res.json(records);
  } catch (error) {
    console.error('Error fetching bank records:', error);
    res.status(500).json({ message: 'Error fetching bank records', error: error.message });
  }
});

module.exports = router;