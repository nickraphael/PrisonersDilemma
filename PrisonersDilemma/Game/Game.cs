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

namespace PrisonersDilemma.Game
{
    public static class CalculateGameResult
    {
        [FunctionName("SingleGame")]
        public static PleaEnum RunSingleGame([ActivityTrigger] (PlayerEnum player, List<GameResult> previousPleas, int gameIndex) inputs, ILogger log)
        {
            log.LogWarning($"Getting plea for player {inputs.player.ToString()}, gameIndex {inputs.gameIndex}");
            Array values = Enum.GetValues(typeof(PleaEnum));
            Random random = new Random();
            var ran = random.Next(values.Length);
            PleaEnum randomPlea = (PleaEnum)values.GetValue(random.Next(values.Length));

            return randomPlea;
        }
    }
}
