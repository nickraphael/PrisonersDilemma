
using PrisonersDilemma.Enums;

namespace PrisonersDilemma.Classes
{
    public interface IGameResult
    {
        Plea Player1 { get; set; }
        Plea Player2 { get; set; }

    }

    public class GameResult : IGameResult
    {
        public Plea Player1 { get; set; }
        public Plea Player2 { get; set; }
    }
}
