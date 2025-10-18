const mongoose = require('mongoose');

const fraudNumberSchema = new mongoose.Schema({
  mobileNumber: { type: String, required: true, unique: true },
  status: { type: String, enum: ['Fraud', 'Suspected', 'Reported', 'Spam'], required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('FraudNumber', fraudNumberSchema);