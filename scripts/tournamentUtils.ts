import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

export type AutoContext = {
  app: ReturnType<typeof initializeApp>;
  db: ReturnType<typeof getFirestore>;
};

export async function connectEmulator(): Promise<AutoContext> {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8085';
    console.log(`[auto] FIRESTORE_EMULATOR_HOST not set, defaulting to ${process.env.FIRESTORE_EMULATOR_HOST}`);
  }
  const app = initializeApp({ projectId: 'demo-cqg' } as any);
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', Number(process.env.FIRESTORE_EMULATOR_HOST.split(':')[1] || 8085));
  return { app, db };
}

export async function seedTournament(db: ReturnType<typeof getFirestore>, tournamentId: string, playerCount = 16) {
  // players
  const playerIds: string[] = [];
  for (let i = 1; i <= playerCount; i++) {
    const id = `player${i}`;
    playerIds.push(id);
    await setDoc(doc(db, 'players', id), {
      displayName: `Player ${i}`,
      seed: i,
      status: 'idle',
      createdAt: Date.now(),
    });
  }

  // tournament
  await setDoc(doc(db, 'tournaments', tournamentId), {
    name: 'Auto Test Tournament',
    status: 'live',
    type: 'single_elim',
    autoProgress: true,
    maxPlayers: playerCount,
    createdAt: Date.now(),
  });

  // round 1 matches
  const shuffled = [...playerIds].sort(() => 0.5 - Math.random());
  for (let i = 0; i < shuffled.length; i += 2) {
    const a = shuffled[i];
    const b = shuffled[i + 1];
    const mRef = doc(collection(db, `tournaments/${tournamentId}/matches`));
    await setDoc(mRef, {
      playerA: a,
      playerB: b,
      playerAId: a,
      playerBId: b,
      round: 1,
      status: 'pending',
      scoreA: 0,
      scoreB: 0,
      submittedAt: null,
      reportedBy: null,
      createdAt: serverTimestamp(),
    });
  }
  console.log('[auto] Seeding complete');
}

export async function progressRound(db: ReturnType<typeof getFirestore>, tournamentId: string, round: number) {
  const snap = await getDocs(collection(db, `tournaments/${tournamentId}/matches`));
  const matches = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
    .filter((m) => (m.round || 1) === round);
  console.log(`[auto] Round ${round} started (${matches.length} matches)`);
  let idx = 1;
  for (const m of matches) {
    const sA = Math.floor(Math.random() * 11) + 5;
    const sB = Math.floor(Math.random() * 11) + 5;
    const winner = sA >= sB ? m.playerA : m.playerB;
    await updateDoc(doc(db, `tournaments/${tournamentId}/matches/${m.id}`), {
      scoreA: sA,
      scoreB: sB,
      winner,
      status: 'completed',
      submittedAt: serverTimestamp(),
      reportedBy: 'autoTest',
    });
    console.log(`[auto] Round ${round} Match ${idx} completed → winner: ${winner}`);
    idx++;
  }
}

export async function findChampion(db: ReturnType<typeof getFirestore>, tournamentId: string): Promise<string | null> {
  const snap = await getDocs(collection(db, `tournaments/${tournamentId}/matches`));
  const completed = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
    .filter((m) => m.status === 'completed');
  const lastRound = completed.reduce((acc, m) => Math.max(acc, m.round || 1), 1);
  const finalMatch = completed.find((m) => (m.round || 1) === lastRound);
  return finalMatch?.winner || null;
}




