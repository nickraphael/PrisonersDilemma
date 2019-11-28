//using System;
//using System.IO;
//using System.Threading.Tasks;
//using Microsoft.AspNetCore.Mvc;
//using Microsoft.Azure.WebJobs;
//using Microsoft.Azure.WebJobs.Extensions.Http;
//using Microsoft.AspNetCore.Http;
//using Microsoft.Extensions.Logging;
//using Newtonsoft.Json;
//using PrisonersDilemma.Enums;
//using PrisonersDilemma.Classes;
//using System.Net.Http;

//namespace PrisonersDilemma.Orchestrator
//{
//    public static class CalculateMatchResult
//    {

//        [FunctionName("CalculateMatchResult")]
//        public static (int player1Jailtime, int player2Jailtime) CalculateMatchResultFunction([ActivityTrigger] (Plea player1Plea, Plea player2Plea) pleas, ILogger log)
//        {
//            //needs to be durable and fan out to call calcgameresults
//        }

//        [FunctionName("CalculateMatchResultOrchestrator")]
//        public static async Task<Boolean> RunCalculateMatchResultOrchestrator(
//            [OrchestrationTrigger] DurableOrchestrationContext context,
//            ILogger log)
//        {
//            log.LogWarning("RunCalculateMatchResultOrchestrator");

//            var player1Result = await context.CallActivityAsync<Plea>("SingleGame", (previousPleas, i));

//            return true;
//        }

//        [FunctionName("CalculateMatchResultOrchestrator_HttpStart")]
//        public static async Task<HttpResponseMessage> HttpStart(
//            [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post")]HttpRequestMessage req,
//            [OrchestrationClient]DurableOrchestrationClient starter,
//            ILogger log)
//        {
//            // Function input comes from the request content.
//            string instanceId = await starter.StartNewAsync("CalculateMatchResultOrchestrator", null);

//            log.LogInformation($"Started CalculateMatchResultOrchestrator with ID = '{instanceId}'.");

//            return starter.CreateCheckStatusResponse(req, instanceId);
//        }
//    }
//}
//}
