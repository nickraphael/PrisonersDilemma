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
using System.Collections.Generic;
using System.Diagnostics;

namespace PrisonersDilemma.CompetitorFunctions
{
    public static class Nelly
    {
        [FunctionName("Nelly")]
        public static PleaEnum RunSingleGame([ActivityTrigger] (MatchSetup matchSetup, PlayerEnum player, List<GameResult> previousPleas, int gameIndex, bool showDebug) inputs, ILogger log)
        {
            var playerName = inputs.player == PlayerEnum.Player1 ? inputs.matchSetup.Players[0].Name : inputs.matchSetup.Players[1].Name;

            if (inputs.showDebug)
            {
                Debug.WriteLine($"{playerName} chooses {PleaEnum.DontRat.ToString()} in game {inputs.gameIndex}, in match {inputs.matchSetup.Players[0].Name} v {inputs.matchSetup.Players[1].Name}");
            }

            return PleaEnum.DontRat;
        }
    }
}
