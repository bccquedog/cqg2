import * as admin from 'firebase-admin';
import { EventDoc, EventStatus, EventType } from '../types/events';

const db = admin.firestore();

export class EventService {
  private eventsRef = db.collection('events');

  // Allowed status transitions
  private allowedStatusTransitions: Record<EventStatus, EventStatus[]> = {
    draft: ["pregame", "archived"],
    pregame: ["live", "archived"],
    live: ["completed", "archived"],
    completed: ["archived"],
    archived: []
  };

  async createEvent(eventData: Omit<EventDoc, 'id' | 'audit'>): Promise<string> {
    const now = admin.firestore.Timestamp.now();
    const audit = {
      createdBy: 'admin123', // TODO: Get from auth context
      createdAt: now,
      updatedAt: now
    };

    const docRef = await this.eventsRef.add({
      ...eventData,
      audit
    });

    return docRef.id;
  }

  async getEvent(eventId: string): Promise<EventDoc | null> {
    const doc = await this.eventsRef.doc(eventId).get();
    if (!doc.exists) return null;
    
    return { id: doc.id, ...doc.data() } as EventDoc;
  }

  async updateEvent(eventId: string, updates: Partial<EventDoc>): Promise<void> {
    const currentEvent = await this.getEvent(eventId);
    if (!currentEvent) throw new Error('Event not found');

    // Validate status transition
    if (updates.status && updates.status !== currentEvent.status) {
      if (!this.allowedStatusTransitions[currentEvent.status].includes(updates.status)) {
        throw new Error(`Invalid status transition from ${currentEvent.status} to ${updates.status}`);
      }
    }

    await this.eventsRef.doc(eventId).update({
      ...updates,
      'audit.updatedAt': admin.firestore.Timestamp.now()
    });
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.eventsRef.doc(eventId).delete();
  }

  async getEventsByType(type: EventType): Promise<EventDoc[]> {
    const snapshot = await this.eventsRef.where('type', '==', type).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventDoc));
  }

  async getEventsByStatus(status: EventStatus): Promise<EventDoc[]> {
    const snapshot = await this.eventsRef.where('status', '==', status).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventDoc));
  }

  async getLiveEvents(): Promise<EventDoc[]> {
    return this.getEventsByStatus('live');
  }

  async getUpcomingEvents(): Promise<EventDoc[]> {
    const now = admin.firestore.Timestamp.now();
    const snapshot = await this.eventsRef
      .where('status', 'in', ['draft', 'pregame'])
      .where('details.startTime', '>', now)
      .orderBy('details.startTime')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventDoc));
  }

  async addStream(eventId: string, stream: EventDoc['streams'][0]): Promise<void> {
    await this.eventsRef.doc(eventId).update({
      streams: admin.firestore.FieldValue.arrayUnion(stream),
      'audit.updatedAt': admin.firestore.Timestamp.now()
    });
  }

  async removeStream(eventId: string, streamId: string): Promise<void> {
    const event = await this.getEvent(eventId);
    if (!event) throw new Error('Event not found');

    const updatedStreams = event.streams.filter(s => s.streamId !== streamId);
    await this.eventsRef.doc(eventId).update({
      streams: updatedStreams,
      'audit.updatedAt': admin.firestore.Timestamp.now()
    });
  }

  async updateStreamStatus(eventId: string, streamId: string, status: EventDoc['streams'][0]['status']): Promise<void> {
    const event = await this.getEvent(eventId);
    if (!event) throw new Error('Event not found');

    const updatedStreams = event.streams.map(s => 
      s.streamId === streamId ? { ...s, status } : s
    );

    await this.eventsRef.doc(eventId).update({
      streams: updatedStreams,
      'audit.updatedAt': admin.firestore.Timestamp.now()
    });
  }

  async addSurgeHighlight(eventId: string, highlight: EventDoc['surgeHighlights'][0]): Promise<void> {
    await this.eventsRef.doc(eventId).update({
      surgeHighlights: admin.firestore.FieldValue.arrayUnion(highlight),
      'audit.updatedAt': admin.firestore.Timestamp.now()
    });
  }

  async setActivePoll(eventId: string, pollId: string | null): Promise<void> {
    await this.eventsRef.doc(eventId).update({
      'overlays.activePoll': pollId,
      'audit.updatedAt': admin.firestore.Timestamp.now()
    });
  }

  async setActiveClip(eventId: string, clipId: string | null): Promise<void> {
    await this.eventsRef.doc(eventId).update({
      'overlays.activeClip': clipId,
      'audit.updatedAt': admin.firestore.Timestamp.now()
    });
  }
}
