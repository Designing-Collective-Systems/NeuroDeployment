CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('participant', 'caregiver')),
    avatar TEXT,  -- for avatar
    caption TEXT,  -- for caption
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);