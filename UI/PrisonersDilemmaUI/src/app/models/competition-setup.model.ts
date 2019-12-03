export interface ICompetitionSetup {
  bothInnocentYears: number;
  bothAccusedYears: number;
  oneAccusedYears: number;
  players: [
    {
      name: string;
      imageUri: string;
    }
  ];
}
