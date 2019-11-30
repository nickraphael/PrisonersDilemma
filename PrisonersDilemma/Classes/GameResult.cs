
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using PrisonersDilemma.Enums;

namespace PrisonersDilemma.Classes
{
    public interface IGameResult
    {
        PleaEnum Player1 { get; set; }
        PleaEnum Player2 { get; set; }

    }

    public class GameResult : IGameResult
    {
        [JsonConverter(typeof(StringEnumConverter))]
        public PleaEnum Player1 { get; set; }

        [JsonConverter(typeof(StringEnumConverter))]
        public PleaEnum Player2 { get; set; }
    }
}
