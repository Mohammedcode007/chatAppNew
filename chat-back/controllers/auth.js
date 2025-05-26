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
    // جلب كلمة السر بشكل صريح
    const user = await User.findOne({ username })
    .select('+password')
      .populate('friends') // جلب كل تفاصيل الأصدقاء
    if (!user) return res.status(400).json({ message: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid password' });

    user.status = 'online';
    await user.save();

    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET
    );

    const userObj = user.toObject();
    delete userObj.password;

    res.json({ token, user: userObj });
  } catch (err) {
    console.error('Login error:', err);
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



// دالة تعديل بيانات المستخدم
exports.updateUser = async (req, res) => {
  const userId = req.userId;
  const updates = req.body;

  // الحقول المسموح بتعديلها فقط
  const allowedUpdates = [
    'username',
    'password',
    'status',
    'coins',
    'selectedAvatar',
    'selectedFrame',
    'selectedEffect',
    'selectedBackground',
    'subscription',
  ];

  try {
    const updateKeys = Object.keys(updates);
    const isValidOperation = updateKeys.every(key => allowedUpdates.includes(key));

    if (!isValidOperation) {
      return res.status(400).json({ message: 'حقول التحديث غير صحيحة أو غير مسموح بتعديلها' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

    for (const key of updateKeys) {
      if (key === 'password') {
        // هاش كلمة المرور قبل الحفظ
        user.password = await bcrypt.hash(updates.password, 10);
      } else {
        user[key] = updates[key];
      }
    }

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    res.json({
      message: 'تم تحديث بيانات المستخدم بنجاح',
      user: userObj,
    });
  } catch (error) {
    console.error('خطأ في تحديث المستخدم:', error);
    res.status(500).json({ message: 'خطأ في الخادم، يرجى المحاولة لاحقًا' });
  }
};