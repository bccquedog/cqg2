import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebaseClient";
import { Tournament, League, TournamentPlayer, LeagueTeam, Match } from "@/types/events";
import { getClanById } from "./firestoreClans";
import { isFeatureEnabled } from "./featureToggles";

// ========================
// TOURNAMENT FUNCTIONS
// ========================

/**
 * Creates a new tournament in Firestore
 * @param data - Partial tournament data to create
 * @returns Promise<string> - The created tournament ID
 */
export async function createTournament(data: Omit<Tournament, 'id' | 'createdAt'>): Promise<string> {
  try {
    // Check if clan tournaments are enabled when creating a clan tournament
    if (!(await isFeatureEnabled("clanTournaments")) && data.type === "clan") {
      throw new Error("Clan tournaments are currently disabled by admin.");
    }

    const tournamentData = {
      ...data,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "tournaments"), tournamentData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating tournament:", error);
    throw new Error("Failed to create tournament");
  }
}

/**
 * Updates an existing tournament in Firestore
 * @param id - Tournament ID
 * @param data - Partial tournament data to update
 * @returns Promise<void>
 */
export async function updateTournament(id: string, data: Partial<Omit<Tournament, 'id' | 'createdAt'>>): Promise<void> {
  try {
    // Check if clan tournaments are enabled when updating to clan type
    if (!(await isFeatureEnabled("clanTournaments")) && data.type === "clan") {
      throw new Error("Clan tournaments are currently disabled by admin.");
    }

    const tournamentRef = doc(db, "tournaments", id);
    await updateDoc(tournamentRef, data);
  } catch (error) {
    console.error("Error updating tournament:", error);
    throw new Error("Failed to update tournament");
  }
}

/**
 * Retrieves a tournament from Firestore
 * @param id - Tournament ID
 * @returns Promise<Tournament | null>
 */
export async function getTournament(id: string): Promise<Tournament | null> {
  try {
    const tournamentRef = doc(db, "tournaments", id);
    const tournamentSnap = await getDoc(tournamentRef);

    if (tournamentSnap.exists()) {
      return {
        id: tournamentSnap.id,
        ...tournamentSnap.data(),
        createdAt: tournamentSnap.data().createdAt as Timestamp,
      } as Tournament;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting tournament:", error);
    throw new Error("Failed to get tournament");
  }
}

/**
 * Lists all tournaments from Firestore
 * @returns Promise<Tournament[]>
 */
export async function listTournaments(): Promise<Tournament[]> {
  try {
    const tournamentsRef = collection(db, "tournaments");
    const q = query(tournamentsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const tournaments: Tournament[] = [];
    querySnapshot.forEach((doc) => {
      tournaments.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt as Timestamp,
      } as Tournament);
    });
    
    return tournaments;
  } catch (error) {
    console.error("Error listing tournaments:", error);
    throw new Error("Failed to list tournaments");
  }
}

/**
 * Registers a player in a solo tournament
 * @param tournamentId - Tournament ID
 * @param playerId - Player ID to register
 * @returns Promise<void>
 */
export async function registerPlayerInTournament(tournamentId: string, playerId: string): Promise<void> {
  try {
    const tournament = await getTournament(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    if (tournament.type !== "solo") {
      throw new Error("Cannot register individual player in non-solo tournament");
    }

    if (tournament.participants.includes(playerId)) {
      throw new Error("Player already registered in tournament");
    }

    const updatedParticipants = [...tournament.participants, playerId];
    await updateTournament(tournamentId, { participants: updatedParticipants });
  } catch (error) {
    console.error("Error registering player in tournament:", error);
    throw new Error("Failed to register player in tournament");
  }
}

/**
 * Registers a clan in a clan tournament
 * @param tournamentId - Tournament ID
 * @param clanId - Clan ID to register
 * @returns Promise<void>
 */
export async function registerClanInTournament(tournamentId: string, clanId: string): Promise<void> {
  try {
    const tournament = await getTournament(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    if (tournament.type !== "clan") {
      throw new Error("Cannot register clan in non-clan tournament");
    }

    // Verify clan exists
    const clan = await getClanById(clanId);
    if (!clan) {
      throw new Error("Clan not found");
    }

    if (tournament.participants.includes(clanId)) {
      throw new Error("Clan already registered in tournament");
    }

    const updatedParticipants = [...tournament.participants, clanId];
    await updateTournament(tournamentId, { participants: updatedParticipants });
  } catch (error) {
    console.error("Error registering clan in tournament:", error);
    throw new Error("Failed to register clan in tournament");
  }
}

/**
 * Removes a participant from a tournament
 * @param tournamentId - Tournament ID
 * @param participantId - Participant ID to remove
 * @returns Promise<void>
 */
export async function removeParticipantFromTournament(tournamentId: string, participantId: string): Promise<void> {
  try {
    const tournament = await getTournament(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    if (!tournament.participants.includes(participantId)) {
      throw new Error("Participant not found in tournament");
    }

    const updatedParticipants = tournament.participants.filter(id => id !== participantId);
    await updateTournament(tournamentId, { participants: updatedParticipants });
  } catch (error) {
    console.error("Error removing participant from tournament:", error);
    throw new Error("Failed to remove participant from tournament");
  }
}

/**
 * Updates tournament bracket
 * @param tournamentId - Tournament ID
 * @param bracket - Updated bracket structure
 * @returns Promise<void>
 */
export async function updateTournamentBracket(tournamentId: string, bracket: Record<string, unknown>): Promise<void> {
  try {
    const tournament = await getTournament(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    await updateTournament(tournamentId, { bracket });
  } catch (error) {
    console.error("Error updating tournament bracket:", error);
    throw new Error("Failed to update tournament bracket");
  }
}

/**
 * Deletes a tournament from Firestore
 * @param id - Tournament ID
 * @returns Promise<void>
 */
export async function deleteTournament(id: string): Promise<void> {
  try {
    const tournamentRef = doc(db, "tournaments", id);
    await deleteDoc(tournamentRef);
  } catch (error) {
    console.error("Error deleting tournament:", error);
    throw new Error("Failed to delete tournament");
  }
}

// ========================
// LEAGUE FUNCTIONS
// ========================

/**
 * Creates a new league in Firestore
 * @param data - League data to create
 * @returns Promise<string> - The created league ID
 */
export async function createLeague(data: Omit<League, 'id' | 'createdAt'>): Promise<string> {
  try {
    const leagueData = {
      ...data,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "leagues"), leagueData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating league:", error);
    throw new Error("Failed to create league");
  }
}

/**
 * Updates an existing league in Firestore
 * @param id - League ID
 * @param data - Partial league data to update
 * @returns Promise<void>
 */
export async function updateLeague(id: string, data: Partial<Omit<League, 'id' | 'createdAt'>>): Promise<void> {
  try {
    const leagueRef = doc(db, "leagues", id);
    await updateDoc(leagueRef, data);
  } catch (error) {
    console.error("Error updating league:", error);
    throw new Error("Failed to update league");
  }
}

/**
 * Retrieves a league from Firestore
 * @param id - League ID
 * @returns Promise<League | null>
 */
export async function getLeague(id: string): Promise<League | null> {
  try {
    const leagueRef = doc(db, "leagues", id);
    const leagueSnap = await getDoc(leagueRef);

    if (leagueSnap.exists()) {
      return {
        id: leagueSnap.id,
        ...leagueSnap.data(),
        createdAt: leagueSnap.data().createdAt as Timestamp,
      } as League;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting league:", error);
    throw new Error("Failed to get league");
  }
}

/**
 * Lists all leagues from Firestore
 * @returns Promise<League[]>
 */
export async function listLeagues(): Promise<League[]> {
  try {
    const leaguesRef = collection(db, "leagues");
    const q = query(leaguesRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const leagues: League[] = [];
    querySnapshot.forEach((doc) => {
      leagues.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt as Timestamp,
      } as League);
    });
    
    return leagues;
  } catch (error) {
    console.error("Error listing leagues:", error);
    throw new Error("Failed to list leagues");
  }
}

/**
 * Registers a player in a solo league
 * @param leagueId - League ID
 * @param playerId - Player ID to register
 * @returns Promise<void>
 */
export async function registerPlayerInLeague(leagueId: string, playerId: string): Promise<void> {
  try {
    const league = await getLeague(leagueId);
    if (!league) {
      throw new Error("League not found");
    }

    if (league.type !== "solo") {
      throw new Error("Cannot register individual player in non-solo league");
    }

    if (league.participants.includes(playerId)) {
      throw new Error("Player already registered in league");
    }

    const updatedParticipants = [...league.participants, playerId];
    await updateLeague(leagueId, { participants: updatedParticipants });
  } catch (error) {
    console.error("Error registering player in league:", error);
    throw new Error("Failed to register player in league");
  }
}

/**
 * Registers a clan in a clan league
 * @param leagueId - League ID
 * @param clanId - Clan ID to register
 * @returns Promise<void>
 */
export async function registerClanInLeague(leagueId: string, clanId: string): Promise<void> {
  try {
    const league = await getLeague(leagueId);
    if (!league) {
      throw new Error("League not found");
    }

    if (league.type !== "clan") {
      throw new Error("Cannot register clan in non-clan league");
    }

    // Verify clan exists
    const clan = await getClanById(clanId);
    if (!clan) {
      throw new Error("Clan not found");
    }

    if (league.participants.includes(clanId)) {
      throw new Error("Clan already registered in league");
    }

    const updatedParticipants = [...league.participants, clanId];
    await updateLeague(leagueId, { participants: updatedParticipants });
  } catch (error) {
    console.error("Error registering clan in league:", error);
    throw new Error("Failed to register clan in league");
  }
}

/**
 * Removes a participant from a league
 * @param leagueId - League ID
 * @param participantId - Participant ID to remove
 * @returns Promise<void>
 */
export async function removeParticipantFromLeague(leagueId: string, participantId: string): Promise<void> {
  try {
    const league = await getLeague(leagueId);
    if (!league) {
      throw new Error("League not found");
    }

    if (!league.participants.includes(participantId)) {
      throw new Error("Participant not found in league");
    }

    const updatedParticipants = league.participants.filter(id => id !== participantId);
    await updateLeague(leagueId, { participants: updatedParticipants });
  } catch (error) {
    console.error("Error removing participant from league:", error);
    throw new Error("Failed to remove participant from league");
  }
}

/**
 * Updates league stats
 * @param leagueId - League ID
 * @param stats - Updated stats
 * @returns Promise<void>
 */
export async function updateLeagueStats(leagueId: string, stats: Partial<League['stats']>): Promise<void> {
  try {
    const league = await getLeague(leagueId);
    if (!league) {
      throw new Error("League not found");
    }

    const updatedStats = {
      ...league.stats,
      ...stats,
    };

    await updateLeague(leagueId, { stats: updatedStats });
  } catch (error) {
    console.error("Error updating league stats:", error);
    throw new Error("Failed to update league stats");
  }
}

/**
 * Deletes a league from Firestore
 * @param id - League ID
 * @returns Promise<void>
 */
export async function deleteLeague(id: string): Promise<void> {
  try {
    const leagueRef = doc(db, "leagues", id);
    await deleteDoc(leagueRef);
  } catch (error) {
    console.error("Error deleting league:", error);
    throw new Error("Failed to delete league");
  }
}

// ========================
// MATCH FUNCTIONS
// ========================

/**
 * Submits a match result to a tournament
 * @param tournamentId - Tournament ID
 * @param matchId - Unique match identifier
 * @param data - Match result data
 * @returns Promise<void>
 */
export async function submitMatchResult(
  tournamentId: string, 
  matchId: string, 
  data: { 
    round?: number;
    scores: { [userId: string]: number }; 
    winner: string; 
    streamUrl?: string;
  }
): Promise<void> {
  try {
    const tournament = await getTournament(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Check if match already exists in bracket
    const bracket = tournament.bracket as Record<string, unknown> || {};
    const existingMatches = (bracket.matches as Record<string, unknown>[]) || [];
    const matchExists = existingMatches.some((match: Record<string, unknown>) => match.id === matchId);
    if (matchExists) {
      throw new Error("Match already exists");
    }

    // Validate that winner is in players
    const players = Object.keys(data.scores);
    if (!players.includes(data.winner)) {
      throw new Error("Winner must be one of the players");
    }

    // Create new match
    const newMatch: Match = {
      id: matchId,
      tournamentId,
      round: data.round || 1,
      players,
      scores: data.scores,
      winner: data.winner,
      streamUrl: data.streamUrl || undefined,
      submittedAt: Date.now(),
      verified: false,
    };

    const updatedMatches = [...existingMatches, newMatch];
    const updatedBracket = { ...bracket, matches: updatedMatches };
    await updateTournament(tournamentId, { bracket: updatedBracket });
  } catch (error) {
    console.error("Error submitting match result:", error);
    throw new Error("Failed to submit match result");
  }
}

/**
 * Verifies a match result in a tournament
 * @param tournamentId - Tournament ID
 * @param matchId - Match ID to verify
 * @returns Promise<void>
 */
export async function verifyMatchResult(tournamentId: string, matchId: string): Promise<void> {
  try {
    const tournament = await getTournament(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    const bracket = tournament.bracket as Record<string, unknown> || {};
    const matches = (bracket.matches as Record<string, unknown>[]) || [];
    const matchIndex = matches.findIndex((match: Record<string, unknown>) => match.id === matchId);
    
    if (matchIndex === -1) {
      throw new Error("Match not found");
    }

    // Update the match verification status
    const updatedMatches = [...matches];
    updatedMatches[matchIndex] = {
      ...updatedMatches[matchIndex],
      verified: true,
    };

    const updatedBracket = { ...bracket, matches: updatedMatches };
    await updateTournament(tournamentId, { bracket: updatedBracket });
  } catch (error) {
    console.error("Error verifying match result:", error);
    throw new Error("Failed to verify match result");
  }
}

/**
 * Gets all matches for a tournament
 * @param tournamentId - Tournament ID
 * @returns Promise<Match[]>
 */
export async function getTournamentMatches(tournamentId: string): Promise<Match[]> {
  try {
    const tournament = await getTournament(tournamentId);
    const bracket = tournament?.bracket as Record<string, unknown> || {};
    return (bracket.matches as Match[]) || [];
  } catch (error) {
    console.error("Error getting tournament matches:", error);
    throw new Error("Failed to get tournament matches");
  }
}

/**
 * Removes a match from a tournament
 * @param tournamentId - Tournament ID
 * @param matchId - Match ID to remove
 * @returns Promise<void>
 */
export async function removeMatchResult(tournamentId: string, matchId: string): Promise<void> {
  try {
    const tournament = await getTournament(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    const bracket = tournament.bracket as Record<string, unknown> || {};
    const matches = (bracket.matches as Record<string, unknown>[]) || [];
    const updatedMatches = matches.filter((match: Record<string, unknown>) => match.id !== matchId);
    
    const updatedBracket = { ...bracket, matches: updatedMatches };
    await updateTournament(tournamentId, { bracket: updatedBracket });
  } catch (error) {
    console.error("Error removing match result:", error);
    throw new Error("Failed to remove match result");
  }
}

// ========================
// DISPUTE MANAGEMENT FUNCTIONS
// ========================

/**
 * Disputes a match result in a tournament
 * @param tournamentId - Tournament ID
 * @param matchId - Match ID to dispute
 * @param reason - Reason for the dispute
 * @returns Promise<void>
 */
export async function disputeMatch(
  tournamentId: string,
  matchId: string,
  reason: string
): Promise<void> {
  try {
    const tournament = await getTournament(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    const bracket = tournament.bracket as Record<string, unknown> || {};
    const matches = (bracket.matches as Record<string, unknown>[]) || [];
    const matchIndex = matches.findIndex((match: Record<string, unknown>) => match.id === matchId);
    
    if (matchIndex === -1) {
      throw new Error("Match not found");
    }

    // Update the match dispute status
    const updatedMatches = [...matches];
    updatedMatches[matchIndex] = {
      ...updatedMatches[matchIndex],
      disputed: true,
      disputeReason: reason,
      resolved: false,
      resolvedBy: undefined,
      resolutionNotes: undefined,
    };

    const updatedBracket = { ...bracket, matches: updatedMatches };
    await updateTournament(tournamentId, { bracket: updatedBracket });
  } catch (error) {
    console.error("Error disputing match result:", error);
    throw new Error("Failed to dispute match result");
  }
}

/**
 * Resolves a disputed match in a tournament
 * @param tournamentId - Tournament ID
 * @param matchId - Match ID to resolve
 * @param adminId - ID of the admin resolving the dispute
 * @param notes - Resolution notes from the admin
 * @returns Promise<void>
 */
export async function resolveDispute(
  tournamentId: string,
  matchId: string,
  adminId: string,
  notes: string
): Promise<void> {
  try {
    const tournament = await getTournament(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    const bracket = tournament.bracket as Record<string, unknown> || {};
    const matches = (bracket.matches as Record<string, unknown>[]) || [];
    const matchIndex = matches.findIndex((match: Record<string, unknown>) => match.id === matchId);
    
    if (matchIndex === -1) {
      throw new Error("Match not found");
    }

    const match = matches[matchIndex];
    if (!match.disputed) {
      throw new Error("Match is not disputed");
    }

    // Update the match dispute resolution status
    const updatedMatches = [...matches];
    updatedMatches[matchIndex] = {
      ...updatedMatches[matchIndex],
      disputed: false,
      resolved: true,
      resolvedBy: adminId,
      resolutionNotes: notes,
    };

    const updatedBracket = { ...bracket, matches: updatedMatches };
    await updateTournament(tournamentId, { bracket: updatedBracket });
  } catch (error) {
    console.error("Error resolving match dispute:", error);
    throw new Error("Failed to resolve match dispute");
  }
}
