export type LeaderboardScope = "tournament" | "league" | "global";

export interface LeaderboardEntry {
  playerId: string;
  wins: number;
  losses: number;
  points: number;
  streak: string; // e.g., W3
  surgeScore?: number;
  placement?: number; // final rank
}

export interface LeaderboardAudit {
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface Leaderboard {
  id?: string; // leaderboardId
  scope: LeaderboardScope;
  refId?: string; // tournamentId or leagueId if scope != global
  game?: string; // e.g., COD, Madden
  season?: number;

  entries: LeaderboardEntry[];
  audit?: LeaderboardAudit;

  createdAt?: string;
  updatedAt?: string;
}




