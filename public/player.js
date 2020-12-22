export { Player };
import { Card } from './card.js';

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
