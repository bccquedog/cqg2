import { Timestamp } from "firebase/firestore";

// ========================
// BRACKET TYPES
// ========================

export interface BracketMatch {
  id: string;
  roundId: string;
  matchNumber: number;
  team1: {
    id: string;
    name: string;
    seed?: number;
    isBye?: boolean;
  };
  team2: {
    id: string;
    name: string;
    seed?: number;
    isBye?: boolean;
  };
  winner?: string; // team1.id or team2.id
  score?: {
    team1: number;
    team2: number;
  };
  status: "pending" | "in_progress" | "completed" | "cancelled";
  scheduledAt?: string;
  completedAt?: string;
  streamLink?: string;
  notes?: string;
}

export interface BracketRound {
  id: string;
  name: string; // e.g., "Round of 16", "Quarterfinals", "Semifinals", "Finals"
  roundNumber: number;
  matches: BracketMatch[];
  isComplete: boolean;
  startDate?: string;
  endDate?: string;
}

export interface TournamentBracket {
  id: string;
  tournamentId: string;
  format: "single_elimination" | "double_elimination" | "round_robin" | "swiss";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  rounds: BracketRound[];
  currentRound?: number;
  totalRounds: number;
  participants: string[]; // participant IDs
  seeding?: Record<string, number>; // participantId -> seed number
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ========================
// LEAGUE BRACKET TYPES
// ========================

export interface LeagueFixture {
  id: string;
  week: number;
  matchNumber: number;
  homeTeam: {
    id: string;
    name: string;
  };
  awayTeam: {
    id: string;
    name: string;
  };
  winner?: string; // homeTeam.id or awayTeam.id
  score?: {
    home: number;
    away: number;
  };
  status: "pending" | "in_progress" | "completed" | "cancelled" | "postponed";
  scheduledAt?: string;
  completedAt?: string;
  streamLink?: string;
  notes?: string;
}

export interface LeagueStanding {
  teamId: string;
  teamName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws?: number;
  points: number; // 3 for win, 1 for draw, 0 for loss
  goalsFor?: number;
  goalsAgainst?: number;
  goalDifference?: number;
  winPercentage: number;
  streak: {
    type: "win" | "loss" | "draw";
    count: number;
  };
}

export interface LeagueBracket {
  id: string;
  leagueId: string;
  format: "round_robin" | "double_round_robin" | "playoffs";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  season: string;
  currentWeek: number;
  totalWeeks: number;
  fixtures: LeagueFixture[];
  standings: LeagueStanding[];
  participants: string[]; // team/clan IDs
  playoffBracket?: TournamentBracket; // For leagues with playoff rounds
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ========================
// BRACKET GENERATION TYPES
// ========================

export interface BracketGenerationOptions {
  format: "single_elimination" | "double_elimination" | "round_robin" | "swiss";
  participants: string[];
  seeding?: Record<string, number>;
  matchesPerRound?: number;
  totalRounds?: number;
  startDate?: string;
  matchDuration?: number; // in minutes
}

export interface LeagueGenerationOptions {
  format: "round_robin" | "double_round_robin" | "playoffs";
  participants: string[];
  totalWeeks?: number;
  matchesPerWeek?: number;
  startDate?: string;
  matchDuration?: number;
  includePlayoffs?: boolean;
  playoffParticipants?: number; // top N teams advance to playoffs
}

// ========================
// BRACKET UTILITY TYPES
// ========================

export interface BracketStats {
  totalMatches: number;
  completedMatches: number;
  pendingMatches: number;
  inProgressMatches: number;
  cancelledMatches: number;
  completionPercentage: number;
  averageMatchDuration?: number; // in minutes
  totalStreamTime?: number; // in minutes
}

export interface BracketValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: BracketStats;
}


