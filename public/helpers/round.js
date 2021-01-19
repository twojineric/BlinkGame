import { Deck } from './deck.js';
import { Player } from './player.js';
export { Round };

class Round
{
    constructor(player1Obj, player2Obj)
    {
        this.pile1;
        this.pile2;
        this.players = [];

        this.players.push(player1Obj);
        this.players.push(player2Obj);

        //clear the player's current deck and hand, if any
        this.players[0].playerDeck.length = 0;
        this.players[1].playerDeck.length = 0;
        this.players[0].playerHand.length = 0;
        this.players[1].playerHand.length = 0;

        //make deck and give each player half
        let d = new Deck();
        let len = d.theDeck.length;

        for(let i = 0; i < len; i++)
        {
            //each player gets half the cards
            this.players[i % 2].playerDeck.push(d.theDeck.pop());
        }

        //each player fills their hand with 3 cards
        for(const p of this.players)
        {
            while(p.playerDeck.length > 0 && p.playerHand.length < 3)
            {
                p.playerHand.push(p.playerDeck.pop());
            }
        }

        //flip the top card of each deck to the play area
        this.pile1 = this.players[0].playerDeck.pop();
        this.pile2 = this.players[1].playerDeck.pop();
    }
}
