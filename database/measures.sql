CREATE TABLE measures (
    id SERIAL PRIMARY KEY,  
    participant_id INTEGER REFERENCES users(id) ON DELETE CASCADE, 
    tapDuration VARCHAR(255),
    straightLineDistance FLOAT NOT NULL,
    totalDistanceTraveled VARCHAR(255) NOT NULL,
    totalTime VARCHAR(255) NOT NULL,
    averageDragSpeed VARCHAR(255) NOT NULL,
    lastSpeed VARCHAR(255) NOT NULL,
    peakSpeed VARCHAR(255) NOT NULL,
    timeToPeakSpeed VARCHAR(255) NOT NULL,
    lastAcceleration VARCHAR(255) NOT NULL,
    averageAcceleration VARCHAR(255) NOT NULL,
    tapAreaSize VARCHAR(255) NOT NULL,
    shortestPathDistance VARCHAR(255) NOT NULL
);
