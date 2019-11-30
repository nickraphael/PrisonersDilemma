
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using PrisonersDilemma.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace PrisonersDilemma.Classes
{

    public interface IMatchResult
    {
        List<GameResult> Pleas { get; set; }
        int Player1JailTime { get; set; }
        int Player2JailTime { get; set; }
        PlayerEnum? Winner { get; set; }
    }

    public class MatchResult : IMatchResult
    {
        public List<GameResult> Pleas { get; set; } = new List<GameResult>();
        public int Player1JailTime { get; set; } = 0;
        public int Player2JailTime { get; set; } = 0;

        [JsonConverter(typeof(StringEnumConverter))]
        public PlayerEnum? Winner { get; set; }
    }
}
