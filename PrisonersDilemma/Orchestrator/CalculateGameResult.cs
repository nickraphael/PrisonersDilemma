using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using PrisonersDilemma.Enums;
using PrisonersDilemma.Classes;

namespace PrisonersDilemma.Orchestrator
{
    public static class CalculateGameResult
    {
        const int BothInnocentYears = 1;
        const int BothAccusedYears = 2;
        const int OneAccusedYears = 3;

        [FunctionName("CalculateGameResult")]
        public static (int player1Jailtime, int player2Jailtime) CalculateGameResultFunction([ActivityTrigger] (Plea player1Plea, Plea player2Plea, int index) pleas, ILogger log)
        {
            if (pleas.player1Plea == Plea.BothInnocent && pleas.player2Plea == Plea.BothInnocent)
            {
                return (BothInnocentYears, BothInnocentYears);
            }
            else if (pleas.player1Plea == Plea.BothInnocent && pleas.player2Plea == Plea.BlameOtherPlayer)
            {
                return (OneAccusedYears, 0);
            }
            else if (pleas.player2Plea == Plea.BothInnocent && pleas.player1Plea == Plea.BlameOtherPlayer)
            {
                return (0, OneAccusedYears);
            }
            else
            {
                return (BothAccusedYears, BothAccusedYears);
            }
        }
    }
}
