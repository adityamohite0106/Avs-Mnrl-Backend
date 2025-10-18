// routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const XLSX = require('xlsx');
const FraudNumber = require('../models/FraudNumber');
const BankUpload = require('../models/BankUpload');
const MatchedRecord = require('../models/MatchedRecord');
const BankRecord = require('../models/BankRecord');
const ActivityLog = require('../models/ActivityLog');
const { auth } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype;
    console.log('File received:', { originalname: file.originalname, mimetype: mimeType });
    if (
      (ext === '.xlsx' || ext === '.xls') &&
      (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        mimeType === 'application/vnd.ms-excel')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    }
  },
}).single('file');

router.post('/bank-data', auth, async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err.message);
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      console.error('No file uploaded or file rejected by multer');
      return res.status(400).json({ message: 'No file uploaded or invalid file type' });
    }

    try {
      const fs = require('fs');
      const uploadDir = './Uploads/';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      console.log('File uploaded:', req.file);
      console.log('User ID:', req.user.userId);
      const workbook = XLSX.readFile(req.file.path);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });

      console.log('Excel headers:', data[0]);
      console.log('First few rows:', data.slice(1, 3));

      const headers = data[0].reduce((acc, header) => {
        acc[header.toLowerCase().trim()] = header;
        return acc;
      }, {});

      const requiredHeaders = ['custno', 'mobile', 'date', 'effect_date'];
      const missingHeaders = requiredHeaders.filter((h) => !headers[h]);
      if (missingHeaders.length > 0) {
        console.error('Missing headers:', missingHeaders);
        return res.status(400).json({ message: `Missing required columns: ${missingHeaders.join(', ')}` });
      }

      let bankUpload;
      try {
        bankUpload = await BankUpload.create({
          filename: req.file.filename,
          uploadedBy: req.user.userId,
        });
        console.log('BankUpload created:', bankUpload._id);
      } catch (error) {
        console.error('Error creating BankUpload:', error.message, error.stack);
        throw error;
      }

      const fraudNumbers = await FraudNumber.find().select('mobileNumber status');
      console.log('Fraud numbers count:', fraudNumbers.length);
      console.log('Fraud numbers:', fraudNumbers.map(f => ({ mobileNumber: f.mobileNumber, status: f.status })));
      const fraudMap = new Map(fraudNumbers.map((num) => [
        String(num.mobileNumber).trim(),
        num.status ? num.status.charAt(0).toUpperCase() + num.status.slice(1).toLowerCase() : null
      ]));
      console.log('Fraud map:', Array.from(fraudMap.entries()));

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

      const bankRecords = [];
      const matchedRecords = [];

      data.slice(1).forEach((row, index) => {
        const rowData = {};
        data[0].forEach((header, i) => {
          rowData[header.toLowerCase().trim()] = row[i];
        });

        const mobile = String(rowData['mobile'] || '').trim();
        const custno = String(rowData['custno'] || '').trim();
        const date = parseDate(rowData['date']);
        const effectDate = parseDate(rowData['effect_date']);

        if (!mobile || !custno || !date || !effectDate) {
          console.warn(`Invalid row at index ${index + 1}:`, rowData);
          return;
        }

        const bankRecord = {
          custno,
          mobile,
          date,
          effectDate,
          uploadId: bankUpload._id,
          matched: fraudMap.has(mobile),
          status: fraudMap.get(mobile) || null,
        };

        bankRecords.push(bankRecord);

        if (fraudMap.has(mobile)) {
          matchedRecords.push({
            mobileNumber: mobile,
            customerNo: custno,
            date,
            effectDate,
            status: fraudMap.get(mobile),
            uploadId: bankUpload._id,
          });
        }
      });

      console.log('Bank records count:', bankRecords.length);
      console.log('Matched records count:', matchedRecords.length);
      console.log('Matched records to insert:', matchedRecords.map(r => ({ mobileNumber: r.mobileNumber, status: r.status })));

      if (bankRecords.length > 0) {
        try {
          await BankRecord.insertMany(bankRecords, { ordered: false });
          console.log('Bank records inserted successfully');
        } catch (error) {
          console.error('Error inserting bank records:', error.message, error.stack);
          throw error;
        }
      }

      if (matchedRecords.length === 0) {
        console.warn('No matched records found, but all data stored');
        await ActivityLog.create({
          userId: req.user.userId,
          action: 'Upload',
          details: `Uploaded file ${req.file.filename} with ${bankRecords.length} records, no matches found`,
        });
        return res.json({ message: 'File uploaded and stored, no matches found', uploadId: bankUpload._id });
      }

      try {
        const insertedRecords = await MatchedRecord.insertMany(matchedRecords, { ordered: false });
        console.log('Matched records inserted:', insertedRecords.length, insertedRecords.map(r => ({ mobile: r.mobileNumber, status: r.status })));
      } catch (error) {
        console.error('Error inserting matched records:', error.message, error.stack);
        throw error;
      }

      await ActivityLog.create({
        userId: req.user.userId,
        action: 'Upload',
        details: `Uploaded file ${req.file.filename} with ${matchedRecords.length} matched records (${matchedRecords.filter(r => r.status === 'Reported').length} Reported, ${matchedRecords.filter(r => r.status === 'Suspected').length} Suspected, ${matchedRecords.filter(r => r.status === 'Fraud').length} Fraud, ${matchedRecords.filter(r => r.status === 'Spam').length} Spam)`,
      });

      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });

      res.json({ message: 'File uploaded and processed successfully', uploadId: bankUpload._id });
    } catch (error) {
      console.error('Error processing file:', error.message, error.stack);
      res.status(500).json({ message: 'Error processing file', error: error.message });
    }
  });
});

module.exports = router;