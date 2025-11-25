
export enum AppScreen {
  LOGIN = 'LOGIN',
  MENU = 'MENU',
  GAME = 'GAME',
  WIN = 'WIN',
  FAIL = 'FAIL',
  LEADERBOARD = 'LEADERBOARD'
}

export interface PlayerStats {
  highScore: number;
  rank: number;
  gamesPlayed: number;
}

export interface GameResult {
  score: number;
  discountCode?: string;
  discountAmount?: string;
}

export interface User {
  email: string;
  username: string; // The masked username
  highScore: number;
  gamesPlayed: number;
}

export interface LeaderboardEntry {
  username: string;
  score: number;
}
