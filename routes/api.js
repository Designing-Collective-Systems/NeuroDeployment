const express = require('express');
const resultsController = require('../controllers/resultsController');
const measureController = require('../controllers/measures.controller');
const authController = require('../controllers/authController');
// const upload = require('../config/uploadConfig'); 

const router = express.Router();

// Use express.json() to parse JSON bodies automatically
router.use(express.json());

// Measures routes
router.get('/measures', measureController.getMeasures); // Get all measures
router.get('/measures/:id', measureController.getMeasuresById); // Get measure by id
// router.get('/measures/participant/:participantId', measureController.getMeasuresByParticipantId);

router.post('/measures/results', measureController.createMeasures); // Post measure
router.post('/measures/save', measureController.saveMeasures); // Save measure
router.put('/measures/:id', measureController.updateMeasures); // Update measure by id
router.delete('/measures/:id', measureController.deleteMeasures); // Delete measure by id

// Results routes
router.get('/results/calculateResult', resultsController.getLatestResult);
router.post('/results/submitdata', resultsController.submitResult);

// Auth routes

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/logout', authController.logout);

module.exports = router;
