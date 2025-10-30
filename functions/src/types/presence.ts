import { Timestamp } from 'firebase-admin/firestore';

export type PresenceStatus = "online" | "in_match" | "streaming" | "chilling" | "dnd";
export type StreamPlatform = "twitch" | "youtube" | "kick";

export interface EventPresence {
  playerId: string;
  status: PresenceStatus;
  platform?: StreamPlatform;
  streamUrl?: string;
  lastUpdated: Timestamp;
}


