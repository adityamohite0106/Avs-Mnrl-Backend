// backend/models/BankRecord.js
const mongoose = require('mongoose');

const bankRecordSchema = new mongoose.Schema({
  custno: { type: String, required: true },
  mobile: { type: String, required: true },
  date: { type: Date, required: true },
  effectDate: { type: Date, required: true },
  uploadId: { type: mongoose.Schema.Types.ObjectId, ref: 'BankUpload', required: true },
  matched: { type: Boolean, default: false },
  status: { type: String, enum: ['Fraud', 'Suspected', 'Reported', 'Spam', null], default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('BankRecord', bankRecordSchema);