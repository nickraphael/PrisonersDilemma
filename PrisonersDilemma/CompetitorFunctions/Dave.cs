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
    public static class CalculateGameResult
    {
        [FunctionName("Dave")]
        public static PleaEnum RunSingleGame([ActivityTrigger] (MatchSetup matchSetup, PlayerEnum player, List<GameResult> previousPleas, int gameIndex, bool showDebug) inputs, ILogger log)
        {
            var playerName = inputs.player == PlayerEnum.Player1 ? inputs.matchSetup.Players[0].Name : inputs.matchSetup.Players[1].Name;
            Array values = Enum.GetValues(typeof(PleaEnum));

            Random random = new Random();
            var ran = random.Next(values.Length);
            PleaEnum randomPlea = (PleaEnum)values.GetValue(random.Next(values.Length));

            if (inputs.showDebug)
            {
                Debug.WriteLine($"{playerName} chooses {randomPlea.ToString()} in game {inputs.gameIndex}, in match {inputs.matchSetup.Players[0].Name} v {inputs.matchSetup.Players[1].Name}");
            }

            return randomPlea;
        }
    }
}
