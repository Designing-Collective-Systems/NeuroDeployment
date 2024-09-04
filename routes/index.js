const express = require('express');
const authController = require('../controllers/authController');
const upload = require('../config/uploadConfig'); 

const router = express.Router();

// Register route with file upload
router.post('/register', upload.single('avatar'), authController.register);

// Login route
router.post('/login', authController.login);

// Upload avatar route
router.post('/uploadAvatar', upload.single('avatar'), authController.uploadAvatar);
// Logout route
router.get('/logout', authController.logout);

module.exports = router;