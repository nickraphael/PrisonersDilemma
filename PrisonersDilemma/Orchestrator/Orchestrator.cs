using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Extensions.Logging;
using PrisonersDilemma.Classes;
using PrisonersDilemma.Enums;

namespace PlayersDilemma.Orchestrator
{
    

    public static class Orchestrator
    {
        


        [FunctionName("Orchestrator")]
        public static async Task<MatchResult> RunOrchestrator(
            [OrchestrationTrigger] DurableOrchestrationContext context,
            ILogger log)
        {
            var results = new MatchResult();

            for (int i = 0; i <= 10; i++)
            {
                DateTime deadline = context.CurrentUtcDateTime.Add(TimeSpan.FromSeconds(2));
                //await context.CreateTimer(deadline, CancellationToken.None);


                log.LogWarning($"Game {i} in progress");

                var previousPleas = results.Pleas.Take(i - 1);
                var player1Result = await context.CallActivityAsync<Plea>("SingleGame", (previousPleas, i));
                log.LogWarning("Player1 chooses " + player1Result.ToString());
                var player2Result = await context.CallActivityAsync<Plea>("SingleGame", (previousPleas, i));
                log.LogWarning("Player2 chooses " + player2Result.ToString());

                var gameResult = new GameResult() { Player1 = player1Result, Player2 = player2Result };
                results.Pleas.Add(gameResult);

                var jailtimes = await context.CallActivityAsync<(int player1Jailtime, int player2Jailtime)>("CalculateGameResult", (player1Result, player2Result, i));
                results.Player1JailTime += jailtimes.player1Jailtime;
                results.Player2JailTime += jailtimes.player2Jailtime;

                context.SetCustomStatus($"Player1 {results.Player1JailTime.ToString()}-{results.Player2JailTime.ToString()} Player2");
                log.LogWarning($"Ongoing results: Player1 jailtime={results.Player1JailTime.ToString()}. Player2 jailtime={results.Player2JailTime.ToString()}.");
            }

            log.LogWarning("---------------------------------------------------");
            log.LogWarning($"Results are in! Players1 jailtime={results.Player1JailTime.ToString()}. Player2 jailtime={results.Player2JailTime.ToString()}");
            log.LogWarning("---------------------------------------------------");
            return results;
        }

        [FunctionName("Orchestrator_HttpStart")]
        public static async Task<HttpResponseMessage> HttpStart(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post")]HttpRequestMessage req,
            [OrchestrationClient]DurableOrchestrationClient starter,
            ILogger log)
        {
            // Function input comes from the request content.
            string instanceId = await starter.StartNewAsync("Orchestrator", null);

            log.LogInformation($"Started orchestration with ID = '{instanceId}'.");

            return starter.CreateCheckStatusResponse(req, instanceId);
        }
    }
}