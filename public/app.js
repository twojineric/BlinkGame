import { Round } from './helpers/round.js';
import { Game } from './helpers/game.js';
let socket = io();

let theGame; //game obj that is passed to the server, the game consists of an array of round objects
let currRound; //curr round obj
let rmcde;
let modal = document.getElementById("myModal");

let isP2; //used for rendering hands
//boolean ensures that the correct set of cards are displayed at the bottom of the screen for each player

$( document ).ready(() => {

    modal.style.display = "block";
    document.getElementById("topEdge").style.display = "none";
    $('#createRoom').on('click', () => {
        let username = $('#nameCreate').val().trim();
        if(!username)
        {
          alert('Please enter your name.');
          return;
        }
        modal.style.display = "none";
        document.getElementById("optionsMenu").hidden = false;
        document.getElementById("startGame").hidden = false;
        document.getElementById("topEdge").style.display = "flex";
        isP2 = false;
        socket.emit('createRoom', {
            name: username
        });
    });

    $('#joinRoom').on('click', () => {
        //implement a way to check if the room code is valid
        let username = $('#nameJoin').val().trim();
        let roomCode = $('#roomCode').val().trim().toUpperCase();
        if(!username || !roomCode)
        {
            alert('Please enter your name and roomcode!');
            return;
        }
        if(roomCode.length != 5)
        {
            alert("roomcode should be 5 characters long!");
            return;
        }
        modal.style.display = "none";
        document.getElementById("message").hidden = false;
        $('#message').text('P1 is configuring the game');
        document.getElementById("topEdge").style.display = "flex";
        isP2 = true;
        socket.emit('joinRoom', {
            name: username,
            roomCode: roomCode
        });
    });
});

socket.on('player1', (data) => {
    document.getElementById("player1Name").textContent = data.name;
    rmcde = data.roomCode;
    document.getElementById('message').hidden = false;
    $('#message').text('Waiting for player 2');
    document.getElementById('rm').hidden = false;
    $('#code').text(rmcde);

    console.log(`${data.name} has joined room ${rmcde}`);
});

socket.on('player2', (data) => {
    document.getElementById("player2Name").textContent = data.name;
    if(!isP2) document.getElementById('message').hidden = true; //causing some problems
    rmcde = data.roomCode;
    document.getElementById('rm').hidden = false;
    $('#code').text(rmcde);

    console.log(`${data.name} has joined room ${rmcde}`);

    if(document.getElementById('player1Name').textContent.length == 0) return; //temp fix
    else
    {
        socket.emit('update', {
            p1Name: document.getElementById('player1Name').textContent,
            roomCode: data.roomCode
        });
    }
});

socket.on('update', (data) => {
    document.getElementById("player1Name").textContent = data.p1Name;
});

$('#startGame').on('click', () => {
    if(document.getElementById('player2Name').textContent.length == 0)
    {
        alert("need 2 players to start the game!");
        return; //temp fix, check if there are 2 players
    }
    let roundStr = $('input[name=roundNumbers]:checked').val();
    let numRounds;
    if(roundStr == 'bestOfCustom')
    {
        numRounds = $('#bestOfCustomInput').val();
        if(!numRounds) {
            alert("Please enter the number of rounds you wish to play");
            return;
        }
        if(numRounds < 1) {
            alert("Positive Number of Rounds only");
            return;
        }
        if(numRounds > 20) {
            alert("Too many Rounds");
            return;
        }
        if(numRounds % 2 == 0) {
            alert("odd number of rounds only");
            return;
        }
        if(!Number.isInteger(Number.parseInt(numRounds))) {
            alert("integer number of rounds only!");
            return;
        }
    }
    else
    {
        numRounds = roundStr.charAt(roundStr.length - 1);
    }
    document.getElementById("optionsMenu").hidden = true;
    socket.emit('options', {
        numRounds: numRounds,
        roomCode: rmcde
    });
});

socket.on('options', (round) => {
    if(isP2) document.getElementById("p2Ready").hidden = false;
    else document.getElementById("p1Ready").hidden = false;

    document.getElementById('message').hidden = false; //temp fix for line 73
    $('#message').text(`Best of ${round.numRounds}`);

    $('#p1Ready').one('click', () => {
        $('#p1Ready').addClass("down");
        $('#p1Ready').text("Ready!");
        socket.emit('readyUp', {
            user: 1,
            numRounds: round.numRounds,
            createGame: true,
            roomCode: rmcde
        });
    });

    $('#p2Ready').one('click', () => {
        $('#p2Ready').addClass("down");
        $('#p2Ready').text("Ready!");
        socket.emit('readyUp', {
            user: 2,
            numRounds: round.numRounds,
            createGame: true,
            roomCode: rmcde
        });
    });
});

socket.on('readyUp', (info) => {
    if(($('#p2Ready').hasClass("down") && info.user == 1 && isP2) ||
    ($('#p1Ready').hasClass("down") && info.user == 2 && !isP2))
    {
        if(info.createGame)
        {
            let p1Name = document.getElementById('player1Name').textContent; //should change later
            let p2Name = document.getElementById('player2Name').textContent;
            let numRounds = ((info.numRounds - 1) / 2) + 1; //Game constructor accepts a "firstTo" value
            theGame = new Game(numRounds, p1Name, p2Name);
        }
        socket.emit('startRound', {
            gameData: theGame,
            roomCode: rmcde
        });
    }
});

socket.on('startRound', (data) => {
    theGame = data.gameData;
    currRound = theGame.rounds[theGame.rounds.length - 1];
    document.getElementById("p1Ready").hidden = true;
    document.getElementById("p2Ready").hidden = true;
    $('#p1Ready').removeClass("down");
    $('#p2Ready').removeClass("down");
    $('#p1Ready').text("Ready Up");
    $('#p2Ready').text("Ready Up");
    document.getElementById('message').hidden = true;
    document.getElementById("gameboard").hidden = false;
    renderRoundCounter(theGame.roundWins, "roundDisp");
    renderPiles();
    if(isP2) //render hands
    {
        renderHand(1, "localHand");
        renderHand(0, "opponentHand");
        document.getElementById("localName").textContent = theGame.player2.name;
        document.getElementById("opponentName").textContent = theGame.player1.name;
    }
    else
    {
        renderHand(0, "localHand");
        renderHand(1, "opponentHand");
        document.getElementById("localName").textContent = theGame.player1.name;
        document.getElementById("opponentName").textContent = theGame.player2.name;
    }
    setTimer(); //sets a countdown
});

function setTimer()
{
    setTimeout(() => {
        attachListeners();
    }, 3000);

    let sec = 3;
    document.getElementById('timer').textContent= sec;
    let timerID = setInterval(() => {
        document.getElementById('timer').textContent= --sec;
        if (sec <= 0) {
            clearInterval(timerID);
            document.getElementById('timer').textContent= "GO!";
            setTimeout(() => {
                document.getElementById('timer').textContent = "";
            }, 2000);
        }
    }, 1000);

}

//updates data.playerNum's hand and attaches listeners if applicable
socket.on('updateGamestate', (data) => {
    theGame = data.gameData;
    currRound = theGame.rounds[theGame.rounds.length - 1];
    let owner = isP2 ? 1 : 0;
    let handLoc = data.playerNum == owner ? 'localHand': 'opponentHand';
    renderPiles();
    renderHand(data.playerNum , handLoc); //rerender the hand
    if(data.playerNum == owner) attachListeners();
});

socket.on('gameWinner', (win) => {
    theGame = win.gameData;
    renderRoundCounter(theGame.roundWins, "roundDisp");
    document.getElementById('message').hidden = false;
    $('#message').text(`${win.name} has won the game!`);
});

socket.on('roundWin', (info) => { //sent only if no one has won the game yet

    if(isP2) document.getElementById("p2Ready").hidden = false;
    else document.getElementById("p1Ready").hidden = false;

    theGame = info.gameData;
    renderRoundCounter(theGame.roundWins, "roundDisp");
    document.getElementById('message').hidden = false;
    $('#message').text(`${info.name} has won round ${theGame.rounds.length - 1}!`);

    $('#p1Ready').on('click', () => {
        $('#p1Ready').addClass("down");
        $('#p1Ready').text("Ready!");
        socket.emit('readyUp', {
            user: 1,
            createGame: false,
            gameData: info.gameData,
            roomCode: rmcde
        });
    });

    $('#p2Ready').on('click', () => {
        $('#p2Ready').addClass("down");
        $('#p2Ready').text("Ready!");
        socket.emit('readyUp', {
            user: 2,
            createGame: false,
            gameData: info.gameData,
            roomCode: rmcde
        });
    });
});

//attach eventListeners to the cards on your (local) hand
function attachListeners()
{
    let cardArr = document.getElementById("localHand").childNodes;
    for(let cn of cardArr)
    {
        if(!cn.className.includes('hand')) continue;
        cn.onmousedown = function(event) {
            let testCard = event.path[0].className.split(' ');
            //fixes cards not responding when the pip elements were clicked
            if(testCard.length < 2) testCard = event.path[1].className.split(' ');
            if(testCard.length < 2) testCard = event.path[2].className.split(' ');
            let mouseClick = event.button;

            let tcColor = testCard[0];
            let tcNum = testCard[1];
            let tcSymbol = testCard[2];
            let tcPlayer = testCard[4].substring(testCard[4].length - 1);
            let pileCard; //left click sends to pile1 (pileL), right click to p2 (pileR)
            if(mouseClick == 0) pileCard = currRound.pile1;
            else if(mouseClick == 2) pileCard = currRound.pile2;
            else {
                console.log("mouse input invalid");
                return;
            }

            if(tcColor == pileCard.color || tcNum == pileCard.num || tcSymbol == pileCard.symbol)
            {
                //move clicked card to the respective pile
                pileCard.color = tcColor;
                pileCard.num = tcNum;
                pileCard.symbol = tcSymbol;
                replaceCard(tcColor, tcNum, tcSymbol, tcPlayer); //draw a new card
                socket.emit('updateGamestate', {
                    playerNum: tcPlayer,
                    gameData: theGame,
                    roomCode: rmcde
                });

                if(currRound.players[tcPlayer].playerHand.length == 0)//check if a player has won
                {
                    let nextRound = new Round(theGame.player1, theGame.player2);
                    socket.emit('roundWin', {
                        player: currRound.players[tcPlayer],
                        playerNum: tcPlayer,
                        gameData: theGame,
                        nextRound: nextRound,
                        roomCode: rmcde
                    });
                    console.log(`player ${tcPlayer} has won the round`);
                }
            }
        };
    }
}

const suitPositions =
{
  one: [[0, 0]],
  two: [[0, -1], [0, 1]],
  three: [[0, -1], [0, 0], [0, 1]],
  four: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  five: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]]
};

//renders the card at the html elem.
//if replace is true, then the elem is cleared before the card is appended.
//0 if the card is in p1 hand, 1 if in p2, -1 if not in a hand.
function renderCard(card, elem, replace, inHand)
{
    let element = document.getElementById(elem);
    if(replace) element.innerHTML = ""; //overwrite
    let cardClass = `${card.color} ${card.num} ${card.symbol} card`;
    if(inHand == 0 || inHand == 1) cardClass = cardClass + " hand" + inHand;

    //render card pips in the correct orientation
    const createSuit = (suit) => (pos) => {
      const [ x, y ] = pos;
      return div({
        class: 'card-suit',
        style: `left: ${x * 100}%; top: ${y * 100}%;`
      }, [ suit ]);
    };

    let c = div({ class: cardClass }, [
        div({ class: 'card-suits' },
          suitPositions[card.num].map(createSuit(card.symbol))
        )
      ]);
    element.appendChild(c);
}

//renders player #plNum's hand at html string elem
function renderHand(plNum, elem)
{
    let plyr = currRound.players[plNum];
    document.getElementById(elem).innerHTML = "";
    let owner = isP2 ? 1 : 0;
    let loc = plNum == owner ? 'local': 'opponent';
    document.getElementById(`${loc}Num`).textContent = plyr.playerDeck.length + plyr.playerHand.length;
    document.getElementById(`${loc}Name`).textContent = plyr.name;
    for(const c of plyr.playerHand)
    {
        renderCard(c, elem, false, plNum);
    }
}

//render both piles
function renderPiles()
{
    renderCard(currRound.pile1, 'pileL', true, -1);
    renderCard(currRound.pile2, 'pileR', true, -1);
}

//renders the round counter at elem
//the roundArr is the length of the max rounds playable, ie Bo5 should have len 5
//colors are deteremined by value at the specified index of roundArr.
function renderRoundCounter(roundArr, elem, arrowElem = "arrow")
{
    let display = document.getElementById(elem);
    let arrowDisp = document.getElementById(arrowElem);
    while (display.firstChild)
    {
        display.removeChild(display.firstChild);
        arrowDisp.removeChild(arrowDisp.firstChild);
    }

    for(const round of roundArr)
    {
        let circle = document.createElement("span");
        let arrow = document.createElement("span");

        switch(round)
        {
            case 0: //round is currently in progress, draw an arrow under this circle as well.
                circle.className = "step inProgress";
                arrow.className = "yesArrow";
                break;
            case 1: //p1 won
            case 2: //p2 won
                circle.className = `step win${round}`;
                arrow.className = "noArrow";
                break;
            default: //case: -1, round has not been played yet
                circle.className = "step";
                arrow.className = "noArrow";
        }
        display.appendChild(circle);
        arrowDisp.appendChild(arrow);
    }
    document.getElementById("currRound").textContent = `Round ${theGame.rounds.length}`;
}

//finds the card with the specified properties in player #plNum's hand
//if found, replaces it with the top card of the player's deck
//does nothing if the card cannot be found
function replaceCard(color, num, symbol, plNum)
{
    let plHand = currRound.players[plNum].playerHand;
    for(let i = 0; i < plHand.length; i++)
    {
        let c = plHand[i];
        if(c.symbol == symbol && c.color == color && c.num == num)
        {
            let cardFromDeck = currRound.players[plNum].playerDeck.pop();
            if(!cardFromDeck) plHand.splice(i, 1); //just remove the card
            else plHand[i] = cardFromDeck;
        }
    }
}

//helper method to draw the pips in the correct orientation, used in renderCard()
function div(attributes, children)
{
    const element = document.createElement("div");
    if (attributes) {
      for (const attrName in attributes) {
        element.setAttribute(attrName, attributes[attrName]);
      }
    }
    if (children) {
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (typeof child === 'string') {
          element.appendChild(document.createTextNode(child));
        } else {
          element.appendChild(child);
        }
      }
    }
    return element;
}
