const startButton = document.getElementById('start');
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
        document.getElementById("p1Hand").innerHTML = "";
        document.getElementById("p2Hand").innerHTML = "";
        currRound.renderHand(0, "p1Hand");
        currRound.renderHand(1, "p2Hand");
        //attach click eventlisteners to each of the cards on the hand.
        currRound.attachListeners(0);
        currRound.attachListeners(1);
    });
}

//this function is called when one of the players clicks on a card
//sends to the respective pile, and updates the players hand and the pile.
function testValid(event)
{
    let testCard = event.path[0].className.split(' ');
    let mouseClick = event.button;
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
        currRound.renderPiles(); //move clicked card to the respective pile

        currRound.players[tcPlayer].replaceCard(tcColor, tcNum, tcSymbol); //draw a new card
        if(currRound.players[tcPlayer].handIsEmpty())//check if a player has won
        {
            console.log("WINNER!!");
        }
        let handLoc = tcPlayer == 0 ? 'p1Hand': 'p2Hand';
        currRound.renderHand(tcPlayer, handLoc); //rerender the hand
        currRound.attachListeners(tcPlayer);
    }
    else
    {
        console.log("cards do not match");
    }
}

class Card
{
    //add "owner" string to card
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

    handIsEmpty()
    {
        return this.playerHand.length == 0;
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

    //searches hand for a card with the given properties
    //if found, replaces it with the top card of the deck and returns true
    //if not, nothing happens and returns false
    replaceCard(color, num, symbol)
    {
        for(let i = 0; i < this.playerHand.length; i++)
        {
            let c = this.playerHand[i];
            if(c.symbol == symbol && c.color == color && c.num == num)
            {
                let cardFromDeck = this.playerDeck.pop();

                if(!cardFromDeck) //card doesnt exist - deck is empty
                {
                    this.playerHand.splice(i, 1); //just remove the card
                }
                else
                {
                    this.playerHand[i] = cardFromDeck;
                }
                return true;
            }
        }
        return false;
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
        let pHand = (playerNum == 0) ? document.getElementById("p1Hand") : document.getElementById("p2Hand"); //wtf going on here
        let cardArr = pHand.childNodes;

        for(let cn of pHand.childNodes)
        {
            if(!cn.className.includes('hand')) continue;
            cn.onmousedown = function(event) {testValid(event)};
        }
    }

    //renders the card at the id string elem
    // if replace flag is true, overwrites whatever is currently at 'elem'
    // inHand flag is 0 for p1 and 1 for p2, -1 for not in hand.
    renderCard(card, elem, replace, inHand)
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

    //renders a player's 3 cards at the html div elem (string)
    //overwrites whatever is currently at 'elem';
    renderHand(plNum, elem)
    {
        document.getElementById(elem).innerHTML = "";
        for(const c of this.players[plNum].playerHand)
        {
            this.renderCard(c, elem, false, plNum);
        }
    }

    renderPiles()
    {
        this.renderCard(this.pile1, 'pile1', true, -1);
        this.renderCard(this.pile2, 'pile2', true, -1);
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
