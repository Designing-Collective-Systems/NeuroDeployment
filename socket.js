const pgClient = require('./db');

function setupSocket(io) {
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        // Caregiver binds a participant by username
        socket.on('bindparticipantByUsername', async ({ caregiverId, participantUsername }) => {
            try {
                const result = await pgClient.query('SELECT id FROM users WHERE username = $1', [participantUsername]);
                if (result.rows.length > 0) {
                    const participantId = result.rows[0].id;
                    const roomId = `room-${participantId}-${caregiverId}`;
                    socket.join(roomId);
                    console.log(`User joined room ${roomId}`);

                    await pgClient.query(
                        'INSERT INTO pairs (caregiver_id, participant_id, room_id) VALUES ($1, $2, $3) ON CONFLICT (caregiver_id, participant_id) DO NOTHING',
                        [caregiverId, participantId, roomId]
                    );

                    socket.emit('bindingSuccess', { roomId });
                } else {
                    socket.emit('bindingError', { msg: 'Participant username not found' });
                }
            } catch (error) {
                console.error('Error during binding:', error);
                socket.emit('bindingError', { msg: 'Binding failed due to an error' });
            }
        });

        // Participant requests roomId from server
        socket.on('getRoomForParticipant', async ({ participantUsername }) => {
            try {
                const result = await pgClient.query(
                    'SELECT room_id FROM pairs WHERE participant_id = (SELECT id FROM users WHERE username = $1)',
                    [participantUsername]
                );
                if (result.rows.length > 0) {
                    const roomId = result.rows[0].room_id;
                    socket.emit('receiveRoomId', { roomId }); // Send roomId to participant
                } else {
                    socket.emit('roomNotFound');
                }
            } catch (error) {
                console.error('Error retrieving roomId:', error);
                socket.emit('roomNotFound');
            }
        });
        
        

        // Go event handler
        socket.on('go', (roomId) => {
            const roomSockets = io.sockets.adapter.rooms.get(roomId);
            if (roomSockets) {
                console.log(`Room ${roomId} has the following clients:`, Array.from(roomSockets));
                io.to(roomId).emit('go');  
            } else {
                console.log(`Room ${roomId} does not exist or is empty.`);
            }
        });
        

        // Participant joins room
        socket.on('joinRoom', ({ roomId }) => {
            socket.join(roomId);
            console.log(`Participant joined room: ${roomId}`);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
}

module.exports = { setupSocket };
