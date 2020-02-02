using System.Collections.Generic;

namespace PrisonersDilemma.Classes
{
    public class MatchSetup
    {
        public int BothInnocentYears { get; set; }
        public int BothAccusedYears { get; set; }
        public int OneAccusedYears { get; set; }

        public int NumberOfGames { get; set; }

        public Player[] Players { get; set; }
    }
}
