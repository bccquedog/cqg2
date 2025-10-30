import { Timestamp } from 'firebase-admin/firestore';

// Player Status Types
export type PlayerStatus = "online" | "idle" | "in_match" | "offline";

// Tournament Status Types
export type TournamentStatus = "setup" | "registration" | "live" | "completed" | "archived";

// Match Status Types
export type MatchStatus = "pending" | "live" | "completed" | "cancelled";

// Event Types and Status
export type EventType = "pregame" | "tournament" | "league" | "community";
export type EventStatus = "upcoming" | "live" | "completed" | "cancelled";

// Player Interface
export interface Player {
  gamerTag: string;
  avatarUrl: string;
  status: PlayerStatus;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Tournament Settings Interface
export interface TournamentSettings {
  format: "single_elimination" | "double_elimination" | "round_robin" | "swiss";
  checkInWindow: number; // minutes
  maxPlayers?: number;
  entryFee?: number;
  prizePool?: number;
}

// Tournament Interface
export interface Tournament {
  name: string;
  game: string;
  status: TournamentStatus;
  settings: TournamentSettings;
  players: string[]; // player IDs
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Match Score Interface
export interface MatchScore {
  playerA: number;
  playerB: number;
  rounds?: number[];
}

// Tournament Match Interface
export interface TournamentMatch {
  playerA: string; // player ID
  playerB: string; // player ID
  status: MatchStatus;
  score: MatchScore | null;
  winner: string | null; // player ID
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Event Stream Interface
export interface EventStream {
  streamId: string;
  playerId?: string;
  platform: "twitch" | "youtube" | "kick";
  url: string;
  isFeatured: boolean;
  status: "offline" | "live" | "completed";
}

// Event Interface
export interface Event {
  title: string;
  type: EventType;
  status: EventStatus;
  streams: EventStream[];
  startTime: Timestamp;
  endTime?: Timestamp;
  description?: string;
  game?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Sample Data Structure Interface
export interface SampleDataStructure {
  players: Record<string, Player>;
  tournaments: Record<string, Tournament>;
  "tournaments/tourney1/matches": Record<string, TournamentMatch>;
  events: Record<string, Event>;
}


