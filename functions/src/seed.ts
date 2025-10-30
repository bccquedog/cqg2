import * as admin from 'firebase-admin';
import * as path from 'path';

const serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const serviceAccount = require(serviceAccountPath);

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();
const rtdb = admin.database();

async function seed() {
  console.log('🌱 Seeding Firestore + Realtime DB...');

  // Profiles (Firestore)
  await db.collection('profiles').doc('user123').set({
    username: 'PlayerOne',
    email: 'player1@example.com',
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Tournaments (Firestore)
  await db.collection('tournaments').doc('tournament123').set({
    name: 'CQG Championship',
    game: 'Call of Duty',
    season: 'S1',
    status: 'upcoming',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Leagues (Firestore)
  await db.collection('leagues').doc('league123').set({
    name: 'CQG Pro League',
    tier: 'Mamba',
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Matches (Firestore)
  await db.collection('matches').doc('match123').set({
    tournamentId: 'tournament123',
    teamA: 'user123',
    teamB: 'user456',
    score: '0-0',
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Presence (Realtime DB)
  await rtdb.ref('presence/user123').set({
    state: 'online',
    lastChanged: Date.now(),
  });

  console.log('✅ Seeding complete!');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
