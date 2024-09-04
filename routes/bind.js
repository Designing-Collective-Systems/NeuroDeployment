// const express = require('express');
// const pgClient = require('../db'); 
// const router = express.Router();

// router.post('/bind', async (req, res) => {
//     const { patientId, caregiverId } = req.body;
//     try {
//         // create a unique roomID
//         const roomId = `room-${Math.floor(Math.random() * 10000)}`;

//         // insert binding info to database
//         await pgClient.query(
//             'INSERT INTO caregiver_patient (patient_id, caregiver_id, room_id) VALUES ($1, $2, $3)',
//             [patientId, caregiverId, roomId]
//         );

//         res.json({ success: true, roomId: roomId });
//     } catch (error) {
//         console.error('Error binding patient and caregiver:', error);
//         res.status(500).json({ success: false, error: 'Failed to bind patient and caregiver' });
//     }
// });

// module.exports = router;