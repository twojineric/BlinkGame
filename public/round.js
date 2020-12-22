import { Deck } from './deck.js';
import { Player } from './player.js';
import { Card } from './card.js';
export { Round };

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
