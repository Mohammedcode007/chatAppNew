// middlewares/multer.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// تأكد أن مجلد tmp موجود
const dir = 'tmp';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'tmp/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

module.exports = upload;
