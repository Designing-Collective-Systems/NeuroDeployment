// app.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const bodyParser = require('body-parser');
const routes = require('./routes'); 
const { setupSocket } = require('./socket'); 

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({ secret: 'secretKey', resave: false, saveUninitialized: true }));

// using static file
app.use(express.static('public'));

// set routes
app.use('/', routes);

// set Socket.IO
setupSocket(io);

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});