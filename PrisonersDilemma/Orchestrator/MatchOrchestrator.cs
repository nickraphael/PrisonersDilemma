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
using Newtonsoft.Json;
using System.Diagnostics;

namespace PlayersDilemma.Orchestrator
{
    

    public static class MatchOrchestrator
    {
        [FunctionName("MatchOrchestrator")]
        public static async Task<MatchResult> RunMatchOrchestrator(
            [OrchestrationTrigger] DurableOrchestrationContext context,
            ILogger log)
        {
            var matchSetup = context.GetInput<MatchSetup>();

            var results = new MatchResult();
            results.Player1 = matchSetup.Players[0];
            results.Player2 = matchSetup.Players[1];

            // loop through the number of games 
            for (var gameIndex = 0; gameIndex < matchSetup.NumberOfGames; gameIndex++)
            {
                DateTime deadline = context.CurrentUtcDateTime.Add(TimeSpan.FromSeconds(2));
                await context.CreateTimer(deadline, CancellationToken.None);

                var previousPleas = results.Pleas.Take(gameIndex - 1);

                // run the player functions in parallel
                var playerPleaTasks = new List<Task<PleaEnum>>();
                playerPleaTasks.Add(context.CallActivityAsync<PleaEnum>("SingleGame", (matchSetup, PlayerEnum.Player1, previousPleas, gameIndex)));
                playerPleaTasks.Add(context.CallActivityAsync<PleaEnum>("SingleGame", (matchSetup, PlayerEnum.Player2, previousPleas, gameIndex)));
                await Task.WhenAll(playerPleaTasks);

                // add the selected pleas to the results
                var gameResult = new GameResult() { Player1 = playerPleaTasks[0].Result, Player2 = playerPleaTasks[1].Result };
                results.Pleas.Add(gameResult);

                context.SetCustomStatus(JsonConvert.SerializeObject(new Status()
                {
                    Stage = "CollectingPleas",
                    Message = $"Running game {gameIndex} of {matchSetup.NumberOfGames} between {matchSetup.Players[0].Name} and {matchSetup.Players[1].Name}.",
                    Payload = gameResult
                }));
            }

            context.SetCustomStatus(JsonConvert.SerializeObject(results));
            var aggregatedResults = await context.CallSubOrchestratorAsync<MatchResult>("CalculateMatchResultOrchestrator", results);

            LogResults(matchSetup, aggregatedResults, log);

            context.SetCustomStatus(JsonConvert.SerializeObject(new Status
            {
                Stage = "ResultsGenerated",
                Message = $"{matchSetup.Players[0].Name} {aggregatedResults.Player1JailTime.ToString()}-{aggregatedResults.Player2JailTime.ToString()} {matchSetup.Players[1].Name}",
                Payload = aggregatedResults
            }));

            return aggregatedResults;
        }

        private static void LogResults(MatchSetup matchSetup, IMatchResult results, ILogger log)
        {
            Debug.WriteLine("---------------------------------------------------");
            Debug.WriteLine($"Results are in! {matchSetup.Players[0].Name} jailtime={results.Player1JailTime.ToString()}. {matchSetup.Players[1].Name} jailtime={results.Player2JailTime.ToString()}");

            if (results.Winner == PlayerEnum.Player1)
            {
                Debug.WriteLine($"{matchSetup.Players[0].Name} is the winner over {matchSetup.NumberOfGames.ToString()} games.");
            }
            else if (results.Winner == PlayerEnum.Player2)
            {
                Debug.WriteLine($"{matchSetup.Players[1].Name} is the winner over {matchSetup.NumberOfGames.ToString()} games.");
            }
            else
            {
                Debug.WriteLine($"Match was a draw over {matchSetup.NumberOfGames.ToString()} games.");
            }
            Debug.WriteLine("---------------------------------------------------");
        }
    }
}