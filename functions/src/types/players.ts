import { Timestamp } from 'firebase-admin/firestore';

export type StreamPlatform = "twitch" | "youtube" | "kick";
export type LegacyEventType = "tournament" | "league" | "challenge" | "stream";

export interface PlayerProfile {
  gamerTag: string;
  avatarUrl: string;
  bio?: string;
}

export interface PlayerStatus {
  live: boolean;
  platform?: StreamPlatform;
  streamUrl?: string;
  currentEventId?: string;
}

export interface PlayerClip {
  clipId: string;
  eventId?: string;
  url: string;
  surgeScore?: number;
  featured?: boolean;
}

export interface PlayerStream {
  streamId: string;
  eventId?: string;
  platform: StreamPlatform;
  url: string;
  startTime: Timestamp;
  endTime?: Timestamp;
}

export interface PlayerLegacy {
  season: number;
  type: LegacyEventType;
  description: string;
  date: Timestamp;
}

export interface PlayerDoc {
  id: string; // playerId
  profile: PlayerProfile;
  status: PlayerStatus;
  clips: PlayerClip[];
  streams: PlayerStream[];
  legacy: PlayerLegacy[];
}


