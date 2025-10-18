const multer = require('multer');
const path = require('path');
const XLSX = require('xlsx');
const FraudNumber = require('../models/FraudNumber');
const BankUpload = require('../models/BankUpload');
const MatchedRecord = require('../models/MatchedRecord');
const ActivityLog = require('../models/ActivityLog');

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

const uploadBankData = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });

    try {
      const fs = require('fs');
      const uploadDir = './uploads/';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

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
        return res.status(400).json({ message: `Missing required columns: ${missingHeaders.join(', ')}` });
      }

      const bankUpload = await BankUpload.create({
        filename: req.file.filename,
        uploadedBy: req.user._id,
      });

      const fraudNumbers = await FraudNumber.find().select('mobileNumber status');
      const fraudMap = new Map(fraudNumbers.map((num) => [String(num.mobileNumber), num.status]));

      const parseDate = (date) => {
        if (typeof date === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(date)) {
          const [day, month, year] = date.split('-').map(Number);
          const parsed = new Date(year, month - 1, day);
          return isNaN(parsed) ? null : parsed;
        }
        const parsed = new Date(date);
        return isNaN(parsed) ? null : parsed;
      };

      const matchedRecords = data.slice(1).map((row, index) => {
        const rowData = {};
        data[0].forEach((header, i) => {
          rowData[header.toLowerCase().trim()] = row[i];
        });

        const mobile = String(rowData['mobile'] || '');
        if (!fraudMap.has(mobile)) {
          console.log(`No fraud match for mobile ${mobile} at index ${index + 1}`);
          return null;
        }

        if (!mobile || !rowData.custno || !rowData.date || !rowData['effect_date']) {
          console.warn(`Invalid row at index ${index + 1}:`, rowData);
          return null;
        }

        const date = parseDate(rowData.date);
        const effectDate = parseDate(rowData['effect_date']);
        if (!date || !effectDate) {
          console.warn(`Invalid date in row at index ${index + 1}:`, rowData);
          return null;
        }

        return {
          mobileNumber: mobile,
          customerNo: rowData.custno,
          date,
          effectDate,
          status: fraudMap.get(mobile),
          uploadId: bankUpload._id,
        };
      }).filter((record) => record !== null);

      if (matchedRecords.length === 0) {
        return res.status(400).json({
          message: 'No records in the file matched the fraud number list.',
        });
      }

      await MatchedRecord.insertMany(matchedRecords, { ordered: false });
      await ActivityLog.create({
        userId: req.user._id,
        action: 'Upload',
        details: `Uploaded file ${req.file.filename} with ${matchedRecords.length} matched fraud records`,
      });

      res.json({ message: 'File uploaded and processed successfully', uploadId: bankUpload._id });
    } catch (error) {
      console.error('Error processing file:', error.message, error.stack);
      res.status(500).json({ message: 'Error processing file', error: error.message });
    }
  });
};

module.exports = { uploadBankData };


