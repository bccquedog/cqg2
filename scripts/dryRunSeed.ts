import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const app = initializeApp({ projectId: 'demo-cqg' });
const db = getFirestore(app);

async function seedDryRunData() {
  console.log('🌱 Starting dry run seeding...');
  
  // Clear existing data first
  console.log('🗑️ Clearing existing data...');
  const collections = ['tournaments', 'players'];
  for (const col of collections) {
    const snap = await db.collection(col).get();
    const batch = db.batch();
    snap.forEach(doc => batch.delete(doc.ref));
    if (!snap.empty) {
      await batch.commit();
      console.log(`   Cleared ${col}`);
    }
  }

  // Seed 16 players
  console.log('👥 Seeding 16 players...');
  const playerIds: string[] = [];
  for (let i = 1; i <= 16; i++) {
    const id = `player${i}`;
    playerIds.push(id);
    await db.collection('players').doc(id).set({
      displayName: `Player ${i}`,
      name: `Player ${i}`,
      seed: i,
      status: 'idle',
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  console.log(`   ✅ Created players: ${playerIds.join(', ')}`);

  // Create tournament with status = 'setup'
  console.log('🏆 Creating tournament...');
  const tournamentRef = db.collection('tournaments').doc('tourney-test');
  await tournamentRef.set({
    name: 'Dry Run Test Tournament',
    game: 'Call of Duty',
    status: 'setup',
    type: 'single_elim',
    maxPlayers: 16,
    currentPlayers: 16,
    round: 1,
    totalRounds: 4,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    seedingMode: 'random',
    seedOrder: null,
    autoProgress: true,
    settings: {
      streamRequired: false,
      disputesAllowed: true
    }
  });
  console.log('   ✅ Tournament created: tourney-test');

  // Add players to tournament
  console.log('📝 Adding players to tournament...');
  for (let i = 0; i < playerIds.length; i++) {
    await tournamentRef.collection('players').doc(playerIds[i]).set({
      name: `Player ${i + 1}`,
      seed: i + 1,
      status: 'active',
      createdAt: FieldValue.serverTimestamp()
    });
  }
  console.log('   ✅ Players added to tournament');

  // Generate Round 1 matches (8 matches for 16 players)
  console.log('🎮 Generating Round 1 matches...');
  const shuffled = [...playerIds].sort(() => 0.5 - Math.random());
  for (let i = 0; i < shuffled.length; i += 2) {
    const playerA = shuffled[i];
    const playerB = shuffled[i + 1];
    const matchRef = tournamentRef.collection('matches').doc();
    await matchRef.set({
      playerA,
      playerB,
      playerAId: playerA,
      playerBId: playerB,
      round: 1,
      roundNumber: 1,
      status: 'pending',
      scoreA: 0,
      scoreB: 0,
      winner: null,
      submittedAt: null,
      reportedBy: null,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  console.log('   ✅ Round 1 matches generated (8 matches)');

  console.log('\n🎉 Dry run seeding completed!');
  console.log('📊 Summary:');
  console.log('   - 16 players created (player1 → player16)');
  console.log('   - Tournament "tourney-test" created with status: setup');
  console.log('   - 8 Round 1 matches generated');
  console.log('   - Ready for dry run testing');
}

seedDryRunData().catch(err => {
  console.error('❌ Error seeding:', err);
  process.exit(1);
});


