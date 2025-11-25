
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
  claimedDiscounts?: string[]; // Track which rewards have been claimed (e.g., ["%5", "%10"])
}

export interface LeaderboardEntry {
  username: string;
  score: number;
}
