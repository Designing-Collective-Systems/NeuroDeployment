const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const pgClient = require('./db'); 
const path = require('path');
const socketIo = require('socket.io');
const http = require('http'); 
const { setupSocket } = require('./socket'); 


const app = express();
const server = http.createServer(app);
const io = socketIo(server); 
setupSocket(io);
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
  
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
// set request body size
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
