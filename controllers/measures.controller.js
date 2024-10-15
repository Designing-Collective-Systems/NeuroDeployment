const pgClient = require('../db');

// Get all measures
const getMeasures = async (req, res) => {
    try {
        const result = await pgClient.query(`
            SELECT * FROM measures
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching measures:', error);
        res.status(500).json({ message: error.message });
    }
}

exports.getMeasuresByParticipantId = async (req, res) => {
    const participantId = req.session.userId || req.params.participantId;
    try {
        const result = await pgClient.query(`
            SELECT * FROM measures WHERE participant_id = $1
        `, [participantId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching measures for participant:', error);
        res.status(500).json({ message: 'Error fetching measures for participant' });
    }
};

// Get measure by id
const getMeasuresById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pgClient.query(`
            SELECT * FROM measures WHERE id = $1
        `, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Measure not found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching measure by id:', error);
        res.status(500).json({ message: error.message });
    }
}


// Create a new measure
const createMeasures = async (req, res) => {
    const participantId = req.session.userId || req.body.participantId;

    const {
        tapDuration, straightLineDistance, totalDistanceTraveled,
        totalTime, averageDragSpeed, lastSpeed, peakSpeed, timeToPeakSpeed,
        lastAcceleration, averageAcceleration, tapAreaSize, shortestPathDistance
    } = req.body;

    try {
        const result = await pgClient.query(`
            INSERT INTO measures (participant_id, tap_duration, straight_line_distance, total_distance_traveled, total_time, average_drag_speed, last_speed, peak_speed, time_to_peak_speed, last_acceleration, average_acceleration, tap_area_size, shortest_path_distance)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `, [
            participantId, tapDuration, straightLineDistance, totalDistanceTraveled,
            totalTime, averageDragSpeed, lastSpeed, peakSpeed, timeToPeakSpeed,
            lastAcceleration, averageAcceleration, tapAreaSize, shortestPathDistance
        ]);
        console.log('Data inserted successfully:', result.rows[0]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating measure:', error);
        res.status(500).json({ message: error.message });
    }
}

// Save measure
// const saveMeasures = async (req, res) => {
//     console.log('Received data:', req.body);
//     const {
//         participantId, tapDuration, straightLineDistance, totalDistanceTraveled,
//         totalTime, averageDragSpeed, lastSpeed, peakSpeed, timeToPeakSpeed,
//         lastAcceleration, averageAcceleration, tapAreaSize, shortestPathDistance
//     } = req.body;

//     if (!straightLineDistance) {
//         return res.status(400).json({ message: 'straight_line_distance is required' });
//     }

//     try {
//         const result = await pgClient.query(`
//             INSERT INTO measures (participant_id, tap_duration, straight_line_distance, total_distance_traveled, total_time, average_drag_speed, last_speed, peak_speed, time_to_peak_speed, last_acceleration, average_acceleration, tap_area_size, shortest_path_distance)
//             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
//             RETURNING *
//         `, [
//             participantId, tapDuration, straightLineDistance, totalDistanceTraveled,
//             totalTime, averageDragSpeed, lastSpeed, peakSpeed, timeToPeakSpeed,
//             lastAcceleration, averageAcceleration, tapAreaSize, shortestPathDistance
//         ]);

//         res.status(201).json({ message: 'Data saved successfully', data: result.rows[0] });
//     } catch (error) {
//         console.error('Error saving measure:', error);
//         res.status(500).json({ message: 'Error saving measure' });
//     }
// }
const saveMeasures = async (req, res) => {
    console.log('Route hit');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

    const participantId = req.session.userId || req.body.participantId;
    // const participantId = req.body.participantId; 
    console.log("Save measure Participant ID:", participantId);
    const {
        tapDuration, straightLineDistance, totalDistanceTraveled,
        totalTime, averageDragSpeed, lastSpeed, peakSpeed, timeToPeakSpeed,
        lastAcceleration, averageAcceleration, tapAreaSize, shortestPathDistance
    } = req.body;

    try {
        const result = await pgClient.query(`
            INSERT INTO measures (participant_id, tap_duration, straight_line_distance, total_distance_traveled, total_time, average_drag_speed, last_speed, peak_speed, time_to_peak_speed, last_acceleration, average_acceleration, tap_area_size, shortest_path_distance)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `, [
            participantId, 
            tapDuration, straightLineDistance, totalDistanceTraveled,
            totalTime, averageDragSpeed, lastSpeed, peakSpeed, timeToPeakSpeed,
            lastAcceleration, averageAcceleration, tapAreaSize, shortestPathDistance
        ]);

        console.log('Data saved:', result.rows[0]);
        res.status(201).json({ message: 'Data saved successfully', data: result.rows[0] });
    } catch (error) {
        console.error('Error saving measure:', error);
        res.status(500).json({ message: 'Error saving measure' });
    }
}



// Update measure
const updateMeasures = async (req, res) => {
    const { id } = req.params;
    const {
        tapDuration, straightLineDistance, totalDistanceTraveled, totalTime,
        averageDragSpeed, lastSpeed, peakSpeed, timeToPeakSpeed, lastAcceleration,
        averageAcceleration, tapAreaSize, shortestPathDistance
    } = req.body;

    try {
        const result = await pgClient.query(`
            UPDATE measures 
            SET tap_duration = $1, straight_line_distance = $2, total_distance_traveled = $3, total_time = $4, average_drag_speed = $5, last_speed = $6, peak_speed = $7, time_to_peak_speed = $8, last_acceleration = $9, average_acceleration = $10, tap_area_size = $11, shortest_path_distance = $12
            WHERE id = $13
            RETURNING *
        `, [
            tapDuration, straightLineDistance, totalDistanceTraveled, totalTime,
            averageDragSpeed, lastSpeed, peakSpeed, timeToPeakSpeed, lastAcceleration,
            averageAcceleration, tapAreaSize, shortestPathDistance, id
        ]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Measure not found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error updating measure:', error);
        res.status(500).json({ message: error.message });
    }
}

// Delete measure
const deleteMeasures = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pgClient.query(`
            DELETE FROM measures WHERE id = $1 RETURNING *
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Measure not found' });
        }

        res.status(200).json({ message: 'Measure deleted successfully' });
    } catch (error) {
        console.error('Error deleting measure:', error);
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    getMeasures,
    getMeasuresById,
    createMeasures,
    updateMeasures,
    deleteMeasures,
    saveMeasures
};
