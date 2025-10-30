import { Timestamp } from 'firebase-admin/firestore';

export type EventType = "tournament" | "league" | "community" | "special";
export type EventStatus = "draft" | "pregame" | "live" | "completed" | "archived";
export type StreamPlatform = "twitch" | "youtube" | "kick";
export type StreamStatus = "offline" | "live" | "completed";
export type AdType = "static" | "video";
export type AdSlot = "pregame" | "watchzone" | "betweenMatches";

export interface EventStream {
  streamId: string;
  playerId?: string; // link to player if POV
  platform: StreamPlatform;
  url: string;
  isFeatured: boolean;
  status: StreamStatus;
}

export interface EventAd {
  adId: string;
  type: AdType;
  url: string;
  slot: AdSlot;
}

export interface EventOverlays {
  activePoll?: string; // pollId
  activeClip?: string; // clipId
  ads: EventAd[];
}

export interface SurgeHighlight {
  clipId: string;
  playerId: string;
  scoreBoost: number;
  timestamp: Timestamp;
}

export interface ChatIntegration {
  discordChannelId?: string;
  cqgChatEnabled: boolean;
}

export interface EventDetails {
  title: string;
  description?: string;
  game?: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  organizerId: string;
}

export interface EventAudit {
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface EventDoc {
  id: string; // eventId
  type: EventType;
  status: EventStatus;
  details: EventDetails;
  streams: EventStream[];
  overlays: EventOverlays;
  surgeHighlights: SurgeHighlight[];
  chatIntegration: ChatIntegration;
  audit: EventAudit;
}


