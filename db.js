const pg = require('pg');

const pgClient = new pg.Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://zhanyijun:1234@localhost:5432/cognition_db',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

pgClient.connect();


module.exports = pgClient;
