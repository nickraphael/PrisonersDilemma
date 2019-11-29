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
        const int numberOfGames = 10;


        [FunctionName("Orchestrator")]
        public static async Task<MatchResult> RunOrchestrator(
            [OrchestrationTrigger] DurableOrchestrationContext context,
            ILogger log)
        {
            var results = new MatchResult();

            // loop through the number of games 
            for (var gameIndex = 0; gameIndex < numberOfGames; gameIndex++)
            {
                DateTime deadline = context.CurrentUtcDateTime.Add(TimeSpan.FromSeconds(2));
                //await context.CreateTimer(deadline, CancellationToken.None);


                var previousPleas = results.Pleas.Take(gameIndex - 1);

                // run the player functions in parallel
                var playerPleaTasks = new List<Task<Plea>>();
                playerPleaTasks.Add(context.CallActivityAsync<Plea>("SingleGame", (Player.Player1, previousPleas, gameIndex)));
                playerPleaTasks.Add(context.CallActivityAsync<Plea>("SingleGame", (Player.Player2, previousPleas, gameIndex)));
                await Task.WhenAll(playerPleaTasks);

                // add the selected pleas to the results
                var gameResult = new GameResult() { Player1 = playerPleaTasks[0].Result, Player2 = playerPleaTasks[1].Result };
                results.Pleas.Add(gameResult);
            }

            log.LogWarning("**************************************************");
            var aggregatedResults = await context.CallSubOrchestratorAsync<MatchResult>("CalculateMatchResultOrchestrator", results);

            ShowResults(aggregatedResults, log);

            context.SetCustomStatus($"Player1 {aggregatedResults.Player1JailTime.ToString()}-{aggregatedResults.Player2JailTime.ToString()} Player2");

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

        private static void ShowResults(IMatchResult results, ILogger log)
        {
            log.LogWarning("---------------------------------------------------");
            log.LogWarning($"Results are in! Players1 jailtime={results.Player1JailTime.ToString()}. Player2 jailtime={results.Player2JailTime.ToString()}");

            if (results.Player1JailTime < results.Player2JailTime)
            {
                log.LogWarning("Player1 is the winner");
            }
            else if (results.Player1JailTime > results.Player2JailTime)
            {
                log.LogWarning("Player2 is the winner");
            }
            else
            {
                log.LogWarning("Match was a draw");
            }
            log.LogWarning("---------------------------------------------------");
        }
    }
}