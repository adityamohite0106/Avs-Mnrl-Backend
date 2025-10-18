const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Changed to 7 days
    );

    // ✅ CRITICAL FIX: Return token in response body
    res.json({ 
      message: 'Login successful',
      token,  // ← ADD THIS LINE!
      user: { 
        id: user._id,  // ← Also add id
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/logout', auth, (req, res) => {
  try {
    // ✅ With Bearer token auth, logout is handled client-side
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('email role');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ 
      user: { 
        id: user._id,  // ← Add id here too
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;