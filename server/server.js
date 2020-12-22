const path = require('path');
const http = require('http');
const express  = require('express');
const socketio = require('socket.io');

const publicPath = path.join(__dirname, '/../public');
const port = process.env.PORT || 8080;
let app = express();
let server = http.createServer(app);
let io = socketio(server);

app.use(express.static(publicPath));

server.listen(port, ()=> {
    console.log(`Server is up on port ${port}.`)
});

io.on('connection', (socket) => {
	console.log('User connected.');

    socket.on('disconnect', () => {
        console.log('User disconnected.');
    });

    socket.on('startGame', (roundData) => {
    	io.emit('startGame', roundData);
    });

    socket.on('cardClick', (ev) => {
        io.emit('cardClick', ev);
    });
});
