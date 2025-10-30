import { db } from "@/lib/firebase";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";

export async function seedFullTournament() {
  try {
    // 1. Create tournament doc
    const tournamentRef = doc(collection(db, "tournaments"));
    const tournamentId = tournamentRef.id;

    // 2. Generate 16 players
    const players = Array.from({ length: 16 }, (_, i) => ({
      id: `P${i + 1}`,
      name: `Player ${i + 1}`,
    }));

    await setDoc(tournamentRef, {
      name: "CQG 16 Player Test Tournament",
      game: "Call of Duty",
      type: "single-elimination",
      status: "upcoming",
      players,
      createdAt: serverTimestamp(),
    });

    // 3. Create Round 1 matches (8 matches)
    const matchesCol = collection(tournamentRef, "matches");

    for (let i = 0; i < 16; i += 2) {
      const matchRef = doc(matchesCol, `R1-M${i / 2 + 1}`);
      await setDoc(matchRef, {
        round: 1,
        playerA: players[i],
        playerB: players[i + 1],
        scoreA: 0,
        scoreB: 0,
        winner: null,
        locked: false,
        createdAt: serverTimestamp(),
      });
    }

    console.log("✅ 16-player tournament seeded with Round 1 matches!");
  } catch (err) {
    console.error("❌ Error seeding full tournament:", err);
  }
}


