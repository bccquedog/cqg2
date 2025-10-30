import { Timestamp } from "firebase/firestore";

// ========================
// SCHEDULE TYPES
// ========================

export interface ScheduleEvent {
  id: string;
  title: string;
  description?: string;
  type: "match" | "round" | "deadline" | "break" | "ceremony";
  startTime: string; // ISO string
  endTime: string; // ISO string
  status: "scheduled" | "in_progress" | "completed" | "cancelled" | "postponed";
  location?: string;
  streamLink?: string;
  participants?: string[];
  metadata?: {
    roundId?: string;
    matchId?: string;
    weekId?: string;
    fixtureId?: string;
    [key: string]: any;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ScheduleDay {
  date: string; // YYYY-MM-DD format
  events: ScheduleEvent[];
  isRestDay?: boolean;
  notes?: string;
}

export interface TournamentSchedule {
  id: string;
  tournamentId: string;
  name: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  timezone: string; // e.g., "America/New_York"
  days: ScheduleDay[];
  totalEvents: number;
  completedEvents: number;
  status: "draft" | "published" | "active" | "completed" | "cancelled";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface LeagueSchedule {
  id: string;
  leagueId: string;
  name: string;
  description?: string;
  season: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  timezone: string;
  weeks: LeagueWeek[];
  totalWeeks: number;
  currentWeek: number;
  status: "draft" | "published" | "active" | "completed" | "cancelled";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface LeagueWeek {
  weekNumber: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  events: ScheduleEvent[];
  isByeWeek?: boolean;
  notes?: string;
}

// ========================
// SCHEDULE GENERATION TYPES
// ========================

export interface ScheduleGenerationOptions {
  startDate: string;
  endDate: string;
  timezone: string;
  matchDuration: number; // in minutes
  breakDuration: number; // in minutes
  dailyStartTime: string; // HH:MM format
  dailyEndTime: string; // HH:MM format
  restDays: string[]; // ["sunday", "monday", etc.]
  maxMatchesPerDay: number;
}

export interface TournamentScheduleOptions extends ScheduleGenerationOptions {
  rounds: {
    roundNumber: number;
    name: string;
    matchCount: number;
    estimatedDuration: number; // in minutes
  }[];
}

export interface LeagueScheduleOptions extends ScheduleGenerationOptions {
  totalWeeks: number;
  matchesPerWeek: number;
  byeWeeks?: number[];
}

// ========================
// SCHEDULE UTILITY TYPES
// ========================

export interface ScheduleStats {
  totalEvents: number;
  completedEvents: number;
  pendingEvents: number;
  inProgressEvents: number;
  cancelledEvents: number;
  completionPercentage: number;
  totalDuration: number; // in minutes
  averageEventDuration: number; // in minutes
}

export interface ScheduleValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: ScheduleStats;
}

// ========================
// SCHEDULE TEMPLATE TYPES
// ========================

export interface ScheduleTemplate {
  id: string;
  name: string;
  description: string;
  type: "tournament" | "league";
  template: {
    events: {
      type: ScheduleEvent["type"];
      title: string;
      duration: number; // in minutes
      order: number;
    }[];
    defaultOptions: Partial<ScheduleGenerationOptions>;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}


