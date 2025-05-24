const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
exports.signup = async (req, res) => {
  const { username, password } = req.body;
  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: 'Username already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashed, status: 'offline', friends: [] });
    await user.save();
    res.json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Signup error:', err);  // <-- هنا طباعة الخطأ المفصل
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid password' });

    user.status = 'online';
    await user.save();

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET);
    res.json({ token, user: { username: user.username, status: user.status, friends: user.friends } });
  } catch (err) {
    console.error('Login error:', err);  // <-- هنا طباعة الخطأ المفصل
    res.status(500).json({ message: 'Server error' });
  }
};

// في ملف controller الخاص بالمستخدم

exports.logout = async (req, res) => {
  try {
    // نستخدم req.userId كما هو معرف في الـ middleware للتحقق من التوكن
    const userId = req.userId;

    // تحديث حالة المستخدم في قاعدة البيانات إلى "offline"
    await User.findByIdAndUpdate(userId, { status: 'offline' });

    // إضافة نظام blacklist للتوكن (اختياري)

    res.json({ message: 'User logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
