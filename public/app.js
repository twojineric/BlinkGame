const startButton = document.getElementById('start');
let socket = io();
let currRound;

let symbolArr = ['cross', 'diamond', 'circle', 'lightningBolt', 'triangle', 'star'];
let colorArr = ['blue', 'red', 'green', 'black', 'yellow', 'purple'];
let numArr = ["one", "two", "three", "four", "five"];

startButton.addEventListener('click', () => {
    currRound = new Round('player1', 'player2');
    socket.emit('startGame', {
        roundData: currRound
    });
});

socket.on('startGame', (data) => {
    startButton.style.display = "none";
    currRound = data.roundData;
    renderPile();
    //clear and render hands
    document.getElementById("p1Hand").innerHTML = "";
    document.getElementById("p2Hand").innerHTML = "";
    renderHand(0, "p1Hand");
    renderHand(1, "p2Hand");
    //attach click eventlisteners to each of the cards on the hand.
    attachListeners(0);
    attachListeners(1);
});

socket.on('cardClick', (e) => {
    testValid(e);
});

function attachListeners(plNum)
{
    let pHand = (plNum == 0) ? document.getElementById("p1Hand") : document.getElementById("p2Hand"); //wtf going on here
    let cardArr = pHand.childNodes;

    for(let cn of pHand.childNodes)
    {
        if(!cn.className.includes('hand')) continue;
        cn.onmousedown = function(event) {
            let testCard = event.path[0].className.split(' ');
            let mouseClick = event.button;
            socket.emit('cardClick', {
                testCard: testCard,
                mouseClick: mouseClick
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

    let c = document.createElement("div");
    let cardClass = `${card.color} ${card.num} ${card.symbol} card`;
    if(inHand == 0 || inHand == 1) cardClass = cardClass + " hand" + inHand;
    c.className = cardClass;
    c.innerHTML = `${card.color} ${card.num} ${card.symbol}`;
    element.appendChild(c);
}

//renders player #plNum's hand at html string elem
function renderHand(plNum, elem)
{
    document.getElementById(elem).innerHTML = "";
    for(const c of currRound.players[plNum].playerHand)
    {
        renderCard(c, elem, false, plNum);
    }
}

//renders both piles
function renderPile()
{
    renderCard(currRound.pile1, 'pile1', true, -1);
    renderCard(currRound.pile2, 'pile2', true, -1);
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
            console.log("WINNER!!");
        }
        let handLoc = tcPlayer == 0 ? 'p1Hand': 'p2Hand';
        renderHand(tcPlayer, handLoc); //rerender the hand
        attachListeners(tcPlayer);
    }
    else
    {
        console.log("cards do not match");
    }
}

class Card
{
    constructor(color, num, symbol)
    {
        this.color = color;
        this.num = num;
        this.symbol = symbol;
    }
}

class Deck
{
    constructor()
    {
        this.theDeck = [];

        //create all the cards
        for(let i = 0; i < colorArr.length; i++)  {
            for(let j = 0; j < numArr.length; j++) {
                for(let k = 0; k < symbolArr.length; k++) {
                this.theDeck.push(new Card(colorArr[i], numArr[j], symbolArr[k]));
                }
            }
        }
        //fisher yates shuffle
        for (let i = this.theDeck.length - 1; i > 0; i--)
        {
            let j = Math.floor(Math.random() * (i + 1));
            let temp = this.theDeck[i];
            this.theDeck[i] = this.theDeck[j];
            this.theDeck[j] = temp;
        }
    }
}

class Player
{
    constructor(name)
    {
        this.name = name;
        this.playerHand = []; //3 cards
        this.playerDeck = []; //the rest
    }

    //draws cards from deck until hand is full (3 cards)
    //make sure to call render!
    fillHand()
    {
        while(this.playerDeck.length > 0 && this.playerHand.length < 3)
        {
            this.playerHand.push(this.playerDeck.pop());
        }
    }
}

class Round
{
    constructor(player1Name, player2Name)
    {
        this.pile1;
        this.pile2;
        this.players = [];

        this.players.push(new Player(player2Name));
        this.players.push(new Player(player1Name));

        //make deck and give each player half
        let d = new Deck();
        let len = d.theDeck.length;
        for(let i = 0; i < len; i++)
        {
            //each player gets half the cards
            this.players[i % 2].playerDeck.push(d.theDeck.pop());
        }
        //each player fills their hand with 3 cards
        this.players[0].fillHand();
        this.players[1].fillHand();

        //add countdown

        //flip the top card of each deck to the play area
        this.pile1 = this.players[0].playerDeck.pop();
        this.pile2 = this.players[1].playerDeck.pop();
    }
}

class Game
{
    constructor(firstTo) //first to x number of rounds
    {
        if(isNaN(firstTo))
            throw "err: Number of Rounds NaN";
        if(firstTo < 1)
            throw "err: Positive integer number of rounds only";
    }
}
