const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, rollnumber: user.rollnumber, isAdmin: user.isAdmin },
    process.env.JWT_SECRET || 'my_attendance_secret_jwt_key_2026',
    { expiresIn: '30d' }
  );
};

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, rollnumber, email, phone, password, roomno } = req.body;
    if (!name || !rollnumber || !email || !phone || !password || !roomno) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const existing = await User.findOne({ rollnumber });
    if (existing) {
      return res.status(409).json({ message: 'Roll number already exists' });
    }
    const user = new User({ name, rollnumber, email, phone, password, roomno, isAdmin: false });
    await user.save();
    
    const token = generateToken(user);
    res.status(201).json({
      message: 'User registered',
      token,
      user: { rollnumber, name, email, phone, roomno, isAdmin: false }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { rollnumber, password } = req.body;
    if (!rollnumber || !password) {
      return res.status(400).json({ message: 'Roll number and password required' });
    }
    const user = await User.findOne({ rollnumber });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid roll number or password' });
    }
    
    const token = generateToken(user);
    res.json({
      message: 'Login successful',
      token,
      user: { rollnumber: user.rollnumber, name: user.name, email: user.email, phone: user.phone, roomno: user.roomno, isAdmin: user.isAdmin }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
