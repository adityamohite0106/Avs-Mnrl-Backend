const express = require('express');
const router = express.Router();
const BankUpload = require('../models/BankUpload');
const MatchedRecord = require('../models/MatchedRecord');
const { auth } = require('../middleware/auth');

router.get('/bank-list', auth, async (req, res) => {
  try {
    const uploads = await BankUpload.find({ uploadedBy: req.user.userId })
      .populate('uploadedBy', 'email')
      .sort({ uploadedAt: -1 });
    console.log(`Bank uploads fetched for user ${req.user.userId}:`, uploads.length);
    res.json(uploads); // Fixed typo
  } catch (error) {
    console.error('Error fetching bank uploads:', error);
    res.status(500).json({ message: 'Error fetching bank uploads' });
  }
});

router.get('/fraud-list', auth, async (req, res) => {
  try {
    const uploadIds = await BankUpload.find({ uploadedBy: req.user.userId }).distinct('_id');
    if (!uploadIds.length) {
      console.log('No uploads found for user:', req.user.userId);
      return res.json([]);
    }
    console.log(`Fraud-list upload IDs for user ${req.user.userId}:`, uploadIds);
    const records = await MatchedRecord.find({
      status: 'Fraud',
      uploadId: { $in: uploadIds },
    })
      .populate('uploadId', 'filename')
      .sort({ createdAt: -1 });
    console.log(`Fraud records fetched:`, records.length, records.map(r => r.status));
    res.json(records);
  } catch (error) {
    console.error('Error fetching fraud list:', error);
    res.status(500).json({ message: 'Error fetching fraud list' });
  }
});

router.get('/suspected-list', auth, async (req, res) => {
  try {
    const uploadIds = await BankUpload.find({ uploadedBy: req.user.userId }).distinct('_id');
    if (!uploadIds.length) {
      console.log('No uploads found for user:', req.user.userId);
      return res.json([]);
    }
    console.log(`Suspected-list upload IDs for user ${req.user.userId}:`, uploadIds);
    const records = await MatchedRecord.find({
      status: 'Suspected',
      uploadId: { $in: uploadIds },
    })
      .populate('uploadId', 'filename')
      .sort({ createdAt: -1 });
    console.log(`Suspected records fetched:`, records.length, records.map(r => r.status));
    res.json(records);
  } catch (error) {
    console.error('Error fetching suspected list:', error);
    res.status(500).json({ message: 'Error fetching suspected list' });
  }
});

router.get('/reported-list', auth, async (req, res) => {
  try {
    const uploadIds = await BankUpload.find({ uploadedBy: req.user.userId }).distinct('_id');
    if (!uploadIds.length) {
      console.log('No uploads found for user:', req.user.userId);
      return res.json([]);
    }
    console.log(`Reported-list upload IDs for user ${req.user.userId}:`, uploadIds);
    const records = await MatchedRecord.find({
      status: 'Reported',
      uploadId: { $in: uploadIds },
    })
      .populate('uploadId', 'filename')
      .sort({ createdAt: -1 });
    console.log(`Reported records fetched:`, records.length, records.map(r => r.status));
    res.json(records);
  } catch (error) {
    console.error('Error fetching reported list:', error);
    res.status(500).json({ message: 'Error fetching reported list' });
  }
});

router.get('/spam-list', auth, async (req, res) => {
  try {
    const uploadIds = await BankUpload.find({ uploadedBy: req.user.userId }).distinct('_id');
    if (!uploadIds.length) {
      console.log('No uploads found for user:', req.user.userId);
      return res.json([]);
    }
    console.log(`Spam-list upload IDs for user ${req.user.userId}:`, uploadIds);
    const records = await MatchedRecord.find({
      status: 'Spam',
      uploadId: { $in: uploadIds },
    })
      .populate('uploadId', 'filename')
      .sort({ createdAt: -1 });
    console.log(`Spam records fetched:`, records.length, records.map(r => r.status));
    res.json(records);
  } catch (error) {
    console.error('Error fetching spam list:', error);
    res.status(500).json({ message: 'Error fetching spam list' });
  }
});

module.exports = router;