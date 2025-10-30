import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export async function advanceWinner(
  tournamentId: string,
  matchId: string,
  winner: { id: string; name: string }
) {
  const [round, matchNum] = matchId.split("-M").map((s) => s.replace("R", ""));
  const roundNum = parseInt(round);
  const matchIndex = parseInt(matchNum);

  let nextRound = roundNum + 1;
  let nextMatchIndex = Math.ceil(matchIndex / 2);
  let slot = matchIndex % 2 === 1 ? "playerA" : "playerB";

  const nextMatchId = `R${nextRound}-M${nextMatchIndex}`;
  const nextMatchRef = doc(db, `tournaments/${tournamentId}/matches/${nextMatchId}`);

  try {
    await updateDoc(nextMatchRef, {
      [slot]: winner,
    });
    console.log(`✅ Advanced winner ${winner.name} to ${nextMatchId} (${slot})`);
  } catch (err) {
    console.error("❌ Error advancing winner:", err);
  }
}


