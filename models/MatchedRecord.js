// models/MatchedRecord.js
const mongoose = require('mongoose');

const matchedRecordSchema = new mongoose.Schema({
  mobileNumber: { type: String, required: true },
  customerNo: { type: String, required: true },
  date: { type: Date, required: true },
  effectDate: { type: Date, required: true },
  status: { type: String, required: true }, // Removed enum to avoid validation issues
  uploadId: { type: mongoose.Schema.Types.ObjectId, ref: 'BankUpload', required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('MatchedRecord', matchedRecordSchema);