import { 
  doc, 
  getDoc, 
  setDoc, 
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { validateTicket } from "./tickets";

export interface SubmitScoreResult {
  matchId: string;
  scores: Record<string, number>;
  winner?: string;
  status: "live" | "completed";
  roundIndex: number;
  matchIndex: number;
}

export interface SubmitScoreParams {
  userId: string;
  competitionId: string;
  matchId: string;
  code: string;
  score: number;
}

/**
 * Submits a score for a match with ticket validation
 * @param userId - The user submitting the score
 * @param competitionId - The competition ID
 * @param matchId - The match ID
 * @param code - The ticket code for validation
 * @param score - The score to submit
 * @returns Promise<SubmitScoreResult>
 */
export async function submitScore(
  userId: string,
  competitionId: string,
  matchId: string,
  code: string,
  score: number
): Promise<SubmitScoreResult> {
  try {
    // --- Step 1: Validate Ticket ---
    const valid = await validateTicket(code, competitionId);
    if (!valid) {
      throw new Error("🚫 Invalid or expired ticket");
    }

    // --- Step 2: Locate Bracket Doc ---
    const bracketRef = doc(db, "tournaments", competitionId, "bracket", "bracketDoc");
    const bracketSnap = await getDoc(bracketRef);
    
    if (!bracketSnap.exists()) {
      throw new Error("🚫 Bracket not found");
    }

    const bracket = bracketSnap.data();
    if (!bracket) {
      throw new Error("🚫 Bracket data not found");
    }

    // --- Step 3: Find Match ---
    let targetMatch: any;
    let roundIndex = -1;
    let matchIndex = -1;

    if (!bracket.rounds || !Array.isArray(bracket.rounds)) {
      throw new Error("🚫 Bracket rounds not found");
    }

    // Search through rounds to find the match
    for (let rIdx = 0; rIdx < bracket.rounds.length; rIdx++) {
      const round = bracket.rounds[rIdx];
      if (!round.matches || !Array.isArray(round.matches)) {
        continue;
      }
      
      for (let mIdx = 0; mIdx < round.matches.length; mIdx++) {
        const match = round.matches[mIdx] as { matchId: string; [key: string]: unknown };
        if (match.matchId === matchId) {
          targetMatch = match;
          roundIndex = rIdx;
          matchIndex = mIdx;
          break;
        }
      }
      
      if (targetMatch) break;
    }

    if (!targetMatch) {
      throw new Error(`🚫 Match ${matchId} not found`);
    }

    // --- Step 4: Check if user is in this match ---
    if (!targetMatch.players || !targetMatch.players.includes(userId)) {
      throw new Error("🚫 User is not a participant in this match");
    }

    // --- Step 5: Check if score already submitted ---
    if (targetMatch.scores && targetMatch.scores[userId] !== undefined) {
      throw new Error("🚫 Score already submitted for this match");
    }

    // --- Step 6: Save Score ---
    if (!targetMatch.scores) {
      targetMatch.scores = {};
    }
    
    targetMatch.scores[userId] = score;
    targetMatch.lastUpdated = serverTimestamp();

    // --- Step 7: Determine Winner if both scores present ---
    const players = targetMatch.players;
    const [p1, p2] = players;
    const s1 = targetMatch.scores[p1];
    const s2 = targetMatch.scores[p2];

    if (s1 !== null && s1 !== undefined && s2 !== null && s2 !== undefined) {
      // Both scores submitted
      if (s1 > s2) {
        targetMatch.winner = p1;
      } else if (s2 > s1) {
        targetMatch.winner = p2;
      } else {
        targetMatch.winner = null; // tie, could force admin decision
      }
      targetMatch.status = "completed";
      targetMatch.completedAt = serverTimestamp();

      // --- Step 8: Advance Winner to Next Round ---
      const nextRoundIndex = roundIndex + 1;
      if (bracket.rounds && bracket.rounds[nextRoundIndex]) {
        // Find first open slot in next round
        const nextRound = bracket.rounds[nextRoundIndex];
        if (nextRound.matches && Array.isArray(nextRound.matches)) {
          const nextMatch = nextRound.matches.find((m: { players: unknown[]; [key: string]: unknown }) =>
            m.players.includes(null) || m.players.length < 2
          );
          
          if (nextMatch && targetMatch.winner) {
            // Add winner to next match
            const emptySlotIndex = nextMatch.players.findIndex((p: unknown) => p === null);
            if (emptySlotIndex !== -1) {
              nextMatch.players[emptySlotIndex] = targetMatch.winner;
            } else if (nextMatch.players.length < 2) {
              nextMatch.players.push(targetMatch.winner);
            }
            
            // Carry ticket reference
            if (!nextMatch.ticketCodes) {
              nextMatch.ticketCodes = {};
            }
            nextMatch.ticketCodes[targetMatch.winner] = code;
          }
        }
      }
    } else {
      // Only one score submitted so far
      targetMatch.status = "live";
    }

    // --- Step 9: Update Firestore ---
    if (bracket.rounds && bracket.rounds[roundIndex]) {
      bracket.rounds[roundIndex].matches[matchIndex] = targetMatch;
      bracket.lastUpdated = serverTimestamp();
      
      await setDoc(bracketRef, bracket, { merge: true });
    }

    console.log(`✅ Score submitted for ${userId} in ${competitionId}, Match ${matchId}`);

    return {
      matchId: targetMatch.matchId,
      scores: targetMatch.scores,
      winner: targetMatch.winner,
      status: targetMatch.status,
      roundIndex,
      matchIndex
    };

  } catch (error) {
    console.error("Error submitting score:", error);
    throw error;
  }
}

/**
 * Validates a ticket code for a competition
 * @param code - The ticket code to validate
 * @param competitionId - The competition ID
 * @returns Promise<boolean>
 */
async function validateTicket(code: string, competitionId: string): Promise<boolean> {
  try {
    // Search for the ticket in the tickets collection
    const ticketsRef = collection(db, "tickets");
    const q = query(
      ticketsRef,
      where("code", "==", code),
      where("competitionId", "==", competitionId),
      where("valid", "==", true)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return false;
    }

    const ticketDoc = querySnapshot.docs[0];
    const ticketData = ticketDoc.data();

    // Check if ticket is expired
    if (ticketData.expiresAt) {
      const expiresAt = ticketData.expiresAt.toDate();
      if (expiresAt < new Date()) {
        // Mark ticket as invalid
        await updateDoc(ticketDoc.ref, { valid: false });
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error validating ticket:", error);
    return false;
  }
}

/**
 * Gets match details by ID
 * @param competitionId - The competition ID
 * @param matchId - The match ID
 * @returns Promise<any>
 */
export async function getMatchDetails(competitionId: string, matchId: string): Promise<{ matchId: string; [key: string]: unknown } | null> {
  try {
    const bracketRef = doc(db, "tournaments", competitionId, "bracket", "bracketDoc");
    const bracketSnap = await getDoc(bracketRef);
    
    if (!bracketSnap.exists()) {
      throw new Error("Bracket not found");
    }

    const bracket = bracketSnap.data();
    if (!bracket || !bracket.rounds) {
      throw new Error("Bracket data not found");
    }

    // Search for the match
    for (const round of bracket.rounds) {
      if (round.matches) {
        for (const match of round.matches) {
          if (match.matchId === matchId) {
            return match;
          }
        }
      }
    }

    throw new Error("Match not found");
  } catch (error) {
    console.error("Error getting match details:", error);
    throw error;
  }
}

/**
 * Gets all matches for a competition
 * @param competitionId - The competition ID
 * @returns Promise<any[]>
 */
export async function getAllMatches(competitionId: string): Promise<{ matchId: string; [key: string]: unknown }[]> {
  try {
    const bracketRef = doc(db, "tournaments", competitionId, "bracket", "bracketDoc");
    const bracketSnap = await getDoc(bracketRef);
    
    if (!bracketSnap.exists()) {
      throw new Error("Bracket not found");
    }

    const bracket = bracketSnap.data();
    if (!bracket || !bracket.rounds) {
      return [];
    }

    const allMatches: { matchId: string; [key: string]: unknown }[] = [];
    
    for (const round of bracket.rounds) {
      if (round.matches) {
        allMatches.push(...round.matches);
      }
    }

    return allMatches;
  } catch (error) {
    console.error("Error getting all matches:", error);
    throw error;
  }
}
