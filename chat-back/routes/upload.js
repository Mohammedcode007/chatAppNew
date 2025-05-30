// const express = require('express');
// const router = express.Router();
// const fs = require('fs');
// const upload = require('../middlewares/multer');
// const cloudinary = require('../cloudinary');

// router.post('/upload', upload.single('file'), async (req, res) => {
//   try {
//     const filePath = req.file.path;

//     const result = await cloudinary.uploader.upload(filePath, {
//       resource_type: 'auto',
//     });

//     fs.unlinkSync(filePath);

//     res.json({
//       message: 'Upload successful',
//       url: result.secure_url,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Upload failed', error });
//   }
// });

// module.exports = router;
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const upload = require('../middlewares/multer'); // تأكد أن الملف موجود ويُصدّر multer
const cloudinary = require('../cloudinary'); // تأكد من التهيئة الصحيحة

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();

    let uploadOptions = {};
    if (['.mp3', '.m4a', '.wav'].includes(ext)) {
      uploadOptions = { resource_type: 'video', format: 'mp3' };
    } else if (ext === '.gif') {
      uploadOptions = { resource_type: 'image', format: 'gif' };
    } else {
      uploadOptions = { resource_type: 'image' };
    }

    const result = await cloudinary.uploader.upload(filePath, uploadOptions);

    fs.unlinkSync(filePath);

    res.json({
      message: 'Upload successful',
      url: result.secure_url,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Upload failed', error });
  }
});

module.exports = router;
