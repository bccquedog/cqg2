export type LeagueStatus =
  | "draft"
  | "registration"
  | "checkin"
  | "active"
  | "playoffs"
  | "completed"
  | "archived";

export interface LeagueSettings {
  teamCap: number;
  format: "round_robin" | "division" | "conference" | "swiss" | "points";
  durationWeeks: number; // 6–12
  buyIn?: number; // CQG Coins if required
  requiresStream: boolean;
  ruleLayerId: string; // reference to rules
  submissionType: "score" | "statBundle" | "screenshot" | "custom";
}

export interface LeagueSlots {
  registered: string[]; // playerIds or teamIds
  waitlist: string[];
  checkedIn: string[];
}

export interface LeagueMatchResult {
  winner: string;
  loser: string;
  score: Record<string, number>;
  streamLink?: string;
}

export interface LeagueMatch {
  matchId: string;
  players: string[]; // or teamIds
  status: "pending" | "in_progress" | "completed" | "disputed" | "forfeit";
  result?: LeagueMatchResult;
}

export interface LeagueWeek {
  week: number;
  matches: LeagueMatch[];
}

export interface LeagueStanding {
  playerId: string; // or teamId
  wins: number;
  losses: number;
  points: number;
  differential: number;
  streak: string; // e.g., "W3", "L2"
}

export interface LeaguePlayoffMatch {
  matchId: string;
  players: string[];
  winner?: string;
  loser?: string;
  score?: Record<string, number>;
  status: "pending" | "in_progress" | "completed";
}

export interface LeaguePlayoffRound {
  roundNumber: number;
  matches: LeaguePlayoffMatch[];
}

export interface LeaguePlayoffBracket {
  rounds: LeaguePlayoffRound[];
}

export interface LeaguePlayoffs {
  bracket: LeaguePlayoffBracket;
}

export interface LeagueRewards {
  champion: { coins: number; xp: number; badgeId?: string };
  runnerUp?: { coins: number; xp: number };
}

export interface LeagueAudit {
  createdBy: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface League {
  id?: string; // leagueId
  name: string;
  game: string;
  season: number; // e.g., Season 1, Season 2
  status: LeagueStatus;

  settings: LeagueSettings;
  slots?: LeagueSlots;
  schedule?: LeagueWeek[];
  standings?: LeagueStanding[];
  playoffs?: LeaguePlayoffs;
  rewards?: LeagueRewards;
  audit?: LeagueAudit;

  // Lifecycle/retention
  archived?: boolean;
  pruneAt?: string; // ISO timestamp

  createdAt?: string;
  updatedAt?: string;
}




