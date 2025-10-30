import { Timestamp } from "firebase/firestore";

export interface Match {
  id: string;
  tournamentId: string;
  playerA: string; // uid
  playerB: string; // uid
  scoreA: number;
  scoreB: number;
  winner: string | null; // uid
  status: 'pending' | 'live' | 'completed';
  submittedAt: Timestamp | null;
  reportedBy: string | null; // last submitter uid
  round: number;
  highlights?: { clipUrl: string; uploader: string; timestamp: Timestamp }[];
}

export interface MatchTeam {
  teamId: string;
  clanId?: string;
  players: string[];
  score: number;
}

export interface NewMatch {
  id?: string;
  format: "1v1" | "2v2" | "5v5";
  teams: MatchTeam[];
  winnerTeamId: string;
  streamLink: string;
  createdAt: Timestamp;
}

export interface TournamentPlayer {
  userId: string;
  joinedAt: number;
}

export interface Tournament {
  id?: string;
  name: string;
  game: string;
  season: string;
  type: "solo" | "clan";
  participants: string[]; // playerIds or clanIds depending on type
  bracket: Record<string, unknown>; // bracket structure (reuse existing)
  createdAt: Timestamp;
}

export interface LeagueTeam {
  teamId: string; // userId for now
  joinedAt: number;
}

export interface LeagueStats {
  matchesPlayed: number;
  wins?: number;
  losses?: number;
}

export interface League {
  id?: string;
  name: string;
  season: string;
  type: "solo" | "clan";
  participants: string[]; // playerIds OR clanIds depending on type
  stats: LeagueStats;
  createdAt: Timestamp;
}
