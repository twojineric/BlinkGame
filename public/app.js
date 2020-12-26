import { Round } from './round.js';
import { Game } from './game.js';
const bestOf1 = document.getElementById('bestOf1');
const bestOf3 = document.getElementById('bestOf3');
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

bestOf1.addEventListener('click', () => {
    theGame = new Game(1, 'player1', 'player2');
    socket.emit('startRound', {
        gameData: theGame,
    });
});

socket.on('startRound', (data) => {
    bestOf1.style.display = "none";
    bestOf3.style.display = "none";
    theGame = data.gameData;
    currRound = theGame.rounds[theGame.rounds.length - 1];
    renderRoundCounter(theGame.roundWins, "roundDisp");
    console.log("starting round " + theGame.rounds.length);
    renderPile();
    document.getElementById("p1Hand").innerHTML = ""; //render hands
    document.getElementById("p2Hand").innerHTML = "";
    renderHand(0, "p1Hand");
    renderHand(1, "p2Hand");
    attachListeners(0); //attach eventlisteners to each of the cards on the hand.
    attachListeners(1);
});

socket.on('cardClick', (e) => {
    testValid(e);
});

socket.on('gameWinner', (win) => {
    console.log(`${win.name} has won the game!`);
});

socket.on('roundWin', (info) => { //sent only if no one has won the game yet
    socket.emit('startRound', {
        gameData: info.gameData
    });
});

function attachListeners(plNum)
{
    let pHand = (plNum == 0) ? document.getElementById("p1Hand") : document.getElementById("p2Hand"); //wtf going on here
    let cardArr = pHand.childNodes;

    for(let cn of pHand.childNodes)
    {
        if(!cn.className.includes('hand')) continue;
        cn.onmousedown = function(event) {
            let testCard;
            testCard = event.path[0].className.split(' ');
            if(testCard.length < 2) testCard = event.path[1].className.split(' ');
            if(testCard.length < 2) testCard = event.path[2].className.split(' ');
            let mouseClick = event.button;
            socket.emit('cardClick', {
                testCard: testCard,
                mouseClick: mouseClick,
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
    document.getElementById(`p${plNum}Num`).innerHTML = plyr.playerDeck.length + plyr.playerHand.length;
    for(const c of plyr.playerHand)
    {
        renderCard(c, elem, false, plNum);
    }
}

//render both piles
function renderPile()
{
    renderCard(currRound.pile1, 'pile1', true, -1);
    renderCard(currRound.pile2, 'pile2', true, -1);
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
    document.getElementById("currRound").innerHTML = `Round ${theGame.rounds.length}`;
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
    //left click sends to pile1, right click to p2
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
                nextRound: nextRound
            });
            console.log(`player ${tcPlayer} has won the round`);
        }
        let handLoc = tcPlayer == 0 ? 'p1Hand': 'p2Hand';
        renderHand(tcPlayer, handLoc); //rerender the hand
        attachListeners(tcPlayer);
    }
}

const el = (tagName, attributes, children) => {
  const element = document.createElement(tagName);
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
const div = (a, c) => el('div', a, c);
