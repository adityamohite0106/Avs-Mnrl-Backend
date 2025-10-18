// models/BankUpload.js
const mongoose = require('mongoose');

const bankUploadSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('BankUpload', bankUploadSchema);