const startButton = document.getElementById('start');
const p1Hand = document.getElementById("p1Hand"); //dont think we need to declare these here
const p2Hand = document.getElementById("p2Hand");
let currRound;

let symbolArr = ['cross', 'diamond', 'circle', 'lightningBolt', 'triangle', 'star'];
let colorArr = ['blue', 'red', 'green', 'black', 'yellow', 'purple'];
let numArr = ["one", "two", "three", "four", "five"];

main();

function main()
{
    startButton.addEventListener('click', () => {
        currRound = new Round();
        currRound.startRound('player1', 'player2');
        currRound.renderPiles();
        //clear and render hands
        p1Hand.innerHTML = "";
        p2Hand.innerHTML = "";
        currRound.renderHand(currRound.players[0], "p1Hand");
        currRound.renderHand(currRound.players[1], "p2Hand");
        //attach click eventlisteners to each of the cards on the hand.
        currRound.attachListeners(1);
        currRound.attachListeners(2);
    });
}

function testValid(event)
{
    let testCard = event.path[0].className.split(' ');
    let mouseClick = event.button; //0 left click, 2 right click

    let tcColor = testCard[0];
    let tcNum = testCard[1];
    let tcSymbol = testCard[2];

    //left click sends to pile1, right click to p2
    let targetCard = (mouseClick == 0) ? currRound.pile1: currRound.pile2;

    if(tcColor == targetCard.color || tcNum == targetCard.num || tcSymbol == targetCard.symbol)
    {
        targetCard.color = tcColor;
        targetCard.num = tcNum;
        targetCard.symbol = tcSymbol;
        currRound.renderPiles(); //move clicked card to the respective pile

        currRound.players[0].playerHand.pop();
        currRound.players[0].fillHand();

        currRound.renderHand(currRound.players[0], 'p1Hand');
        currRound.renderHand(currRound.players[1], 'p2Hand');
        currRound.attachListeners(1);
        currRound.attachListeners(2);
    }
    else
    {
        console.log("cards do not match");
    }
}

class Card
{
    //add "owner" string to card
    constructor(symbol, color, num)
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
        for(let i = 0; i < symbolArr.length; i++)  {
            for(let j = 0; j < colorArr.length; j++) {
                for(let k = 0; k < numArr.length; k++) {
                this.theDeck.push(new Card(symbolArr[i], colorArr[j], numArr[k]));
                }
            }
        }

        //run fisher yates to shuffle
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

    deckIsEmpty()
    {
        return this.playerDeck.length == 0;
    }

    //draws cards from deck until hand is full (3 cards)
    //make sure to call render!
    fillHand()
    {
        while(this.playerDeck.length > 0 && this.playerHand.length < 3)
        {
            this.playerHand.push(this.playerDeck.pop());
            console.log(`deck size is now ${this.playerDeck.length}`);
        }
    }
}

class Round
{
    constructor()
    {
        this.pile1;
        this.pile2;
        this.players = [];
    }

    startRound(player1Name, player2Name)
    {
        //two player game only (maybe we dont need an array)
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

    attachListeners(playerNum)
    {
        let pHand = (playerNum == 1) ? p1Hand : p2Hand; //wtf going on here
        let cardArr = pHand.childNodes;

        for(let cn of pHand.childNodes)
        {
            if(!cn.className.includes('hand')) continue;
            cn.onmousedown = function(event) {testValid(event)};
        }
    }

    //renders the card at the id string elem
    // if replace flag is true, overwrites whatever is currently at 'elem'
    //if isInHand is true, adds the card to the HTML 'hand' class
    renderCard(card, elem, replace, isInHand)
    {
        let element = document.getElementById(elem);
        if(replace) element.innerHTML = ""; //overwrite

        let c = document.createElement("div");
        let cardClass = card.color + " " + card.num + " " + card.symbol;
        c.innerHTML = card.color + " " + card.num + " " + card.symbol;
        cardClass = cardClass + ((isInHand) ? ' card hand': ' card');
        c.className = cardClass;
        element.appendChild(c);
    }

    //renders a player's 3 cards at the html div elem (string)
    //overwrites whatever is currently at 'elem';
    renderHand(pl, elem)
    {
        if(!pl instanceof Player) throw "renderHand(p , elem) not instance of player!";
        document.getElementById(elem).innerHTML = "";
        for(const c of pl.playerHand)
        {
            this.renderCard(c, elem, false, true);
        }
    }

    renderPiles()
    {
        this.renderCard(this.pile1, 'pile1', true, false);
        this.renderCard(this.pile2, 'pile2', true, false);
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
