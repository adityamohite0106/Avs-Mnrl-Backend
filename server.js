const express = require('express');
const dotenv = require('dotenv'); // ✅ Load .env first
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./config/db'); // ✅ Import DB connection function

// Routes
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const recordsRoutes = require('./routes/records');
const statsRoutes = require('./routes/stats');

// Load environment variables
dotenv.config(); // ✅ Load .env variables before using process.env

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

// Connect to DB
connectDB(); // ✅ This calls the async function to connect

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/stats', statsRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
