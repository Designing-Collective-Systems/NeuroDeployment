CREATE TABLE IF NOT EXISTS pairs (
    id SERIAL PRIMARY KEY,
    caregiver_id INTEGER REFERENCES users(id),
    participant_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
