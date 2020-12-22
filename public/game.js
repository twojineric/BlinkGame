export { Game };
import { Round } from './round.js';

class Game
{
    constructor(firstTo, player1, player2) //first to x number of rounds
    {
        this.rounds = [];

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

        let aRound = new Round(player1, player2);
        this.rounds.push(aRound);
    }
}
