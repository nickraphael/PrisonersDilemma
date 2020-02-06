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


    public static class CompetitionOrchestrator
    {
        [FunctionName("CompetitionOrchestrator")]
        public static async Task RunCompetitionOrchestrator(
            [OrchestrationTrigger] DurableOrchestrationContext context,
            ILogger log)
        {
            var competitionSetup = context.GetInput<CompetitionSetup>();

            // We need to orchestrate matches for every combination of players.
            // Basically so everybody plays against everybody.
            var matchups = CalculateMatches(competitionSetup.Players);

            // generate the number of games in each match
            Random random = new Random();
            var numberOfGames = random.Next(competitionSetup.MinimumNumberOfGames, competitionSetup.MaximumNumberOfGames);

            //// loop through the matches
            var matchTasks = new List<Task<MatchResult>>();
            for (var i = 0; i < matchups.Count(); i++)
            {
                var matchSetup = new MatchSetup
                {
                    BothAccusedYears = competitionSetup.BothAccusedYears,
                    BothInnocentYears = competitionSetup.BothInnocentYears,
                    NumberOfGames = numberOfGames,
                    Players = matchups[i]
                };

                matchTasks.Add(context.CallSubOrchestratorAsync<MatchResult>("MatchOrchestrator", $"{context.InstanceId}_{i}", matchSetup));
            }

            context.SetCustomStatus(JsonConvert.SerializeObject(new Status()
            {
                Stage = "Running Matches",
                Message = $"Running all matches.",
                Payload = matchups.Select((m, index) => index)
            }));

            await Task.WhenAll(matchTasks);

            var competitionResults = new CompetitionResult
            {
                MatchResults = matchTasks.Select(t => t.Result).ToList(),
                OverallResults = calculateOverallResults(competitionSetup, matchTasks, log)
            };

            context.SetCustomStatus(JsonConvert.SerializeObject(new Status()
            {
                Stage = "Complete",
                Message = $"Competition Complete",
                Payload = competitionResults
            }));
        }

        private static Player[][] CalculateMatches(Player[] players)
        {
            return players.SelectMany(player1 => players, (player1, player2) => new Player[] { player1, player2 })
                .Where(x => x[0] != x[1])
                .ToArray();
        }

        private static Dictionary<string, int> calculateOverallResults(CompetitionSetup competitionSetup, List<Task<MatchResult>> matchResults, ILogger log)
        {
            var results = new Dictionary<string, int>();

            Debug.WriteLine("FINAL STANDINGS -----------------------");
            foreach (var player in competitionSetup.Players)
            {
                var playerName = player.Name;
                var totalJailTime = matchResults.Sum(r =>
                {
                    if (r.Result.Player1.Name == playerName) { return r.Result.Player1JailTime; }
                    else if (r.Result.Player2.Name == playerName) { return r.Result.Player2JailTime; }
                    return 0;
                });

                Debug.WriteLine($"{playerName} = {totalJailTime}");
                results.Add(playerName, totalJailTime);
            }
            Debug.WriteLine("---------------------------------------");
            return results;
        }

        [FunctionName("CompetitionOrchestrator_HttpStart")]
        public static async Task<HttpResponseMessage> HttpStart(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", "post")]HttpRequestMessage req,
            [OrchestrationClient]DurableOrchestrationClient starter,
            ILogger log)
        {
            var competitionSetup = await req.Content.ReadAsAsync<CompetitionSetup>();
            if (competitionSetup == null)
            {
                throw (new ArgumentException("CompetitionSetup not supplied correctly."));
            }

            // Function input comes from the request content.
            string instanceId = await starter.StartNewAsync("CompetitionOrchestrator", competitionSetup);

            log.LogInformation($"Started CompetitionOrchestrator with ID = '{instanceId}'.");

            return starter.CreateCheckStatusResponse(req, instanceId);
        }
    }
}