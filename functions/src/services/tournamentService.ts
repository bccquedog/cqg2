import * as admin from "firebase-admin";
import {
  Tournament,
  TournamentFilters,
  TournamentMatch,
  TournamentParticipant,
  TournamentTeam,
  TeamMember,
  TeamStats,
  MatchDispute,
  TournamentPrize,
  TournamentSeason,
  TournamentSlots,
  StructuredBracket,
} from "../types/tournament";

export class TournamentService {
  private db: admin.firestore.Firestore;
  private tournamentsRef: admin.firestore.CollectionReference;
  private matchesRef: admin.firestore.CollectionReference;
  private participantsRef: admin.firestore.CollectionReference;
  private teamsRef: admin.firestore.CollectionReference;
  private disputesRef: admin.firestore.CollectionReference;
  private prizesRef: admin.firestore.CollectionReference;
  private seasonsRef: admin.firestore.CollectionReference;

  constructor() {
    this.db = admin.firestore();
    this.tournamentsRef = this.db.collection("tournaments");
    this.matchesRef = this.db.collection("tournamentMatches");
    this.participantsRef = this.db.collection("tournamentParticipants");
    this.teamsRef = this.db.collection("tournamentTeams");
    this.disputesRef = this.db.collection("matchDisputes");
    this.prizesRef = this.db.collection("tournamentPrizes");
    this.seasonsRef = this.db.collection("tournamentSeasons");
  }

  private static readonly allowedStatusTransitions: Record<string, string[]> = {
    draft: ["registration"],
    registration: ["checkin", "archived"],
    checkin: ["live", "archived"],
    live: ["completed", "archived"],
    completed: ["archived"],
    archived: [],
  };

  // Tournament CRUD operations
  async createTournament(tournament: Omit<Tournament, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const now = new Date().toISOString();
    const tournamentData: Omit<Tournament, "id"> = {
      ...tournament,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await this.tournamentsRef.add(tournamentData);
    return docRef.id;
  }

  // Lifecycle: 1) Creation as draft with audit
  async createTournamentDraft(
    adminId: string,
    tournament: Omit<Tournament, "id" | "createdAt" | "updatedAt" | "status" | "audit">
  ): Promise<string> {
    const nowIso = new Date().toISOString();
    const docRef = await this.tournamentsRef.add({
      ...tournament,
      status: "draft",
      createdAt: nowIso,
      updatedAt: nowIso,
      audit: {
        createdBy: adminId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    } as any);
    return docRef.id;
  }

  // Lifecycle: 2) Open registration
  async openRegistration(tournamentId: string): Promise<void> {
    await this.updateTournament(tournamentId, { status: "registration" as any });
  }

  // Lifecycle: 3) Player Sign-Up using slots arrays on tournament doc
  async registerPlayerToSlots(tournamentId: string, playerId: string): Promise<void> {
    const docRef = this.tournamentsRef.doc(tournamentId);
    await this.db.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      if (!snap.exists) throw new Error("Tournament not found");
      const data = snap.data() as Tournament;

      const slots: TournamentSlots = data.slots || {
        registered: [],
        waitlist: [],
        checkedIn: [],
        lateEntries: [],
      };

      const capacity = data.settings?.teamCap ?? data.settings?.maxPlayers ?? 0;
      const isRegistered = slots.registered.includes(playerId) || slots.waitlist.includes(playerId);
      if (isRegistered) return; // idempotent

      if (capacity && slots.registered.length < capacity) {
        tx.update(docRef, {
          "slots.registered": admin.firestore.FieldValue.arrayUnion(playerId),
          updatedAt: new Date().toISOString(),
        } as any);
      } else {
        tx.update(docRef, {
          "slots.waitlist": admin.firestore.FieldValue.arrayUnion(playerId),
          updatedAt: new Date().toISOString(),
        } as any);
      }
    });
  }

  // Lifecycle: 4) Check-In (moves player to checkedIn list)
  async checkInPlayerSlot(tournamentId: string, playerId: string): Promise<void> {
    const docRef = this.tournamentsRef.doc(tournamentId);
    await this.db.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      if (!snap.exists) throw new Error("Tournament not found");
      const data = snap.data() as Tournament;
      const slots: TournamentSlots = data.slots || {
        registered: [],
        waitlist: [],
        checkedIn: [],
        lateEntries: [],
      };

      const updates: any = {
        "slots.checkedIn": admin.firestore.FieldValue.arrayUnion(playerId),
        updatedAt: new Date().toISOString(),
      };
      if (slots.registered.includes(playerId)) {
        updates["slots.registered"] = admin.firestore.FieldValue.arrayRemove(playerId);
      }
      if (slots.waitlist.includes(playerId)) {
        updates["slots.waitlist"] = admin.firestore.FieldValue.arrayRemove(playerId);
      }
      tx.update(docRef, updates);
    });
  }

  // Lifecycle: 5) Generate bracket from checked-in players
  async generateBracket(tournamentId: string): Promise<void> {
    const docRef = this.tournamentsRef.doc(tournamentId);
    await this.db.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      if (!snap.exists) throw new Error("Tournament not found");
      const data = snap.data() as Tournament;
      const players = (data.slots?.checkedIn || []).slice();

      // Seed players
      const method = data.settings?.seeding || "random";
      let seeded = players.slice();
      if (method === "random") {
        seeded.sort(() => Math.random() - 0.5);
      }
      // leaderboard/manual can be implemented externally; take current order

      // Build first round matches (pair up players)
      const roundMatches = [] as {
        matchId: string;
        players: string[];
        status: "pending";
      }[];
      for (let i = 0; i < seeded.length; i += 2) {
        const a = seeded[i];
        const b = seeded[i + 1];
        if (!a || !b) break; // odd number: leave last out for now
        roundMatches.push({ matchId: `${tournamentId}_R1_M${i / 2 + 1}`, players: [a, b], status: "pending" });
      }

      const bracket: StructuredBracket = {
        rounds: [
          {
            roundNumber: 1,
            matches: roundMatches as any,
          },
        ],
      };

      tx.update(docRef, { bracket, updatedAt: new Date().toISOString() } as any);
    });
    await this.updateTournament(tournamentId, { status: "live" as any });
  }

  // Lifecycle: 6) Report a match result inside the structured bracket
  async reportBracketMatch(
    tournamentId: string,
    matchId: string,
    result: { winner: string; loser?: string; score?: Record<string, number>; streamLink?: string; status?: "completed" | "disputed" }
  ): Promise<void> {
    const docRef = this.tournamentsRef.doc(tournamentId);
    await this.db.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      if (!snap.exists) throw new Error("Tournament not found");
      const data = snap.data() as Tournament;
      const bracket = (data.bracket || { rounds: [] }) as StructuredBracket;
      for (const round of bracket.rounds) {
        for (const m of round.matches as any[]) {
          if (m.matchId === matchId) {
            m.winner = result.winner;
            if (result.loser) m.loser = result.loser;
            if (result.score) m.score = result.score;
            if (result.streamLink) m.streamLink = result.streamLink;
            m.status = result.status || "completed";
          }
        }
      }
      tx.update(docRef, { bracket, updatedAt: new Date().toISOString() } as any);
    });
  }

  // Lifecycle: 7) Advance bracket to the next round based on winners
  async advanceBracket(tournamentId: string): Promise<void> {
    const docRef = this.tournamentsRef.doc(tournamentId);
    await this.db.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      if (!snap.exists) throw new Error("Tournament not found");
      const data = snap.data() as Tournament;
      const bracket = (data.bracket || { rounds: [] }) as StructuredBracket;

      if (bracket.rounds.length === 0) return;
      const lastRound = bracket.rounds[bracket.rounds.length - 1];
      const winners: string[] = [];
      for (const m of lastRound.matches as any[]) {
        if (m.winner) winners.push(m.winner);
      }
      if (winners.length < 2) return; // nothing to advance

      const nextMatches: any[] = [];
      for (let i = 0; i < winners.length; i += 2) {
        const a = winners[i];
        const b = winners[i + 1];
        if (!a || !b) break;
        nextMatches.push({ matchId: `${tournamentId}_R${bracket.rounds.length + 1}_M${i / 2 + 1}`, players: [a, b], status: "pending" });
      }
      bracket.rounds.push({ roundNumber: bracket.rounds.length + 1, matches: nextMatches });

      tx.update(docRef, { bracket, updatedAt: new Date().toISOString() } as any);
    });
  }

  // Lifecycle: 8) Completion
  async finalizeTournament(tournamentId: string): Promise<void> {
    await this.updateTournament(tournamentId, { status: "completed" as any });
  }

  async getTournament(id: string): Promise<Tournament | null> {
    const doc = await this.tournamentsRef.doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() } as Tournament;
  }

  async updateTournament(id: string, updates: Partial<Tournament>): Promise<void> {
    // Enforce status transition rules if status is changing
    if (updates.status) {
      const cur = await this.tournamentsRef.doc(id).get();
      if (!cur.exists) throw new Error("Tournament not found");
      const current = cur.data() as Tournament;
      const fromStatus = (current.status as unknown as string) || "draft";
      const toStatus = updates.status as unknown as string;
      const allowed = TournamentService.allowedStatusTransitions[fromStatus] || [];
      if (!allowed.includes(toStatus)) {
        throw new Error(`Invalid status transition: ${fromStatus} → ${toStatus}`);
      }
    }

    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await this.tournamentsRef.doc(id).update(updateData);
  }

  async deleteTournament(id: string): Promise<void> {
    // Delete tournament and all related data
    const batch = this.db.batch();
    
    // Delete tournament
    batch.delete(this.tournamentsRef.doc(id));
    
    // Delete related matches
    const matchesSnap = await this.matchesRef.where("tournamentId", "==", id).get();
    matchesSnap.docs.forEach(doc => batch.delete(doc.ref));
    
    // Delete related participants
    const participantsSnap = await this.participantsRef.where("tournamentId", "==", id).get();
    participantsSnap.docs.forEach(doc => batch.delete(doc.ref));
    
    // Delete related prizes
    const prizesSnap = await this.prizesRef.where("tournamentId", "==", id).get();
    prizesSnap.docs.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();
  }

  async getTournaments(filters?: TournamentFilters): Promise<Tournament[]> {
    let query = this.tournamentsRef;

    if (filters?.status) {
      query = query.where("status", "==", filters.status);
    }
    if (filters?.type) {
      query = query.where("type", "==", filters.type);
    }
    if (filters?.game) {
      query = query.where("game", "==", filters.game);
    }
    if (filters?.seasonId) {
      query = query.where("seasonId", "==", filters.seasonId);
    }
    if (filters?.streamRequired !== undefined) {
      query = query.where("settings.streamRequired", "==", filters.streamRequired);
    }
    if (filters?.disputesAllowed !== undefined) {
      query = query.where("settings.disputesAllowed", "==", filters.disputesAllowed);
    }

    // Order by
    const orderBy = filters?.orderBy || "createdAt";
    const orderDirection = filters?.orderDirection || "desc";
    query = query.orderBy(orderBy, orderDirection);

    // Limit
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament));
  }

  async getTournamentsBySeason(seasonId: string): Promise<Tournament[]> {
    const snapshot = await this.tournamentsRef
      .where("seasonId", "==", seasonId)
      .get();
    
    // Sort by createdAt client-side to avoid composite index requirement
    const tournaments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament));
    return tournaments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getActiveTournaments(): Promise<Tournament[]> {
    const snapshot = await this.tournamentsRef
      .where("status", "==", "live")
      .get();
    
    // Sort by createdAt client-side to avoid composite index requirement
    const tournaments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament));
    return tournaments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getUpcomingTournaments(): Promise<Tournament[]> {
    const snapshot = await this.tournamentsRef
      .where("status", "==", "upcoming")
      .get();
    
    // Sort by createdAt client-side to avoid composite index requirement
    const tournaments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament));
    return tournaments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getCompletedTournaments(): Promise<Tournament[]> {
    const snapshot = await this.tournamentsRef
      .where("status", "==", "completed")
      .get();
    
    // Sort by createdAt client-side to avoid composite index requirement
    const tournaments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament));
    return tournaments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Participant management
  async registerPlayer(
    tournamentId: string, 
    playerId: string, 
    playerData: Partial<TournamentParticipant>
  ): Promise<void> {
    const participantData: TournamentParticipant = {
      id: `${tournamentId}_${playerId}`,
      tournamentId,
      playerId,
      playerName: playerData.playerName || "",
      playerTag: playerData.playerTag || "",
      registeredAt: new Date().toISOString(),
      checkedIn: false,
      eliminated: false,
      ...playerData,
    };

    await this.participantsRef.doc(participantData.id).set(participantData);
    
    // Update tournament participant count
    await this.updateTournament(tournamentId, {
      currentPlayers: admin.firestore.FieldValue.increment(1) as any,
    });
  }

  async unregisterPlayer(tournamentId: string, playerId: string): Promise<void> {
    const participantId = `${tournamentId}_${playerId}`;
    await this.participantsRef.doc(participantId).delete();
    
    // Update tournament participant count
    await this.updateTournament(tournamentId, {
      currentPlayers: admin.firestore.FieldValue.increment(-1) as any,
    });
  }

  async checkInPlayer(tournamentId: string, playerId: string): Promise<void> {
    const participantId = `${tournamentId}_${playerId}`;
    await this.participantsRef.doc(participantId).update({
      checkedIn: true,
      checkedInAt: new Date().toISOString(),
    });
  }

  // Match management
  async createMatch(tournamentId: string, match: Omit<TournamentMatch, "id" | "tournamentId">): Promise<string> {
    const matchData: Omit<TournamentMatch, "id"> = {
      ...match,
      tournamentId,
    };

    const docRef = await this.matchesRef.add(matchData);
    return docRef.id;
  }

  async updateMatch(matchId: string, updates: Partial<TournamentMatch>): Promise<void> {
    await this.matchesRef.doc(matchId).update(updates);
  }

  async getTournamentMatches(tournamentId: string): Promise<TournamentMatch[]> {
    const snapshot = await this.matchesRef
      .where("tournamentId", "==", tournamentId)
      .get();
    
    // Sort by round client-side to avoid composite index requirement
    const matches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TournamentMatch));
    return matches.sort((a, b) => a.round - b.round);
  }

  // Dispute management
  async reportDispute(dispute: Omit<MatchDispute, "id" | "createdAt">): Promise<string> {
    const disputeData: Omit<MatchDispute, "id"> = {
      ...dispute,
      createdAt: new Date().toISOString(),
    };

    const docRef = await this.disputesRef.add(disputeData);
    return docRef.id;
  }

  async resolveDispute(disputeId: string, resolution: string, resolvedBy: string): Promise<void> {
    await this.disputesRef.doc(disputeId).update({
      status: "resolved",
      resolution,
      resolvedBy,
      resolvedAt: new Date().toISOString(),
    });
  }

  async getTournamentDisputes(tournamentId: string): Promise<MatchDispute[]> {
    // Get all matches for the tournament first
    const matches = await this.getTournamentMatches(tournamentId);
    const matchIds = matches.map(match => match.id);
    
    if (matchIds.length === 0) {
      return [];
    }

    // Get disputes for all matches
    const disputes: MatchDispute[] = [];
    for (const matchId of matchIds) {
      const snapshot = await this.disputesRef
        .where("matchId", "==", matchId)
        .get();
      
      disputes.push(...snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MatchDispute)));
    }
    
    return disputes;
  }

  // Prize management
  async setTournamentPrizes(tournamentId: string, prizes: Omit<TournamentPrize, "id" | "tournamentId">[]): Promise<void> {
    const batch = this.db.batch();
    
    // Delete existing prizes
    const existingPrizes = await this.prizesRef.where("tournamentId", "==", tournamentId).get();
    existingPrizes.docs.forEach(doc => batch.delete(doc.ref));
    
    // Add new prizes
    prizes.forEach(prize => {
      const prizeData: Omit<TournamentPrize, "id"> = {
        ...prize,
        tournamentId,
      };
      const docRef = this.prizesRef.doc();
      batch.set(docRef, prizeData);
    });
    
    await batch.commit();
  }

  async getTournamentPrizes(tournamentId: string): Promise<TournamentPrize[]> {
    const snapshot = await this.prizesRef
      .where("tournamentId", "==", tournamentId)
      .get();
    
    // Sort by rank client-side to avoid composite index requirement
    const prizes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TournamentPrize));
    return prizes.sort((a, b) => a.rank - b.rank);
  }

  // Season management
  async createSeason(season: Omit<TournamentSeason, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const now = new Date().toISOString();
    const seasonData: Omit<TournamentSeason, "id"> = {
      ...season,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await this.seasonsRef.add(seasonData);
    return docRef.id;
  }

  async getSeason(id: string): Promise<TournamentSeason | null> {
    const doc = await this.seasonsRef.doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() } as TournamentSeason;
  }

  async getActiveSeason(): Promise<TournamentSeason | null> {
    const snapshot = await this.seasonsRef
      .where("status", "==", "active")
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as TournamentSeason;
  }

  // Utility methods
  async getTournamentStats(tournamentId: string): Promise<{
    totalParticipants: number;
    checkedInParticipants: number;
    totalMatches: number;
    completedMatches: number;
    openDisputes: number;
    totalPrizePool: number;
  }> {
    const [participants, matches, disputes, prizes] = await Promise.all([
      this.participantsRef.where("tournamentId", "==", tournamentId).get(),
      this.matchesRef.where("tournamentId", "==", tournamentId).get(),
      this.getTournamentDisputes(tournamentId),
      this.getTournamentPrizes(tournamentId),
    ]);

    const checkedInParticipants = participants.docs.filter(
      doc => doc.data().checkedIn
    ).length;

    const completedMatches = matches.docs.filter(
      doc => doc.data().status === "completed"
    ).length;

    const openDisputes = disputes.filter(
      dispute => dispute.status === "open" || dispute.status === "under_review"
    ).length;

    const totalPrizePool = prizes.reduce((sum, prize) => sum + prize.amount, 0);

    return {
      totalParticipants: participants.size,
      checkedInParticipants,
      totalMatches: matches.size,
      completedMatches,
      openDisputes,
      totalPrizePool,
    };
  }

  // Team management
  async registerTeam(
    tournamentId: string, 
    team: Omit<TournamentTeam, "id" | "tournamentId" | "registeredAt" | "stats">
  ): Promise<string> {
    const teamData: Omit<TournamentTeam, "id"> = {
      ...team,
      tournamentId,
      registeredAt: new Date().toISOString(),
      stats: {
        wins: 0,
        losses: 0,
        draws: 0,
        pointDiff: 0,
        totalPoints: 0,
        totalPointsAgainst: 0,
        matchesPlayed: 0,
        customStats: {},
      },
    };

    const docRef = await this.teamsRef.add(teamData);
    return docRef.id;
  }

  async unregisterTeam(tournamentId: string, teamId: string): Promise<void> {
    await this.teamsRef.doc(teamId).delete();
    
    // Update tournament team count
    await this.updateTournament(tournamentId, {
      currentPlayers: admin.firestore.FieldValue.increment(-1) as any,
    });
  }

  async checkInTeam(tournamentId: string, teamId: string): Promise<void> {
    await this.teamsRef.doc(teamId).update({
      checkedIn: true,
      checkedInAt: new Date().toISOString(),
    });
  }

  async addTeamMember(tournamentId: string, teamId: string, member: TeamMember): Promise<void> {
    const teamRef = this.teamsRef.doc(teamId);
    await teamRef.update({
      members: admin.firestore.FieldValue.arrayUnion(member),
    });
  }

  async removeTeamMember(tournamentId: string, teamId: string, playerId: string): Promise<void> {
    const teamDoc = await this.teamsRef.doc(teamId).get();
    if (!teamDoc.exists) {
      throw new Error("Team not found");
    }

    const teamData = teamDoc.data() as TournamentTeam;
    const updatedMembers = teamData.members.filter(member => member.playerId !== playerId);
    
    await this.teamsRef.doc(teamId).update({
      members: updatedMembers,
    });
  }

  async updateTeamStats(tournamentId: string, teamId: string, stats: Partial<TeamStats>): Promise<void> {
    const teamRef = this.teamsRef.doc(teamId);
    const teamDoc = await teamRef.get();
    
    if (!teamDoc.exists) {
      throw new Error("Team not found");
    }

    const currentStats = teamDoc.data()?.stats || {};
    const updatedStats = { ...currentStats, ...stats };
    
    await teamRef.update({ stats: updatedStats });
  }

  async getTournamentTeams(tournamentId: string): Promise<TournamentTeam[]> {
    const snapshot = await this.teamsRef
      .where("tournamentId", "==", tournamentId)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TournamentTeam));
  }
}
