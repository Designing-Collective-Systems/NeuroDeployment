CREATE TABLE pairs (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES users(id),
    caregiver_id INTEGER REFERENCES users(id),
    room_id TEXT
);