export { Game };
import { Round } from './round.js';
import { Player } from './player.js';

class Game
{
    constructor(firstTo, pl1Name, pl2Name) //first to x number of rounds
    {
        this.player1;
        this.player2;
        this.firstTo = firstTo;
        this.rounds = []; //holds the round objects
        this.roundWins = []; //holds wins ex [2,1,0,-1,-1]
        // -1 means the round has not been played yet
        // 0 means the round is currently being played
        // 1 or 2 is the winner of a round

        if(isNaN(firstTo))
        {
            throw "err: Number of Rounds NaN";
            return;
        }

        this.player1 = new Player(pl1Name);
        this.player2 = new Player(pl2Name);

        this.roundWins.length = firstTo * 2 - 1;
        this.roundWins.fill(-1); // -1 means the round does not have a winner
        let aRound = new Round(this.player1, this.player2);
        this.rounds.push(aRound);
        this.roundWins[0] = 0;
    }

    playGame()
    {
        console.log("play on!");
    }


}
