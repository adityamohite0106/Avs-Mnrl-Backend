const FraudNumber = require('../models/FraudNumber');
const BankUpload = require('../models/BankUpload');
const MatchedRecord = require('../models/MatchedRecord');

const getBankList = async (req, res) => {
  try {
    const uploads = await BankUpload.find({ uploadedBy: req.user._id })
      .populate('uploadedBy', 'email')
      .sort({ uploadedAt: -1 });
    res.json(uploads);
  } catch (error) {
    console.error('Error fetching bank uploads:', error);
    res.status(500).json({ message: 'Error fetching bank uploads' });
  }
};

const getSpamList = async (req, res) => {
  try {
    const records = await MatchedRecord.find({ status: 'Spam' }).populate('uploadId', 'filename');
    res.json(records);
  } catch (error) {
    console.error('Error fetching spam list:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getFraudList = async (req, res) => {
  try {
    const uploadIds = await BankUpload.find({ uploadedBy: req.user._id }).distinct('_id');
    const records = await MatchedRecord.find({
      status: 'fraud',
      uploadId: { $in: uploadIds },
    })
      .populate('uploadId', 'filename')
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    console.error('Error fetching fraud list:', error);
    res.status(500).json({ message: 'Error fetching fraud list' });
  }
};

const getSuspectedList = async (req, res) => {
  try {
    const records = await MatchedRecord.find({ status: 'Suspected' }).populate('uploadId', 'filename');
    res.json(records);
  } catch (error) {
    console.error('Error fetching suspected list:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getReportedList = async (req, res) => {
  try {
    const records = await MatchedRecord.find({ status: 'Reported' }).populate('uploadId', 'filename');
    res.json(records);
  } catch (error) {
    console.error('Error fetching reported list:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getBankList, getFraudList, getSuspectedList, getReportedList , getSpamList};