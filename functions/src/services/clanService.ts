import * as admin from 'firebase-admin';
import { Clan, ClanRole, ClanActivity, StreamPlatform, VoiceSessionType, VoiceSessionStatus } from '../types/clans';

const db = admin.firestore();

export class ClanService {
  private clansRef = db.collection('clans');

  async createClan(clanData: Omit<Clan, 'id'>): Promise<string> {
    const docRef = await this.clansRef.add(clanData);
    return docRef.id;
  }

  async getClan(clanId: string): Promise<Clan | null> {
    const doc = await this.clansRef.doc(clanId).get();
    if (!doc.exists) return null;
    
    return { id: doc.id, ...doc.data() } as Clan;
  }

  async updateClan(clanId: string, updates: Partial<Clan>): Promise<void> {
    await this.clansRef.doc(clanId).update(updates);
  }

  async deleteClan(clanId: string): Promise<void> {
    await this.clansRef.doc(clanId).delete();
  }

  async getAllClans(): Promise<Clan[]> {
    const snapshot = await this.clansRef.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Clan));
  }

  async getClansByLeader(leaderId: string): Promise<Clan[]> {
    const snapshot = await this.clansRef.where('leaderId', '==', leaderId).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Clan));
  }

  async getClansByMember(playerId: string): Promise<Clan[]> {
    const snapshot = await this.clansRef.where('roster', 'array-contains', { playerId }).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Clan));
  }

  async getTopClansBySurgePower(limit = 10): Promise<Clan[]> {
    const snapshot = await this.clansRef
      .orderBy('stats.surgePower', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Clan));
  }

  // Roster Management
  async addMember(clanId: string, playerId: string, role: ClanRole = 'member'): Promise<void> {
    const clan = await this.getClan(clanId);
    if (!clan) throw new Error('Clan not found');

    const newMember = {
      playerId,
      role,
      joinedAt: admin.firestore.Timestamp.now(),
      status: {
        online: false,
        activity: 'idle' as ClanActivity
      }
    };

    await this.clansRef.doc(clanId).update({
      roster: admin.firestore.FieldValue.arrayUnion(newMember)
    });
  }

  async removeMember(clanId: string, playerId: string): Promise<void> {
    const clan = await this.getClan(clanId);
    if (!clan) throw new Error('Clan not found');

    const memberToRemove = clan.roster.find(m => m.playerId === playerId);
    if (!memberToRemove) throw new Error('Member not found');

    await this.clansRef.doc(clanId).update({
      roster: admin.firestore.FieldValue.arrayRemove(memberToRemove)
    });
  }

  async updateMemberRole(clanId: string, playerId: string, newRole: ClanRole): Promise<void> {
    const clan = await this.getClan(clanId);
    if (!clan) throw new Error('Clan not found');

    const updatedRoster = clan.roster.map(member => 
      member.playerId === playerId ? { ...member, role: newRole } : member
    );

    await this.clansRef.doc(clanId).update({ roster: updatedRoster });
  }

  async updateMemberStatus(
    clanId: string, 
    playerId: string, 
    status: { online?: boolean; activity?: ClanActivity; platform?: StreamPlatform; streamUrl?: string }
  ): Promise<void> {
    const clan = await this.getClan(clanId);
    if (!clan) throw new Error('Clan not found');

    const updatedRoster = clan.roster.map(member => {
      if (member.playerId === playerId) {
        return {
          ...member,
          status: {
            ...member.status,
            ...status
          }
        };
      }
      return member;
    });

    await this.clansRef.doc(clanId).update({ roster: updatedRoster });
  }

  // Voice Sessions Management
  async addVoiceSession(
    clanId: string,
    sessionId: string,
    type: VoiceSessionType,
    participants: string[] = [],
    linkedEventId?: string
  ): Promise<void> {
    const now = admin.firestore.Timestamp.now();
    const newSession = {
      sessionId,
      type,
      status: 'active' as VoiceSessionStatus,
      participants,
      linkedEventId,
      createdAt: now
    };

    const activeSession = {
      sessionId,
      type,
      participants: participants.length,
      createdAt: now
    };

    await this.clansRef.doc(clanId).update({
      voiceSessions: admin.firestore.FieldValue.arrayUnion(newSession),
      'comms.activeSessions': admin.firestore.FieldValue.arrayUnion(activeSession),
      'comms.lastSessionAt': now
    });
  }

  async updateVoiceSession(
    clanId: string,
    sessionId: string,
    updates: { status?: VoiceSessionStatus; participants?: string[] }
  ): Promise<void> {
    const clan = await this.getClan(clanId);
    if (!clan) throw new Error('Clan not found');

    const updatedSessions = clan.voiceSessions.map(session => {
      if (session.sessionId === sessionId) {
        return { ...session, ...updates };
      }
      return session;
    });

    // Update active sessions in comms if session ended
    let updatedActiveSessions = clan.comms.activeSessions;
    if (updates.status === 'ended') {
      updatedActiveSessions = clan.comms.activeSessions.filter(s => s.sessionId !== sessionId);
    } else if (updates.participants) {
      updatedActiveSessions = clan.comms.activeSessions.map(s => {
        if (s.sessionId === sessionId) {
          return { ...s, participants: updates.participants!.length };
        }
        return s;
      });
    }

    await this.clansRef.doc(clanId).update({ 
      voiceSessions: updatedSessions,
      'comms.activeSessions': updatedActiveSessions
    });
  }

  async removeVoiceSession(clanId: string, sessionId: string): Promise<void> {
    const clan = await this.getClan(clanId);
    if (!clan) throw new Error('Clan not found');

    const sessionToRemove = clan.voiceSessions.find(s => s.sessionId === sessionId);
    if (!sessionToRemove) throw new Error('Voice session not found');

    const activeSessionToRemove = clan.comms.activeSessions.find(s => s.sessionId === sessionId);

    const updates: any = {
      voiceSessions: admin.firestore.FieldValue.arrayRemove(sessionToRemove)
    };

    if (activeSessionToRemove) {
      updates['comms.activeSessions'] = admin.firestore.FieldValue.arrayRemove(activeSessionToRemove);
    }

    await this.clansRef.doc(clanId).update(updates);
  }

  // Stats Management
  async updateStats(clanId: string, stats: Partial<Clan['stats']>): Promise<void> {
    const clan = await this.getClan(clanId);
    if (!clan) throw new Error('Clan not found');

    const updatedStats = { ...clan.stats, ...stats };
    await this.clansRef.doc(clanId).update({ stats: updatedStats });
  }

  async addTrophy(clanId: string, trophy: string): Promise<void> {
    await this.clansRef.doc(clanId).update({
      'stats.trophies': admin.firestore.FieldValue.arrayUnion(trophy)
    });
  }

  async removeTrophy(clanId: string, trophy: string): Promise<void> {
    await this.clansRef.doc(clanId).update({
      'stats.trophies': admin.firestore.FieldValue.arrayRemove(trophy)
    });
  }

  // Clips Management
  async addClip(clanId: string, clipId: string): Promise<void> {
    await this.clansRef.doc(clanId).update({
      clips: admin.firestore.FieldValue.arrayUnion(clipId)
    });
  }

  async removeClip(clanId: string, clipId: string): Promise<void> {
    await this.clansRef.doc(clanId).update({
      clips: admin.firestore.FieldValue.arrayRemove(clipId)
    });
  }

  // Real-time monitoring
  onClanChange(clanId: string, callback: (clan: Clan | null) => void): () => void {
    return this.clansRef.doc(clanId)
      .onSnapshot(doc => {
        const clan = doc.exists ? { id: doc.id, ...doc.data() } as Clan : null;
        callback(clan);
      });
  }

  onClansChange(callback: (clans: Clan[]) => void): () => void {
    return this.clansRef
      .onSnapshot(snapshot => {
        const clans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Clan));
        callback(clans);
      });
  }
}
