import { db } from "@/lib/firebase";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";

export async function seedTournamentDay() {
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
      name: "CQG Tournament Day Test",
      game: "Call of Duty",
      type: "single-elimination",
      status: "upcoming",
      players,
      createdAt: serverTimestamp(),
    });

    const matchesCol = collection(tournamentRef, "matches");

    // Helper to create a match
    const createMatch = async (id: string, round: number, playerA: any, playerB: any) => {
      await setDoc(doc(matchesCol, id), {
        round,
        playerA,
        playerB,
        scoreA: 0,
        scoreB: 0,
        winner: null,
        locked: false,
        createdAt: serverTimestamp(),
      });
    };

    // 3. Round 1 (16 → 8)
    for (let i = 0; i < 16; i += 2) {
      await createMatch(
        `R1-M${i / 2 + 1}`,
        1,
        players[i],
        players[i + 1]
      );
    }

    // 4. Quarterfinals (TBD placeholders)
    for (let i = 0; i < 8; i += 2) {
      await createMatch(
        `R2-M${i / 2 + 1}`,
        2,
        { id: null, name: "TBD" },
        { id: null, name: "TBD" }
      );
    }

    // 5. Semifinals
    for (let i = 0; i < 4; i += 2) {
      await createMatch(
        `R3-M${i / 2 + 1}`,
        3,
        { id: null, name: "TBD" },
        { id: null, name: "TBD" }
      );
    }

    // 6. Final
    await createMatch(
      `R4-M1`,
      4,
      { id: null, name: "TBD" },
      { id: null, name: "TBD" }
    );

    console.log("✅ Tournament Day kit seeded with full bracket!");
  } catch (err) {
    console.error("❌ Error seeding tournament:", err);
  }
}


