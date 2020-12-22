import { Card } from './card.js'
export { Deck };

let symbolArr = ['cross', 'diamond', 'circle', 'lightningBolt', 'triangle', 'star'];
let colorArr = ['blue', 'red', 'green', 'black', 'yellow', 'purple'];
let numArr = ["one", "two", "three", "four", "five"];

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
