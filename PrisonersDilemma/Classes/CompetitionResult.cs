
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using PrisonersDilemma.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace PrisonersDilemma.Classes
{

    public interface ICompetitionResult
    {
        List<MatchResult> MatchResults { get; set; }
        Dictionary<string, int> OverallResults { get; set; }
    }

    public class CompetitionResult : ICompetitionResult
    {
        public List<MatchResult> MatchResults { get; set; }

        public Dictionary<string, int> OverallResults { get; set; }
    }
}
