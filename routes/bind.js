// const express = require('express');
// const pgClient = require('../db'); 
// const router = express.Router();

// router.post('/bind', async (req, res) => {
//     const { participantId, caregiverId } = req.body;
//     try {
//         // create a unique roomID
//         const roomId = `room-${Math.floor(Math.random() * 10000)}`;

//         // insert binding info to database
//         await pgClient.query(
//             'INSERT INTO caregiver_participant (participant_id, caregiver_id, room_id) VALUES ($1, $2, $3)',
//             [participantId, caregiverId, roomId]
//         );

//         res.json({ success: true, roomId: roomId });
//     } catch (error) {
//         console.error('Error binding participant and caregiver:', error);
//         res.status(500).json({ success: false, error: 'Failed to bind participant and caregiver' });
//     }
// });

// module.exports = router;