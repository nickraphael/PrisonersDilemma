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
using System.Net.Http;
using System.Collections.Generic;
using System.Linq;

namespace PrisonersDilemma.Orchestrator
{
    public static class CalculateMatchResultOrchestrator
    {

        //[FunctionName("CalculateMatchResult")]
        //public static (int player1Jailtime, int player2Jailtime) CalculateMatchResultFunction([ActivityTrigger] (Plea player1Plea, Plea player2Plea) pleas, ILogger log)
        //{
        //    //needs to be durable and fan out to call calcgameresults
        //}

        [FunctionName("CalculateMatchResultOrchestrator")]
        public static async Task<MatchResult> RunCalculateMatchResultOrchestrator(
            [OrchestrationTrigger] DurableOrchestrationContext context,
            ILogger log)
        {
            log.LogWarning("Running RunCalculateMatchResultOrchestrator");

            var matchResult = context.GetInput<MatchResult>();

            // run the player functions in parallel
            var calculateGameResultTasks = new List<Task<(int player1Jailtime, int player2Jailtime)>>();
            for (var pleaIndex = 0; pleaIndex < matchResult.Pleas.Count; pleaIndex++)
            {
                var plea = matchResult.Pleas[pleaIndex];
                calculateGameResultTasks.Add(context.CallActivityAsync<(int player1Jailtime, int player2Jailtime)>("CalculateGameResult", (plea.Player1, plea.Player2, pleaIndex)));
            }
            await Task.WhenAll(calculateGameResultTasks);

            matchResult.Player1JailTime = calculateGameResultTasks.Sum(x => x.Result.player1Jailtime);
            matchResult.Player2JailTime = calculateGameResultTasks.Sum(x => x.Result.player2Jailtime);

            matchResult.Winner = CalculateWinner(matchResult.Player1JailTime, matchResult.Player2JailTime);
            return matchResult;
        }

        private static PlayerEnum? CalculateWinner(int player1Jailtime, int player2Jailtime)
        {

            if (player1Jailtime < player2Jailtime)
            {
                return PlayerEnum.Player1;
            }
            else if (player1Jailtime > player2Jailtime)
            {
                return PlayerEnum.Player2;
            }
            else
            {
                return null;
            }
        }

        //[FunctionName("CalculateMatchResultOrchestrator_HttpStart")]
        //public static async Task<HttpResponseMessage> HttpStart(
        //    [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post")]HttpRequestMessage req,
        //    [OrchestrationClient]DurableOrchestrationClient starter,
        //    ILogger log)
        //{
        //    // Function input comes from the request content.
        //    string instanceId = await starter.StartNewAsync("CalculateMatchResultOrchestrator", null);

        //    log.LogInformation($"Started CalculateMatchResultOrchestrator with ID = '{instanceId}'.");

        //    return starter.CreateCheckStatusResponse(req, instanceId);
        //}
    }
}
