import { Round } from './round.js';
import { Game } from './game.js';
let socket = io();

const suitPositions =
{
  one: [[0, 0]],
  two: [[0, -1], [0, 1]],
  three: [[0, -1], [0, 0], [0, 1]],
  four: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  five: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]]
};

let theGame;
let currRound;
let modal = document.getElementById("myModal");
let gameboard = document.getElementById("gameboard");

let isP2; //used for rendering hands
//the second person that joins the room is p2 and is in the 1st index of the player array in theGame obj.
//this boolean ensures that the correct set of cards are displayed at the bottom of the screen.
let rmcde;

$( document ).ready(() => {

    modal.style.display = "block";
    $('#createRoom').on('click', () => {
        let username = $('#nameCreate').val();
        if(!username)
        {
          alert('Please enter your name.');
          return;
        }
        modal.style.display = "none";
        isP2 = false;
        socket.emit('createRoom', {
            name: username
        });
    });

    $('#joinRoom').on('click', () => {
        //currently no way to check if the room code is valid
        let username = $('#nameJoin').val();
        let roomCode = $('#roomCode').val();
        if(!username || !roomCode)
        {
            alert('Please enter your name and roomcode!');
            return;
        }
        modal.style.display = "none";
        isP2 = true;
        socket.emit('joinRoom', {
            name: username,
            roomCode: roomCode
        });
    });

    $('#startGame').on('click', () => {
        let roundStr = $('input[name=roundNumbers]:checked').val();
        let numRounds;
        if(roundStr == 'bestOfCustom')
        {
            numRounds = $('#bestOfCustomInput').val();

            if(!numRounds)
            {
                alert("Please enter the number of rounds you wish to play");
                return;
            }
            if(numRounds < 1)
            {
                alert("Positive Number of Rounds only");
                return;
            }
            if(numRounds > 50)
            {
                alert("Too many Rounds");
                return;
            }
            if(numRounds % 2 == 0)
            {
                alert("odd number of rounds only");
                return;
            }
            if(!Number.isInteger(Number.parseInt(numRounds)))
            {
                alert("integer number of rounds only!");
                return;
            }
        }
        else
        {
            numRounds = roundStr.charAt(roundStr.length - 1);
        }
        let p1Name = document.getElementById('localName').textContent; //should change later
        let p2Name = document.getElementById('opponentName').textContent;
        numRounds = ((numRounds - 1) / 2) + 1; //Game constructor accepts a "firstTo" value
        theGame = new Game(numRounds, p1Name, p2Name);
        socket.emit('startRound', {
            gameData: theGame,
            roomCode: rmcde
        });
    });
});

socket.on('player1', (data) => {
    document.getElementById('localName').textContent = data.name;
    rmcde = data.roomCode;
    console.log(`${data.name} has joined room ${rmcde}`);
    document.getElementById('code').textContent = rmcde;
});

socket.on('player2', (data) => {
    document.getElementById('opponentName').textContent = data.name;
    rmcde = data.roomCode;
    console.log(`${data.name} has joined room ${rmcde}`);
    document.getElementById('code').textContent = rmcde;

    if(!document.getElementById('localName').textContent) return;
    else {
        socket.emit('update', {
            p1Name: document.getElementById('localName').textContent,
            roomCode: data.roomCode
        });
    }
});

socket.on('update', (data) => {
    document.getElementById('localName').textContent = data.p1Name;
});

socket.on('startRound', (data) => {
    theGame = data.gameData;
    currRound = theGame.rounds[theGame.rounds.length - 1];
    //startCountdown(3, countdown);
    gameboard.hidden = false;
    renderRoundCounter(theGame.roundWins, "roundDisp");
    renderPile();
    document.getElementById("localHand").textContent = ""; //render hands
    document.getElementById("opponentHand").textContent = "";
    if(isP2)
    {
        renderHand(1, "localHand");
        renderHand(0, "opponentHand");
    }
    else
    {
        renderHand(0, "localHand");
        renderHand(1, "opponentHand");
    }
    attachListeners();

});

socket.on('cardClick', (e) => {
    testValid(e);
});

socket.on('updateGamestate', (data) => {
    theGame = data.gameData;
    currRound = theGame.rounds[theGame.rounds.length - 1];
    let owner = isP2 ? 1 : 0;
    renderPile();
    let handLoc = data.playerNum == owner ? 'localHand': 'opponentHand';
    renderHand(data.playerNum , handLoc); //rerender the hand
    attachListeners(data.playerNum);
});

socket.on('gameWinner', (win) => {
    console.log(`${win.name} has won the game!`);
});

socket.on('roundWin', (info) => { //sent only if no one has won the game yet
    socket.emit('startRound', {
        gameData: info.gameData,
        roomCode: rmcde
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
            //fixes cards not responding when the pip div elements were clicked
            if(testCard.length < 2) testCard = event.path[1].className.split(' ');
            if(testCard.length < 2) testCard = event.path[2].className.split(' ');
            let mouseClick = event.button;
            socket.emit('cardClick', {
                testCard: testCard,
                mouseClick: mouseClick,
                roomCode: rmcde
            });
        };
    }
}

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
function renderPile()
{
    renderCard(currRound.pile1, 'pileL', true, -1);
    renderCard(currRound.pile2, 'pileR', true, -1);
}

//renders the round counter at elem
//the roundArr is the length of the max rounds playable, ie Bo5 should have len 5
//a 1 means p1 won that round, same with p2.
// 0 means the round is currently ongoing, -1 means that the round has not been played
// an arrow is drawn under the round with value 0.

//might add optional colors in the future
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
            case 0:
                circle.className = "step inProgress";
                arrow.className = "yesArrow";
                break;
            case 1:
            case 2:
                circle.className = `step win${round}`;
                arrow.className = "noArrow";
                break;
            default: //case: -1
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
            if(!cardFromDeck) //card doesnt exist - deck is empty
            {
                plHand.splice(i, 1); //just remove the card
            }
            else
            {
                plHand[i] = cardFromDeck;
            }
            return true;
        }
    }
    console.log("could not find specified card!");
    return false;
}

//this function is called when one of the players clicks on a card
//sends to the respective pile, and updates the players hand and the pile.
function testValid(eventObj)
{
    let testCard = eventObj.testCard;
    let mouseClick = eventObj.mouseClick;
    let tcColor = testCard[0];
    let tcNum = testCard[1];
    let tcSymbol = testCard[2];
    let tcPlayer = testCard[4].substring(testCard[4].length - 1);
    let owner = isP2 ? 1 : 0;
    //left click sends to pile1 (pileL), right click to p2 (pileR)
    let pileCard = (mouseClick == 0) ? currRound.pile1: currRound.pile2;

    if(tcColor == pileCard.color || tcNum == pileCard.num || tcSymbol == pileCard.symbol)
    {
        pileCard.color = tcColor;
        pileCard.num = tcNum;
        pileCard.symbol = tcSymbol;
        renderPile(); //move clicked card to the respective pile
        replaceCard(tcColor, tcNum, tcSymbol, tcPlayer); //draw a new card
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

        let handLoc = tcPlayer == owner ? 'localHand': 'opponentHand';
        renderHand(tcPlayer, handLoc); //rerender the hand
        attachListeners(tcPlayer);

        //update opponents screen
        socket.emit('updateGamestate', {
            player: currRound.players[tcPlayer],
            playerNum: tcPlayer,
            gameData: theGame,
            roomCode: rmcde
        });
    }
}

//starts a full screen countdown at html elem display
function startCountdown(seconds, disp)
{
    let timer = seconds;
    let display = document.getElementById(disp);
    setInterval(function () {
        display.textContent = seconds;
        timer--;
        seconds = timer;
    }, 1000);
}

const div = (attributes, children) => {
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
};
