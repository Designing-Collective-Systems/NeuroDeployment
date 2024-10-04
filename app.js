const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const pgClient = require('./db'); 
const path = require('path');
const dotenv = require('dotenv');


// dotenv.config();

const app = express();

// Session setup
app.use(session({
    store: new pgSession({
        pool: pgClient,         
        tableName: 'session'    
    }),
    secret: process.env.SESSION_SECRET || 'defaultSecret', 
    resave: false,            
    saveUninitialized: false,
    cookie: { 
        maxAge: 30 * 24 * 60 * 60 * 1000 
    }
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', require('./routes/api'));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'test1.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
