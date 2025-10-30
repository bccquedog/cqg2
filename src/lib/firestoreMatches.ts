import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  Timestamp 
} from "firebase/firestore";
import { db } from "./firebaseClient";
import { NewMatch, MatchTeam } from "@/types/events";

const MATCHES_COLLECTION = "matches";

/**
 * Create a new match in Firestore
 * @param data - Match data (id will be auto-generated)
 * @returns Promise<string> - The created match ID
 */
export async function createMatch(data: Omit<NewMatch, 'id' | 'createdAt'>): Promise<string> {
  try {
    const matchData = {
      ...data,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, MATCHES_COLLECTION), matchData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating match:", error);
    throw new Error("Failed to create match");
  }
}

/**
 * Get a match by ID
 * @param id - Match ID
 * @returns Promise<NewMatch | null>
 */
export async function getMatch(id: string): Promise<NewMatch | null> {
  try {
    const matchRef = doc(db, MATCHES_COLLECTION, id);
    const matchSnap = await getDoc(matchRef);

    if (matchSnap.exists()) {
      const data = matchSnap.data();
      return {
        id: matchSnap.id,
        format: data.format,
        teams: data.teams,
        winnerTeamId: data.winnerTeamId,
        streamLink: data.streamLink,
        createdAt: data.createdAt as Timestamp,
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting match:", error);
    throw new Error("Failed to get match");
  }
}

/**
 * Get all matches
 * @returns Promise<NewMatch[]>
 */
export async function getAllMatches(): Promise<NewMatch[]> {
  try {
    const matchesRef = collection(db, MATCHES_COLLECTION);
    const matchesSnap = await getDocs(matchesRef);

    const matches: NewMatch[] = [];
    matchesSnap.forEach((doc) => {
      const data = doc.data();
      matches.push({
        id: doc.id,
        format: data.format,
        teams: data.teams,
        winnerTeamId: data.winnerTeamId,
        streamLink: data.streamLink,
        createdAt: data.createdAt as Timestamp,
      });
    });

    return matches;
  } catch (error) {
    console.error("Error getting all matches:", error);
    throw new Error("Failed to get matches");
  }
}

/**
 * Update a match
 * @param id - Match ID
 * @param data - Partial match data to update
 * @returns Promise<void>
 */
export async function updateMatch(id: string, data: Partial<Omit<NewMatch, 'id' | 'createdAt'>>): Promise<void> {
  try {
    const matchRef = doc(db, MATCHES_COLLECTION, id);
    await updateDoc(matchRef, data);
  } catch (error) {
    console.error("Error updating match:", error);
    throw new Error("Failed to update match");
  }
}

/**
 * Delete a match
 * @param id - Match ID
 * @returns Promise<void>
 */
export async function deleteMatch(id: string): Promise<void> {
  try {
    const matchRef = doc(db, MATCHES_COLLECTION, id);
    await deleteDoc(matchRef);
  } catch (error) {
    console.error("Error deleting match:", error);
    throw new Error("Failed to delete match");
  }
}

/**
 * Get matches by format
 * @param format - Match format ("1v1" | "2v2" | "5v5")
 * @returns Promise<NewMatch[]>
 */
export async function getMatchesByFormat(format: "1v1" | "2v2" | "5v5"): Promise<NewMatch[]> {
  try {
    const matches = await getAllMatches();
    return matches.filter(match => match.format === format);
  } catch (error) {
    console.error("Error getting matches by format:", error);
    throw new Error("Failed to get matches by format");
  }
}

/**
 * Get matches by team ID
 * @param teamId - Team ID
 * @returns Promise<NewMatch[]>
 */
export async function getMatchesByTeam(teamId: string): Promise<NewMatch[]> {
  try {
    const matches = await getAllMatches();
    return matches.filter(match => 
      match.teams.some(team => team.teamId === teamId)
    );
  } catch (error) {
    console.error("Error getting matches by team:", error);
    throw new Error("Failed to get matches by team");
  }
}

/**
 * Get matches by clan ID
 * @param clanId - Clan ID
 * @returns Promise<NewMatch[]>
 */
export async function getMatchesByClan(clanId: string): Promise<NewMatch[]> {
  try {
    const matches = await getAllMatches();
    return matches.filter(match => 
      match.teams.some(team => team.clanId === clanId)
    );
  } catch (error) {
    console.error("Error getting matches by clan:", error);
    throw new Error("Failed to get matches by clan");
  }
}


