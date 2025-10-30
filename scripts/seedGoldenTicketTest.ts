import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Admin SDK (targets emulator automatically if FIRESTORE_EMULATOR_HOST is set)
initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'demo-cqg' });
const db = getFirestore();

async function clearCollection(path: string) {
  const col = db.collection(path);
  const snap = await col.get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

async function main() {
  try {
    // Clear existing
    await clearCollection('players');
    await clearCollection('invites');

    // Seed players
    await db.collection('players').doc('player1').set({
      uid: 'player1',
      displayName: 'Player One',
      hasGoldenTicket: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    await db.collection('players').doc('player2').set({
      uid: 'player2',
      displayName: 'Player Two',
      hasGoldenTicket: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Seed invites
    await db.collection('invites').doc('GOLD-PLAYER1').set({
      code: 'GOLD-PLAYER1',
      status: 'unused',
      createdBy: 'seed-script',
      usedBy: null,
      createdAt: FieldValue.serverTimestamp(),
      usedAt: null,
    });

    await db.collection('invites').doc('GOLD-PLAYER2').set({
      code: 'GOLD-PLAYER2',
      status: 'unused',
      createdBy: 'seed-script',
      usedBy: null,
      createdAt: FieldValue.serverTimestamp(),
      usedAt: null,
    });

    console.log('✅ Seed complete: 2 players, 2 invites');
    console.log('🎟 Invites: GOLD-PLAYER1, GOLD-PLAYER2');
    process.exit(0);
  } catch (e) {
    console.error('❌ Seed failed', e);
    process.exit(1);
  }
}

if (require.main === module) {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    console.warn('⚠️ FIRESTORE_EMULATOR_HOST not set. This script is intended for emulator usage.');
  }
  main();
}




