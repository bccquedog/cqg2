import { getFirestore } from 'firebase/firestore';
import { connectEmulator, seedTournament, progressRound, findChampion } from './tournamentUtils';
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  try {
    const { db } = await connectEmulator();
    const tournamentId = 'tourney-auto';
    await seedTournament(db, tournamentId, 16);

    // Helper to fetch matches by round
    const fetchMatchesByRound = async (round: number) => {
      const snap = await getDocs(collection(db, `tournaments/${tournamentId}/matches`));
      const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      return all.filter((m) => (m.round || 1) === round);
    };

    // Determine max rounds for 16 players → 4 rounds
    const totalRounds = 4;
    for (let round = 1; round <= totalRounds; round++) {
      console.log(`[auto] Round ${round} started`);
      await progressRound(db, tournamentId, round);

      // Wait for auto-progression to create next round (except final)
      if (round < totalRounds) {
        await sleep(1000);
      }
    }

    const champion = await findChampion(db, tournamentId) || 'Unknown';
    console.log(`🏆 Tournament Winner is ${champion}`);

    console.log('[auto] Auto tournament test completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('[auto] Error during auto tournament test:', err);
    process.exit(1);
  }
}

main();


