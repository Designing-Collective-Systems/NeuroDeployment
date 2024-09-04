const express = require('express');
const resultsController = require('../controllers/resultsController');

const router = express.Router();

router.get('/calculateResult', resultsController.getLatestResult);

router.post('/submitdata', resultsController.submitResult);

module.exports = router;
