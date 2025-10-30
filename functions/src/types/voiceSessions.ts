import { Timestamp } from 'firebase-admin/firestore';

export type VoiceSessionType = "permanent" | "match" | "huddle";
export type VoiceSessionStatus = "active" | "ended";

export interface VoiceSessionParticipant {
  playerId: string;
  joinedAt: Timestamp;
  leftAt?: Timestamp;
}

export interface VoiceSessionMetadata {
  linkedEventId?: string; // tournament/league match
  isRecording?: boolean;
}

export interface VoiceSession {
  sessionId: string;
  createdBy: string;
  createdAt: Timestamp;
  type: VoiceSessionType;
  status: VoiceSessionStatus;
  participants: VoiceSessionParticipant[];
  metadata: VoiceSessionMetadata;
}


