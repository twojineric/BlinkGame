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

    socket.on('startRound', (roundData) => {
    	io.emit('startRound', roundData);
    });

    socket.on('cardClick', (ev) => {
        io.emit('cardClick', ev);
    });

    socket.on('roundWin', (info) => {
        let theGame = info.gameData;
        let winner = info.player;
        let roundNum = theGame.rounds.length - 1;
        let playerID = parseInt(info.playerNum, 10) + 1
        theGame.roundWins[roundNum] = playerID;

        let playerWinCount = 0;

        for(const r of theGame.roundWins)
        {
            if(r == playerID) playerWinCount++;
        }

        if(playerWinCount == ((theGame.roundWins.length - 1) / 2 + 1))
        {
            //someone has won the game
            io.emit('gameWinner', {
                name: winner.name
            });
        }
        else //no winner
        {
            let nextRound = info.nextRound;
            theGame.rounds.push(nextRound);
            roundNum = theGame.rounds.length - 1;
            theGame.roundWins[roundNum] = 0; //new round

            io.emit('roundWin', {
                gameData: theGame
            });
        }

    })
});
