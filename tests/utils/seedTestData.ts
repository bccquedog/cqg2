import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';

// Basic Firebase client config (dummy, only used with emulator)
const firebaseConfig = {
  apiKey: 'fake-api-key',
  authDomain: 'localhost',
  projectId: 'demo-cqg',
};

async function clearCollection(db: ReturnType<typeof getFirestore>, path: string) {
  const snap = await getDocs(collection(db, path));
  for (const d of snap.docs) {
    // If tournaments, also clear matches subcollection
    if (path === 'tournaments') {
      const matchesSnap = await getDocs(collection(db, `tournaments/${d.id}/matches`));
      for (const m of matchesSnap.docs) {
        await deleteDoc(m.ref);
      }
    }
    await deleteDoc(d.ref);
  }
}

export async function seedTestData() {
  try {
    // Ensure emulator env var is set
    if (!process.env.FIRESTORE_EMULATOR_HOST) {
      process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8085';
      console.log(`[seed] FIRESTORE_EMULATOR_HOST not set, defaulting to ${process.env.FIRESTORE_EMULATOR_HOST}`);
    }

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Connect to emulator
    connectFirestoreEmulator(db, '127.0.0.1', 8085);
    console.log('[seed] Connected to Firestore emulator on 8085');

    // Clear existing test data
    console.log('[seed] Clearing collections: players, tournaments');
    await clearCollection(db, 'players');
    await clearCollection(db, 'tournaments');

    // Seed players
    const players = [
      { id: 'player1', name: 'Alpha', seed: 1, status: 'online' },
      { id: 'player2', name: 'Bravo', seed: 2, status: 'idle' },
      { id: 'player3', name: 'Charlie', seed: 3, status: 'online' },
      { id: 'player4', name: 'Delta', seed: 4, status: 'offline' },
    ];

    console.log('[seed] Creating players...');
    for (const p of players) {
      await setDoc(doc(db, 'players', p.id), {
        name: p.name,
        seed: p.seed,
        status: p.status,
        tier: 'bronze',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Seed one tournament
    const tournamentId = 'tourney-e2e';
    console.log('[seed] Creating tournament:', tournamentId);
    await setDoc(doc(db, 'tournaments', tournamentId), {
      name: 'E2E Test Cup',
      game: 'Test Game',
      status: 'live',
      players: players.map(p => p.id),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      settings: { format: 'single_elimination' },
    });

    // Seed one default match (pending)
    console.log('[seed] Creating one default match in tournament');
    const matchRef = doc(collection(db, `tournaments/${tournamentId}/matches`));
    await setDoc(matchRef, {
      id: matchRef.id,
      playerA: players[0].id,
      playerB: players[1].id,
      round: 1,
      status: 'pending',
      scoreA: 0,
      scoreB: 0,
      scores: {
        [players[0].id]: 0,
        [players[1].id]: 0,
      },
      createdAt: Date.now(),
    });
    console.log(`[seed] ✅ Match created: ${matchRef.id}`);

    console.log('[seed] Done. Players, tournament, and default match seeded.');
    return { tournamentId, players: players.map(p => p.id) };
  } catch (err) {
    console.error('[seed] Failed to seed test data:', err);
    throw err;
  }
}

// Allow running via ts-node directly
if (require.main === module) {
  seedTestData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
