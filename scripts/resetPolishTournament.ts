import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Admin SDK (uses emulator if FIRESTORE_EMULATOR_HOST is set)
initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'demo-cqg' });
const db = getFirestore();

const TOURNAMENT_ID = 'tourney-polish';

async function deleteCollection(path: string) {
  const col = db.collection(path);
  const snap = await col.get();
  if (snap.empty) return;
  const batchSize = 400;
  const chunks = [] as any[];
  let current: any[] = [];
  snap.forEach((doc) => {
    current.push(doc);
    if (current.length >= batchSize) { chunks.push(current); current = []; }
  });
  if (current.length) chunks.push(current);
  for (const group of chunks) {
    const batch = db.batch();
    group.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

async function main() {
  console.log(`🧹 Resetting tournament "${TOURNAMENT_ID}"...`);
  const tourRef = db.collection('tournaments').doc(TOURNAMENT_ID);

  // Delete subcollections
  await deleteCollection(`tournaments/${TOURNAMENT_ID}/matches`);
  await deleteCollection(`tournaments/${TOURNAMENT_ID}/players`);
  await deleteCollection(`tournaments/${TOURNAMENT_ID}/timeline`);
  // Optional highlights subcollection (if ever created at tournament level)
  await deleteCollection(`tournaments/${TOURNAMENT_ID}/highlights`).catch(() => {});

  // Finally delete the tournament doc
  await tourRef.delete().catch(() => {});

  console.log('✅ Tournament and subcollections removed.');
}

main().catch((e) => {
  console.error('❌ Failed to reset polish tournament', e);
  process.exit(1);
});




