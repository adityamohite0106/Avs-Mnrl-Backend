// routes/records.js
const express = require('express');
const router = express.Router();
const BankUpload = require('../models/BankUpload');
const MatchedRecord = require('../models/MatchedRecord');
const { auth } = require('../middleware/auth');

router.get('/bank-list', auth, async (req, res) => {
  try {
    const uploads = await BankUpload.find({ uploadedBy: req.user.userId })
      .populate('uploadedBy', 'email')
      .sort({ createdAt: -1 });
    console.log(`Bank uploads fetched for user ${req.user.userId}:`, uploads.length);
    res.json(uploads);
  } catch (error) {
    console.error('Error fetching bank uploads:', error);
    res.status(500).json({ message: 'Error fetching bank uploads' });
  }
});

router.get('/fraud-list', auth, async (req, res) => {
  try {
    // For admin users, show all fraud records. For regular users, show only their uploaded records
    const query = req.user.role === 'admin' 
      ? { status: 'Fraud' }
      : { status: 'Fraud', uploadedBy: req.user.userId };
    
    const records = await MatchedRecord.find(query)
      .populate('uploadId', 'filename')
      .sort({ createdAt: -1 });
    console.log(`Fraud records fetched for user ${req.user.userId} (role: ${req.user.role}):`, records.length);
    res.json(records);
  } catch (error) {
    console.error('Error fetching fraud list:', error);
    res.status(500).json({ message: 'Error fetching fraud list' });
  }
});

router.get('/suspected-list', auth, async (req, res) => {
  try {
    console.log('Fetching suspected list for user:', req.user);
    // For admin users, show all suspected records. For regular users, show only their uploaded records
    const query = req.user.role === 'admin' 
      ? { status: 'Suspected' }
      : { status: 'Suspected', uploadedBy: req.user.userId };
    
    const records = await MatchedRecord.find(query)
      .populate('uploadId', 'filename')
      .sort({ createdAt: -1 });
    console.log(`Fetched suspected records count for user ${req.user.userId} (role: ${req.user.role}):`, records.length);
    res.json(records);
  } catch (error) {
    console.error('Error fetching suspected list:', error);
    res.status(500).json({ message: 'Error fetching suspected list' });
  }
});

router.get('/reported-list', auth, async (req, res) => {
  try {
    console.log('Fetching reported list for user:', req.user);
    // For admin users, show all reported records. For regular users, show only their uploaded records
    const query = req.user.role === 'admin' 
      ? { status: 'Reported' }
      : { status: 'Reported', uploadedBy: req.user.userId };
    
    const records = await MatchedRecord.find(query)
      .populate('uploadId', 'filename')
      .sort({ createdAt: -1 });
    console.log(`Fetched reported records count for user ${req.user.userId} (role: ${req.user.role}):`, records.length);
    res.json(records);
  } catch (error) {
    console.error('Error fetching reported list:', error);
    res.status(500).json({ message: 'Error fetching reported list' });
  }
});

router.get('/spam-list', auth, async (req, res) => {
  try {
    console.log('Fetching spam list for user:', req.user);
    // For admin users, show all spam records. For regular users, show only their uploaded records
    const query = req.user.role === 'admin' 
      ? { status: 'Spam' }
      : { status: 'Spam', uploadedBy: req.user.userId };
    
    const records = await MatchedRecord.find(query)
      .populate('uploadId', 'filename')
      .sort({ createdAt: -1 });
    console.log(`Fetched spam records count for user ${req.user.userId} (role: ${req.user.role}):`, records.length);
    res.json(records);
  } catch (error) {
    console.error('Error fetching spam list:', error);
    res.status(500).json({ message: 'Error fetching spam list' });
  }
});

module.exports = router;