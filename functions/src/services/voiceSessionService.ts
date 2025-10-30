import * as admin from 'firebase-admin';
import { VoiceSession, VoiceSessionType, VoiceSessionStatus, VoiceSessionParticipant } from '../types/voiceSessions';

const db = admin.firestore();

export class VoiceSessionService {
  private getSessionRef(clanId: string, sessionId: string) {
    return db.collection('clans').doc(clanId).collection('voiceSessions').doc(sessionId);
  }

  async createVoiceSession(
    clanId: string,
    sessionId: string,
    createdBy: string,
    type: VoiceSessionType,
    linkedEventId?: string,
    isRecording = false
  ): Promise<void> {
    const sessionData: VoiceSession = {
      sessionId,
      createdBy,
      createdAt: admin.firestore.Timestamp.now(),
      type,
      status: 'active',
      participants: [],
      metadata: {
        linkedEventId,
        isRecording
      }
    };

    await this.getSessionRef(clanId, sessionId).set(sessionData);
  }

  async getVoiceSession(clanId: string, sessionId: string): Promise<VoiceSession | null> {
    const doc = await this.getSessionRef(clanId, sessionId).get();
    if (!doc.exists) return null;
    
    return doc.data() as VoiceSession;
  }

  async getClanVoiceSessions(clanId: string): Promise<VoiceSession[]> {
    const snapshot = await db.collection('clans').doc(clanId)
      .collection('voiceSessions')
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => doc.data() as VoiceSession);
  }

  async getActiveVoiceSessions(clanId: string): Promise<VoiceSession[]> {
    const snapshot = await db.collection('clans').doc(clanId)
      .collection('voiceSessions')
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => doc.data() as VoiceSession);
  }

  async getVoiceSessionsByType(clanId: string, type: VoiceSessionType): Promise<VoiceSession[]> {
    const snapshot = await db.collection('clans').doc(clanId)
      .collection('voiceSessions')
      .where('type', '==', type)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => doc.data() as VoiceSession);
  }

  async getVoiceSessionsByCreator(clanId: string, createdBy: string): Promise<VoiceSession[]> {
    const snapshot = await db.collection('clans').doc(clanId)
      .collection('voiceSessions')
      .where('createdBy', '==', createdBy)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => doc.data() as VoiceSession);
  }

  async getVoiceSessionsByEvent(clanId: string, linkedEventId: string): Promise<VoiceSession[]> {
    const snapshot = await db.collection('clans').doc(clanId)
      .collection('voiceSessions')
      .where('metadata.linkedEventId', '==', linkedEventId)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => doc.data() as VoiceSession);
  }

  async addParticipant(clanId: string, sessionId: string, playerId: string): Promise<void> {
    const sessionRef = this.getSessionRef(clanId, sessionId);
    
    await sessionRef.update({
      participants: admin.firestore.FieldValue.arrayUnion({
        playerId,
        joinedAt: admin.firestore.Timestamp.now()
      })
    });
  }

  async removeParticipant(clanId: string, sessionId: string, playerId: string): Promise<void> {
    const session = await this.getVoiceSession(clanId, sessionId);
    if (!session) throw new Error('Voice session not found');

    const updatedParticipants = session.participants.map(p => {
      if (p.playerId === playerId && !p.leftAt) {
        return { ...p, leftAt: admin.firestore.Timestamp.now() };
      }
      return p;
    });

    await this.getSessionRef(clanId, sessionId).update({
      participants: updatedParticipants
    });
  }

  async endVoiceSession(clanId: string, sessionId: string): Promise<void> {
    const session = await this.getVoiceSession(clanId, sessionId);
    if (!session) throw new Error('Voice session not found');

    // Mark all active participants as left
    const updatedParticipants = session.participants.map(p => {
      if (!p.leftAt) {
        return { ...p, leftAt: admin.firestore.Timestamp.now() };
      }
      return p;
    });

    await this.getSessionRef(clanId, sessionId).update({
      status: 'ended',
      participants: updatedParticipants
    });
  }

  async updateRecordingStatus(clanId: string, sessionId: string, isRecording: boolean): Promise<void> {
    await this.getSessionRef(clanId, sessionId).update({
      'metadata.isRecording': isRecording
    });
  }

  async deleteVoiceSession(clanId: string, sessionId: string): Promise<void> {
    await this.getSessionRef(clanId, sessionId).delete();
  }

  // Real-time monitoring
  onVoiceSessionChange(clanId: string, callback: (sessions: VoiceSession[]) => void): () => void {
    return db.collection('clans').doc(clanId).collection('voiceSessions')
      .onSnapshot(snapshot => {
        const sessions = snapshot.docs.map(doc => doc.data() as VoiceSession);
        callback(sessions);
      });
  }

  onActiveVoiceSessionsChange(clanId: string, callback: (sessions: VoiceSession[]) => void): () => void {
    return db.collection('clans').doc(clanId).collection('voiceSessions')
      .where('status', '==', 'active')
      .onSnapshot(snapshot => {
        const sessions = snapshot.docs.map(doc => doc.data() as VoiceSession);
        callback(sessions);
      });
  }

  onVoiceSessionUpdate(clanId: string, sessionId: string, callback: (session: VoiceSession | null) => void): () => void {
    return this.getSessionRef(clanId, sessionId)
      .onSnapshot(doc => {
        const session = doc.exists ? doc.data() as VoiceSession : null;
        callback(session);
      });
  }
}


