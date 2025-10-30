import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Admin SDK. If FIRESTORE_EMULATOR_HOST is set, Admin SDK will target the emulator.
initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'demo-cqg' });
const db = getFirestore();

function randomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `GOLD-${suffix}`;
}

async function seedInvites(count = 5) {
  try {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = randomCode();
      const ref = db.collection('invites').doc(code);
      await ref.set({
        code,
        status: 'unused',
        createdBy: 'seed-script',
        usedBy: null,
        createdAt: FieldValue.serverTimestamp(),
        usedAt: null,
      }, { merge: false });
      codes.push(code);
      console.log(`✅ Invite seeded: ${code}`);
    }
    console.log(`\n🎫 Seeded ${codes.length} Golden Ticket invites.`);
  } catch (e) {
    console.error('❌ Failed to seed invites', e);
    process.exit(1);
  }
}

if (require.main === module) {
  // Ensure emulator host is set for local runs
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    console.warn('⚠️ FIRESTORE_EMULATOR_HOST not set. This script is intended for emulator usage.');
  }
  seedInvites(5).then(() => process.exit(0));
}




