import { Timestamp } from 'firebase-admin/firestore';

export type ClanRole = "leader" | "co-leader" | "member";
export type ClanActivity = "idle" | "in_match" | "streaming" | "in_voice" | "dnd";
export type StreamPlatform = "twitch" | "youtube" | "kick";
export type VoiceSessionType = "hq" | "match" | "huddle";
export type VoiceSessionStatus = "active" | "ended";

export interface ClanMemberStatus {
  online: boolean;
  activity: ClanActivity;
  platform?: StreamPlatform;
  streamUrl?: string;
}

export interface ClanRosterMember {
  playerId: string;
  role: ClanRole;
  joinedAt: Timestamp;
  status: ClanMemberStatus;
}

export interface ClanVoiceSession {
  sessionId: string;
  type: VoiceSessionType;
  status: VoiceSessionStatus;
  participants: string[]; // playerIds
  linkedEventId?: string;
  createdAt: Timestamp;
}

export interface ClanStats {
  wins: number;
  losses: number;
  surgePower: number;
  trophies: string[];
}

export interface ClanActiveSession {
  sessionId: string;
  type: VoiceSessionType;
  participants: number;
  createdAt: Timestamp;
}

export interface ClanComms {
  activeSessions: ClanActiveSession[];
  lastSessionAt: Timestamp;
}

export interface Clan {
  id: string;
  name: string;
  logoUrl: string;
  leaderId: string;
  tagline?: string;
  roster: ClanRosterMember[];
  voiceSessions: ClanVoiceSession[];
  stats: ClanStats;
  clips: string[]; // clipIds
  comms: ClanComms;
}
