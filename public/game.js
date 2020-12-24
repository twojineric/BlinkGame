export { Game };
import { Round } from './round.js';

class Game
{
    constructor(firstTo, player1, player2) //first to x number of rounds
    {
        this.player1Name = player1;
        this.player2Name = player2;
        this.rounds = [];
        this.roundLimit;
        this.roundCounter;

        if(isNaN(firstTo))
        {
            throw "err: Number of Rounds NaN";
            return;
        }
        if(firstTo < 1)
        {
            throw "err: Positive integer number of rounds only";
            return;
        }

        this.roundLimit = firstTo * 2 - 1;
        let aRound = new Round(player1, player2);
        this.rounds.push(aRound);
    }

    playGame()
    {
        console.log("play on!");
    }


}
