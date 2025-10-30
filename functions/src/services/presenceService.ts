import * as admin from 'firebase-admin';
import { EventPresence, PresenceStatus, StreamPlatform } from '../types/presence';

const db = admin.firestore();

export class PresenceService {
  private getPresenceRef(eventId: string, playerId: string) {
    return db.collection('events').doc(eventId).collection('presence').doc(playerId);
  }

  async updatePresence(
    eventId: string, 
    playerId: string, 
    status: PresenceStatus,
    platform?: StreamPlatform,
    streamUrl?: string
  ): Promise<void> {
    const presenceData: EventPresence = {
      playerId,
      status,
      platform,
      streamUrl,
      lastUpdated: admin.firestore.Timestamp.now()
    };

    await this.getPresenceRef(eventId, playerId).set(presenceData);
  }

  async getPlayerPresence(eventId: string, playerId: string): Promise<EventPresence | null> {
    const doc = await this.getPresenceRef(eventId, playerId).get();
    if (!doc.exists) return null;
    
    return doc.data() as EventPresence;
  }

  async getEventPresence(eventId: string): Promise<EventPresence[]> {
    const snapshot = await db.collection('events').doc(eventId).collection('presence').get();
    return snapshot.docs.map(doc => doc.data() as EventPresence);
  }

  async getPresenceByStatus(eventId: string, status: PresenceStatus): Promise<EventPresence[]> {
    const snapshot = await db.collection('events').doc(eventId)
      .collection('presence')
      .where('status', '==', status)
      .orderBy('lastUpdated', 'desc')
      .get();
    
    return snapshot.docs.map(doc => doc.data() as EventPresence);
  }

  async getStreamingPlayers(eventId: string): Promise<EventPresence[]> {
    const snapshot = await db.collection('events').doc(eventId)
      .collection('presence')
      .where('status', '==', 'streaming')
      .orderBy('lastUpdated', 'desc')
      .get();
    
    return snapshot.docs.map(doc => doc.data() as EventPresence);
  }

  async getPlayersByPlatform(eventId: string, platform: StreamPlatform): Promise<EventPresence[]> {
    const snapshot = await db.collection('events').doc(eventId)
      .collection('presence')
      .where('platform', '==', platform)
      .orderBy('lastUpdated', 'desc')
      .get();
    
    return snapshot.docs.map(doc => doc.data() as EventPresence);
  }

  async removePresence(eventId: string, playerId: string): Promise<void> {
    await this.getPresenceRef(eventId, playerId).delete();
  }

  async clearEventPresence(eventId: string): Promise<void> {
    const batch = db.batch();
    const snapshot = await db.collection('events').doc(eventId).collection('presence').get();
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  }

  // Real-time presence monitoring
  onPresenceChange(eventId: string, callback: (presence: EventPresence[]) => void): () => void {
    return db.collection('events').doc(eventId).collection('presence')
      .onSnapshot(snapshot => {
        const presence = snapshot.docs.map(doc => doc.data() as EventPresence);
        callback(presence);
      });
  }

  onPlayerPresenceChange(eventId: string, playerId: string, callback: (presence: EventPresence | null) => void): () => void {
    return this.getPresenceRef(eventId, playerId)
      .onSnapshot(doc => {
        const presence = doc.exists ? doc.data() as EventPresence : null;
        callback(presence);
      });
  }
}


