const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const ActivityLog = require('./models/ActivityLog');
const BankRecord = require('./models/BankRecord');
const BankUpload = require('./models/BankUpload');
const FraudNumber = require('./models/FraudNumber');
const MatchedRecord = require('./models/MatchedRecord');
const connectDB = require('./config/db');

dotenv.config();
mongoose.set('bufferTimeoutMS', 20000);

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const sampleExcelData = [
  { custno: 'CUST001', mobile: '1234567890', date: '01-10-2025', effect_date: '02-10-2025' },
  { custno: 'CUST002', mobile: '0987654321', date: '03-10-2025', effect_date: '04-10-2025' },
];

const parseDate = (date) => {
  if (!date) return null;
  if (typeof date === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(date)) {
    const [day, month, year] = date.split('-').map(Number);
    const parsed = new Date(year, month - 1, day);
    return isNaN(parsed) ? null : parsed;
  }
  if (typeof date === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
    const [month, day, year] = date.split('/').map(Number);
    const parsed = new Date(year, month - 1, day);
    return isNaN(parsed) ? null : parsed;
  }
  const parsed = new Date(date);
  return isNaN(parsed) ? null : parsed;
};

const seedData = async () => {
  try {
    let retries = 5;
    while (retries > 0) {
      try {
        await connectDB();
        break;
      } catch (err) {
        console.error(`Connection attempt failed, ${retries} retries left:`, err.message);
        retries--;
        if (retries === 0) throw err;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      ActivityLog.deleteMany({}),
      BankRecord.deleteMany({}),
      BankUpload.deleteMany({}),
      FraudNumber.deleteMany({}),
      MatchedRecord.deleteMany({}),
    ]);
    console.log('Existing data cleared');

    const adminPassword = await hashPassword('admin123');
    const userPassword = await hashPassword('user123');

    const users = await User.insertMany([
      { email: 'admin@bank.com', password: adminPassword, role: 'admin' },
      { email: 'user@bank.com', password: userPassword, role: 'user' },
    ]);
    console.log('Users seeded');

    const adminId = users[0]._id;
    const bankUploads = await BankUpload.insertMany([
      {
        filename: '1760767167791-customer_list.xlsx',
        uploadedBy: adminId,
        uploadedAt: new Date('2025-10-18T11:29:27+05:30'),
      },
    ]);
    console.log('BankUploads seeded', bankUploads.map(u => u._id)); // Log upload IDs

    const uploadId = bankUploads[0]._id;
    const fraudNumbers = await FraudNumber.insertMany([
      { mobileNumber: '1234567890', status: 'Fraud' },
      { mobileNumber: '0987654321', status: 'Suspected' },
    ]);
    console.log('FraudNumbers seeded');

    const fraudMap = new Map(fraudNumbers.map(num => [
      String(num.mobileNumber).trim(),
      num.status ? num.status.charAt(0).toUpperCase() + num.status.slice(1).toLowerCase() : null,
    ]));

    const bankRecords = sampleExcelData.map(row => {
      const mobile = String(row.mobile).trim();
      return {
        custno: String(row.custno).trim(),
        mobile,
        date: parseDate(row.date),
        effectDate: parseDate(row.effect_date),
        uploadId,
        matched: fraudMap.has(mobile),
        status: fraudMap.get(mobile) || null,
      };
    });

    await BankRecord.insertMany(bankRecords);
    console.log('BankRecords seeded');

    const matchedRecords = bankRecords
      .filter(record => record.matched)
      .map(record => ({
        mobileNumber: record.mobile,
        customerNo: record.custno,
        date: record.date,
        effectDate: record.effectDate,
        status: record.status,
        uploadId,
      }));

    if (matchedRecords.length > 0) {
      await MatchedRecord.insertMany(matchedRecords);
      console.log('MatchedRecords seeded');
    }

    await ActivityLog.insertMany([
      {
        userId: adminId,
        action: 'Upload',
        details: `Uploaded file 1760767167791-customer_list.xlsx with ${bankRecords.length} records, ${matchedRecords.length} matches found`,
      },
    ]);
    console.log('ActivityLogs seeded');

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error.message, error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

seedData();