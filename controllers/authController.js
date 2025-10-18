const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

const login = async (req, res) => {
  console.log('Login Request Body:', req.body);
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log('Password mismatch for email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    await ActivityLog.create({ userId: user._id, action: 'Login', details: `User ${email} logged in` });

    res.json({ message: 'Login successful', token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const logout = async (req, res) => {
  try {
    await ActivityLog.create({ userId: req.user.userId, action: 'Logout', details: `User ${req.user.email} logged out` });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getMe = async (req, res) => {
  try {
    res.json({ id: req.user.userId, email: req.user.email, role: req.user.role });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { login, logout, getMe };