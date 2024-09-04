const pg = require('pg');

const pgClient = new pg.Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1234@localhost:5432/cognition',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

pgClient.connect();

module.exports = pgClient;
