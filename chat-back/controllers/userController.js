const User = require('../models/user');

// البحث عن مستخدمين حسب اسم المستخدم (جزئي)
exports.searchUsers = async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ message: 'Query parameter required' });

  try {
    // البحث بدون استرجاع كلمات السر والطلبات
    const users = await User.find({
      username: { $regex: query, $options: 'i' }
    }).select('username status');

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
