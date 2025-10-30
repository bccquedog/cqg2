import * as admin from "firebase-admin";
import { validateTicket } from "./utils/tickets";

// Lazy initialization of Firestore
function getDb() {
  return admin.firestore();
}

export async function submitScore(
  userId: string,
  competitionId: string,
  matchId: string,
  code: string,
  score: number
) {
  // --- Step 1: Validate Ticket ---
  const valid = await validateTicket(code, competitionId);
  if (!valid) throw new Error("🚫 Invalid or expired ticket");

  // --- Step 2: Locate Bracket Doc ---
  const bracketRef = getDb().collection("tournaments").doc(competitionId).collection("bracket").doc("bracketDoc");
  const bracketSnap = await bracketRef.get();
  if (!bracketSnap.exists) throw new Error("🚫 Bracket not found");

  const bracket = bracketSnap.data();
  if (!bracket) {
    throw new Error("🚫 Bracket data not found");
  }

  // --- Step 3: Find Match ---
  let targetMatch: any;
  let roundIndex = -1;
  let matchIndex = -1;

  if (!bracket.rounds) {
    throw new Error("🚫 Bracket rounds not found");
  }

  bracket.rounds.forEach((round: any, rIdx: number) => {
    round.matches.forEach((m: any, mIdx: number) => {
      if (m.matchId === matchId) {
        targetMatch = m;
        roundIndex = rIdx;
        matchIndex = mIdx;
      }
    });
  });

  if (!targetMatch) throw new Error(`🚫 Match ${matchId} not found`);

  // --- Step 4: Save Score ---
  targetMatch.scores[userId] = score;

  // If both scores present, determine winner
  const players = targetMatch.players;
  const [p1, p2] = players;
  const s1 = targetMatch.scores[p1];
  const s2 = targetMatch.scores[p2];

  if (s1 !== null && s2 !== null) {
    if (s1 > s2) targetMatch.winner = p1;
    else if (s2 > s1) targetMatch.winner = p2;
    else targetMatch.winner = null; // tie, could force admin decision
    targetMatch.status = "completed";

    // --- Step 5: Advance Winner ---
    const nextRoundIndex = roundIndex + 1;
    if (bracket.rounds && bracket.rounds[nextRoundIndex]) {
      // Find first open slot in next round
      const nextMatch = bracket.rounds[nextRoundIndex].matches.find((m: any) =>
        m.players.includes(null) || m.players.length < 2
      );
      if (nextMatch) {
        nextMatch.players.push(targetMatch.winner);
        nextMatch.ticketCodes[targetMatch.winner] = code; // carry ticket reference
      }
    }
  } else {
    targetMatch.status = "live";
  }

  // --- Step 6: Update Firestore ---
  if (bracket.rounds && bracket.rounds[roundIndex]) {
    bracket.rounds[roundIndex].matches[matchIndex] = targetMatch;
    await bracketRef.set(bracket);
  }

  console.log(`✅ Score submitted for ${userId} in ${competitionId}, Match ${matchId}`);
  return targetMatch;
}
