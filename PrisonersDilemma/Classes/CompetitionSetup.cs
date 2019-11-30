using System.Collections.Generic;

namespace PrisonersDilemma.Classes
{
    public class CompetitionSetup
    {
        public int BothInnocentYears { get; set; }
        public int BothAccusedYears { get; set; }
        public int OneAccusedYears { get; set; }

        public Player[] Players { get; set; }
    }
}
