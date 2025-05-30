const express = require('express');
const router = express.Router();
const fs = require('fs');
const cloudinary = require('../cloudinary');
const upload = require('../middlewares/multer');

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;

    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'auto',
    });

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
