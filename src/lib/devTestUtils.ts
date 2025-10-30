import { db } from '@/lib/firebase';
import { collection, getDocs, writeBatch, doc, setDoc } from 'firebase/firestore';

async function clearCollection(path: string) {
  const snap = await getDocs(collection(db, path));
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  if (!snap.empty) await batch.commit();
}

async function clearTournamentsAndMatches() {
  const tSnap = await getDocs(collection(db, 'tournaments'));
  for (const t of tSnap.docs) {
    // delete matches subcollection
    const mSnap = await getDocs(collection(db, `tournaments/${t.id}/matches`));
    if (!mSnap.empty) {
      const mBatch = writeBatch(db);
      mSnap.docs.forEach((m) => mBatch.delete(m.ref));
      await mBatch.commit();
    }
  }
  const tBatch = writeBatch(db);
  tSnap.docs.forEach((t) => tBatch.delete(t.ref));
  if (!tSnap.empty) await tBatch.commit();
}

export async function resetTestData() {
  await clearCollection('players');
  await clearTournamentsAndMatches();
  return { success: true, message: 'Collections cleared.' };
}

export async function seedTestData(opts?: { auto?: boolean }) {
  const auto = Boolean(opts?.auto);
  // reset first for idempotency
  await resetTestData();

  // Seed 16 players
  const players = Array.from({ length: 16 }, (_, i) => ({ id: `player${i + 1}`, name: `Player ${i + 1}` }));
  {
    const batch = writeBatch(db);
    players.forEach((p, idx) => {
      batch.set(doc(db, 'players', p.id), {
        displayName: p.name,
        seed: idx + 1,
        status: 'idle',
        tier: 'bronze',
        createdAt: Date.now(),
      });
    });
    await batch.commit();
  }

  // Create tournament
  const tournamentId = 'tourney-dev';
  await setDoc(doc(db, 'tournaments', tournamentId), {
    name: 'Dev Test Tournament',
    game: 'Test Game',
    status: 'pending',
    buyIn: 0,
    settings: { format: 'single-elimination' },
    maxPlayers: 16,
    seedingMode: 'random',
    seedOrder: null,
    waitlistEnabled: false,
    autoArchive: true,
    archived: false,
    createdAt: Date.now(),
  });

  // Seed 2 matches
  const m1 = doc(collection(db, `tournaments/${tournamentId}/matches`));
  await setDoc(m1, {
    id: m1.id,
    playerA: players[0].id,
    playerB: players[1].id,
    playerAId: players[0].id,
    playerBId: players[1].id,
    round: 1,
    status: 'pending',
    scoreA: 0,
    scoreB: 0,
    scores: { [players[0].id]: 0, [players[1].id]: 0 },
    createdAt: Date.now(),
  });
  const m2 = doc(collection(db, `tournaments/${tournamentId}/matches`));
  await setDoc(m2, {
    id: m2.id,
    playerA: players[2].id,
    playerB: players[3].id,
    playerAId: players[2].id,
    playerBId: players[3].id,
    round: 1,
    status: 'pending',
    scoreA: 0,
    scoreB: 0,
    scores: { [players[2].id]: 0, [players[3].id]: 0 },
    createdAt: Date.now(),
  });

  return { success: true, auto, tournamentId, playersCount: players.length };
}

export async function seedFreeTournament() {
  const id = 'tourney-free';
  await setDoc(doc(db, 'tournaments', id), {
    name: 'Free Test Tournament',
    game: 'Test Game',
    status: 'pending',
    buyIn: 0,
    maxPlayers: 16,
    seedingMode: 'random',
    seedOrder: null,
    waitlistEnabled: false,
    autoArchive: true,
    archived: false,
    createdAt: Date.now(),
  });
  return { success: true, tournamentId: id, maxPlayers: 16 };
}

export async function seedPaidTournament() {
  const id = 'tourney-paid';
  await setDoc(doc(db, 'tournaments', id), {
    name: 'Paid Test Tournament ($5)',
    game: 'Test Game',
    status: 'pending',
    buyIn: 500,
    maxPlayers: 16,
    seedingMode: 'random',
    seedOrder: null,
    waitlistEnabled: false,
    autoArchive: true,
    archived: false,
    createdAt: Date.now(),
  });
  return { success: true, tournamentId: id, maxPlayers: 16, buyIn: 500 };
}

export async function getCurrentTestState() {
  const pSnap = await getDocs(collection(db, 'players'));
  const tSnap = await getDocs(collection(db, 'tournaments'));
  let matchesCount = 0;
  for (const t of tSnap.docs) {
    const mSnap = await getDocs(collection(db, `tournaments/${t.id}/matches`));
    matchesCount += mSnap.size;
  }
  return { playersCount: pSnap.size, tournamentsCount: tSnap.size, matchesCount };
}


