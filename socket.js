const pgClient = require('./db');

function setupSocket(io) {
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        // binding event
        socket.on('bindPatientByUsername', async ({ caregiverId, patientUsername }) => {
            try {
                const result = await pgClient.query('SELECT id FROM users WHERE username = $1', [patientUsername]);
                if (result.rows.length > 0) {
                    const patientId = result.rows[0].id;
                    const roomId = `room-${patientId}-${caregiverId}`;
                    socket.join(roomId);
                    console.log(`Caregiver ${caregiverId} and patient ${patientId} are in room ${roomId}`);
                    socket.emit('bindingSuccess', { roomId });
                } else {
                    socket.emit('bindingError', { msg: 'Patient username not found' });
                }
            } catch (error) {
                console.error('Error during binding:', error);
                socket.emit('bindingError', { msg: 'Binding failed due to an error' });
            }
        });

        socket.on('go', (roomId) => {
            io.to(roomId).emit('go');
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
}

module.exports = { setupSocket };