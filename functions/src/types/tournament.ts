export interface Tournament {
  id?: string;
  name: string;
  game: string;
  status: TournamentStatus;
  type: TournamentType;
  // Optional link to a league season (made optional to align with schema)
  seasonId?: string;
  // Optional buy-in (coins) to align with schema; kept legacy buyIn in settings too
  buyIn?: number;
  settings: TournamentSettings;
  createdAt: string;
  updatedAt: string;
  // Optional fields for extended functionality
  description?: string;
  startDate?: string;
  endDate?: string;
  maxPlayers?: number;
  currentPlayers?: number;
  prizePool?: number;
  winner?: string;
  participants?: string[];
  brackets?: TournamentBracket[];
  matches?: TournamentMatch[];

  // Archival/retention
  archived?: boolean;
  pruneAt?: string; // ISO timestamp when eligible for pruning

  // New schema-aligned optional fields
  slots?: TournamentSlots;
  bracket?: StructuredBracket; // structured bracket tree
  notifications?: TournamentNotifications;
  rewards?: TournamentRewards;
  audit?: TournamentAudit;
}

// Extended to align with provided schema while preserving legacy statuses
export type TournamentStatus =
  | "draft"
  | "registration"
  | "checkin"
  | "upcoming"
  | "live"
  | "completed"
  | "cancelled"
  | "archived";

export type TournamentType = "single_elim" | "double_elim" | "swiss" | "round_robin" | "league";

export interface TournamentSettings {
  maxPlayers: number;
  streamRequired: boolean;
  disputesAllowed: boolean;
  // Additional settings
  registrationDeadline?: string;
  checkInRequired?: boolean;
  checkInDuration?: number; // minutes
  matchTimeLimit?: number; // minutes
  breakTimeBetweenMatches?: number; // minutes
  allowLateRegistration?: boolean;
  requireVerification?: boolean;
  customRules?: string;
  // League-specific settings
  maxTeams?: number;
  matchFrequency?: "daily" | "weekly" | "biweekly" | "monthly";
  statTracking?: string[];
  tier?: "Gamer" | "Mamba" | "King" | "Elite";

  // New schema-aligned fields (kept optional to avoid breaking existing code)
  teamCap?: number; // e.g., 8, 16, 32
  buyIn?: number; // CQG Coins if applicable
  requiresStream?: boolean; // enforce POV streaming
  ruleLayerId?: string; // reference to rules collection
  seeding?: "random" | "leaderboard" | "manual";
  checkInWindow?: {
    start: FirebaseFirestore.Timestamp;
    end: FirebaseFirestore.Timestamp;
  };
}

export interface TournamentBracket {
  id: string;
  round: number;
  matches: string[]; // match IDs
  isElimination?: boolean;
  isLosersBracket?: boolean;
}

export interface TournamentMatch {
  id: string;
  tournamentId: string;
  round: number;
  player1?: string;
  player2?: string;
  team1?: string;
  team2?: string;
  player1Score?: number;
  player2Score?: number;
  team1Score?: number;
  team2Score?: number;
  status: MatchStatus;
  scheduledTime?: string;
  completedAt?: string;
  streamUrl?: string;
  dispute?: MatchDispute;
  bracketId?: string;
  matchType: "individual" | "team";
}

export type MatchStatus = "scheduled" | "in_progress" | "completed" | "forfeit" | "disputed";

export interface MatchDispute {
  id: string;
  matchId: string;
  reportedBy: string;
  reason: string;
  description: string;
  status: DisputeStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
}

export type DisputeStatus = "open" | "under_review" | "resolved" | "dismissed";

export interface TournamentParticipant {
  id: string;
  tournamentId: string;
  playerId: string;
  playerName: string;
  playerTag: string;
  registeredAt: string;
  checkedIn: boolean;
  checkedInAt?: string;
  seed?: number;
  eliminated: boolean;
  eliminatedAt?: string;
  finalRank?: number;
  prize?: number;
}

export interface TournamentTeam {
  id: string;
  tournamentId: string;
  teamName: string;
  teamTag: string;
  captainId: string;
  captainName: string;
  members: TeamMember[];
  registeredAt: string;
  checkedIn: boolean;
  checkedInAt?: string;
  seed?: number;
  eliminated: boolean;
  eliminatedAt?: string;
  finalRank?: number;
  prize?: number;
  stats: TeamStats;
}

export interface TeamMember {
  playerId: string;
  playerName: string;
  playerTag: string;
  role: "captain" | "member" | "substitute";
  joinedAt: string;
}

export interface TeamStats {
  wins: number;
  losses: number;
  draws: number;
  pointDiff: number;
  totalPoints: number;
  totalPointsAgainst: number;
  matchesPlayed: number;
  customStats: Record<string, number>;
}

export interface TournamentPrize {
  id: string;
  tournamentId: string;
  rank: number;
  amount: number;
  percentage?: number; // percentage of total prize pool
  description?: string;
}

export interface TournamentSeason {
  id: string;
  name: string;
  year: number;
  quarter: number;
  startDate: string;
  endDate: string;
  status: SeasonStatus;
  totalTournaments: number;
  totalPrizePool: number;
  createdAt: string;
  updatedAt: string;
}

export type SeasonStatus = "upcoming" | "active" | "completed";

// Service interfaces
export interface TournamentService {
  createTournament(tournament: Omit<Tournament, "id" | "createdAt" | "updatedAt">): Promise<string>;
  getTournament(id: string): Promise<Tournament | null>;
  updateTournament(id: string, updates: Partial<Tournament>): Promise<void>;
  deleteTournament(id: string): Promise<void>;
  getTournaments(filters?: TournamentFilters): Promise<Tournament[]>;
  getTournamentsBySeason(seasonId: string): Promise<Tournament[]>;
  getActiveTournaments(): Promise<Tournament[]>;
  getUpcomingTournaments(): Promise<Tournament[]>;
  getCompletedTournaments(): Promise<Tournament[]>;
  registerPlayer(tournamentId: string, playerId: string, playerData: Partial<TournamentParticipant>): Promise<void>;
  unregisterPlayer(tournamentId: string, playerId: string): Promise<void>;
  checkInPlayer(tournamentId: string, playerId: string): Promise<void>;
  createMatch(tournamentId: string, match: Omit<TournamentMatch, "id" | "tournamentId">): Promise<string>;
  updateMatch(matchId: string, updates: Partial<TournamentMatch>): Promise<void>;
  reportDispute(dispute: Omit<MatchDispute, "id" | "createdAt">): Promise<string>;
  resolveDispute(disputeId: string, resolution: string, resolvedBy: string): Promise<void>;
  // Team management
  registerTeam(tournamentId: string, team: Omit<TournamentTeam, "id" | "tournamentId" | "registeredAt" | "stats">): Promise<string>;
  unregisterTeam(tournamentId: string, teamId: string): Promise<void>;
  checkInTeam(tournamentId: string, teamId: string): Promise<void>;
  addTeamMember(tournamentId: string, teamId: string, member: TeamMember): Promise<void>;
  removeTeamMember(tournamentId: string, teamId: string, playerId: string): Promise<void>;
  updateTeamStats(tournamentId: string, teamId: string, stats: Partial<TeamStats>): Promise<void>;
  getTournamentTeams(tournamentId: string): Promise<TournamentTeam[]>;
}

export interface TournamentFilters {
  status?: TournamentStatus;
  type?: TournamentType;
  game?: string;
  seasonId?: string;
  minBuyIn?: number;
  maxBuyIn?: number;
  streamRequired?: boolean;
  disputesAllowed?: boolean;
  limit?: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
  // League-specific filters
  tier?: "Gamer" | "Mamba" | "King" | "Elite";
  matchFrequency?: "daily" | "weekly" | "biweekly" | "monthly";
  maxTeams?: number;
}

// New schema-aligned structures (kept additive to avoid breaking existing callers)
export interface TournamentSlots {
  registered: string[]; // playerIds
  waitlist: string[]; // playerIds
  checkedIn: string[]; // playerIds
  lateEntries: string[]; // playerIds
}

export interface StructuredBracket {
  rounds: BracketRound[];
}

export interface BracketRound {
  roundNumber: number;
  matches: BracketMatch[];
}

export interface BracketMatch {
  matchId: string;
  players: string[]; // playerIds
  winner?: string; // playerId
  loser?: string; // playerId
  score?: Record<string, number>; // playerId -> score
  streamLink?: string;
  status: "pending" | "in_progress" | "completed" | "disputed";
}

export interface TournamentNotifications {
  checkInSent: boolean;
  matchRemindersSent: string[]; // matchIds
}

export interface TournamentRewards {
  winner: {
    coins: number;
    xp: number;
    badgeId?: string;
  };
  runnerUp?: {
    coins: number;
    xp: number;
  };
}

export interface TournamentAudit {
  createdBy: string; // adminId
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
