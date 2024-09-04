const upload = require('../config/uploadConfig');
const pgClient = require('../db');

// avatar upload and storage of caption
const uploadAvatar = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(500).json({ msg: 'Error uploading avatar' });
    }

    if (!req.session.userId) {
      return res.status(403).json({ msg: 'You need to log in first' });
    }

    const avatarPath = req.file ? `/uploads/${req.file.filename}` : null;
    const caption = req.body.caption; // get caption

    try {
      // update avatar and caption info
      await pgClient.query(
        'UPDATE users SET avatar = $1, caption = $2 WHERE id = $3',
        [avatarPath, caption, req.session.userId]
      );
      res.json({ msg: 'Avatar uploaded and caption saved successfully!' });
    } catch (error) {
      console.error('Error uploading avatar or saving caption:', error);
      res.status(500).json({ msg: 'Error uploading avatar or saving caption' });
    }
  });
};

module.exports = {
  uploadAvatar
};
