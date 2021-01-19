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

    socket.on('createRoom', (data) => {
        let roomCode = genRoomCode(5);
        socket.join(roomCode);
        io.to(roomCode).emit('player1', {
            name: data.name,
            roomCode: roomCode
        });
    });

    socket.on('validateRoom', async (data) => { //if roomcode has another person in it, join the room
        let members = await io.of("/").in(data.roomCode).allSockets();
        if(members.size == 1)
        {
            socket.join(data.roomCode);
            io.to(data.roomCode).emit('player2', {
                name: data.name,
                roomCode: data.roomCode
            });
        }
        else
        {
            io.to(socket.id).emit('invalid');
        }
    });

    socket.on('update', (data) => {
        io.to(data.roomCode).emit('update', data);
    });

    socket.on('options', (data) => {
        io.to(data.roomCode).emit('options', data);
    })

    socket.on('readyUp', (data) => {
        io.to(data.roomCode).emit('readyUp', data);
    })

    socket.on('startRound', (roundData) => {
    	io.to(roundData.roomCode).emit('startRound', roundData);
    });

    socket.on('updateGamestate', (data) => {
        io.to(data.roomCode).emit('updateGamestate', data);
    });

    socket.on('noMoves', (data) => {
        let symbolArr = ['✖', '◆', '●', '■', '▲', '★'];
        let colorArr = ['blue', 'red', 'green', 'black', 'yellow', 'purple'];
        let numArr = ["one", "two", "three", "four", "five"];

        for (let i = symbolArr.length - 1; i > 0; i--)
        {
            let j = Math.floor(Math.random() * (i + 1));
            let temp1 = symbolArr[i];
            symbolArr[i] = symbolArr[j];
            symbolArr[j] = temp1;
            let k = Math.floor(Math.random() * (i + 1));
            let temp2 = colorArr[i];
            colorArr[i] = colorArr[k];
            colorArr[k] = temp2;
        }
        for(let i = numArr.length - 1; i > 0; i--)
        {
            let j = Math.floor(Math.random() * (i + 1));
            let temp = numArr[i];
            numArr[i] = numArr[j];
            numArr[j] = temp;
        }
        //we shuffle the decks like this rather than just do Math.random()
        //to ensure the new cards on the piles are as different from each other as possible.
        //this shouldnt be called that often, so speed isnt an issue.
        io.to(data.roomCode).emit('noMoves', {
            p1Color: colorArr[0],
            p1Symbol: symbolArr[0],
            p1Num: numArr[0],
            p2Color: colorArr[colorArr.length - 1],
            p2Symbol: symbolArr[symbolArr.length - 1],
            p2Num: numArr[numArr.length - 1]
        });
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
                name: winner.name,
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
