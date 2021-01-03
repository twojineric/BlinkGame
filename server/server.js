const path = require('path');
const http = require('http');
const express  = require('express');
const socketio = require('socket.io');

const publicPath = path.join(__dirname, '/../public');
const port = process.env.PORT || 8080;
let app = express();
let server = http.createServer(app);
let io = socketio(server);

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

app.use(express.static(publicPath));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/../public/gameRoom.html'));
});

server.listen(port, () => {
    console.log(`Server is up on port ${port}.`)
});

io.on('connection', (socket) => {
	console.log('User connected.');

    socket.on('disconnect', () => {
        console.log('User disconnected.');
    });

    socket.on('createRoom', (data) => {
        let roomCode = genRoomCode(5);
        socket.join(roomCode);
        io.to(roomCode).emit('player1', {
            name: data.name,
            roomCode: roomCode
        });
    });

    socket.on('joinRoom', async (data) => {
        let members = await io.of("/").in(data.roomCode).allSockets();
        if(true)
        {
            socket.join(data.roomCode);
            io.to(data.roomCode).emit('player2', {
                name: data.name,
                roomCode: data.roomCode
            });
        }
    });

    socket.on('update', (data) => {
        io.to(data.roomCode).emit('update', data);
    });

    socket.on('startRound', (roundData) => {
    	io.to(roundData.roomCode).emit('startRound', roundData);
    });

    socket.on('updateGamestate', (data) => {
        io.to(data.roomCode).emit('updateGamestate', data);
    })

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
            io.to(info.roomCode).emit('gameWinner', {
                name: winner.name,
                gameData: theGame
            });
        }
        else //no winner yet
        {
            let nextRound = info.nextRound;
            theGame.rounds.push(nextRound);
            roundNum = theGame.rounds.length - 1;
            theGame.roundWins[roundNum] = 0; //new round

            io.to(info.roomCode).emit('roundWin', {
                gameData: theGame
            });
        }
    });
});

//creates a random string with length len using only uppercase a-z.
function genRoomCode(len)
{
    let code = "";
    for(let i = 0; i < len; i++)
    {
        code = code + letters.charAt(Math.random() * letters.length);
    }
    return code;
}
