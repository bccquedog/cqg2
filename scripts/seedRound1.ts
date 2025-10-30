import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Simple CLI arg parser: --players=4|8|16
const argPlayers = process.argv.find(a => a.startsWith('--players='));
const polishFlag = process.argv.find(a => a === '--polishTest=true') !== undefined;
const playersCount = argPlayers ? parseInt(argPlayers.split('=')[1], 10) : 4;
const validCounts = [4, 8, 16];
const numPlayers = validCounts.includes(playersCount) ? playersCount : 4;

initializeApp({ projectId: 'demo-cqg' });
const db = getFirestore();

function generatePlayerIds(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `player${i + 1}`);
}

async function seed() {
  // Special polish test seeding
  if (polishFlag) {
    const tid = 'tourney-polish';
    const tourRef = db.collection('tournaments').doc(tid);
    const players = generatePlayerIds(8);
    const startTime = new Date(Date.now() + 5 * 60 * 1000);

    await tourRef.set({
      name: `Polish Feature Tournament`,
      game: 'Test Game',
      status: 'upcoming',
      startTime,
      endTime: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      maxPlayers: 8,
      currentPlayers: 8,
      round: 1,
      totalRounds: 3
    });

    for (let i = 0; i < 8; i++) {
      await tourRef.collection('players').add({
        name: players[i],
        seed: i + 1,
        status: 'active',
        createdAt: new Date()
      });
    }

    // Round 1 matches
    for (let i = 0; i < 4; i++) {
      const a = players[i * 2];
      const b = players[i * 2 + 1];
      const mRef = tourRef.collection('matches').doc(`r1_${i}`);
      await mRef.set({
        playerA: a,
        playerB: b,
        scoreA: 0,
        scoreB: 0,
        winner: null,
        status: 'pending',
        submittedAt: null,
        reportedBy: null,
        round: 1
      });
    }

    // One completed match with highlights for future-ready test
    const cRef = tourRef.collection('matches').doc('r1_0');
    await cRef.update({
      scoreA: 12,
      scoreB: 9,
      winner: players[0],
      status: 'completed',
      submittedAt: new Date(),
      reportedBy: players[0],
      highlights: [
        {
          clipUrl: 'https://example.com/clip1.mp4',
          uploader: players[0],
          timestamp: FieldValue.serverTimestamp(),
        }
      ]
    });

    // Seed initial timeline entry
    await tourRef.collection('timeline').add({
      action: 'Tournament seeded',
      actor: 'system',
      timestamp: FieldValue.serverTimestamp()
    });

    console.log(`✅ Seeded polish test tournament "${tid}"`);
    console.log(`StartTime: ${startTime.toISOString()}`);
    console.log(`Highlights: 1 match has clips`);
    console.log(`Timeline: initialized with seed entry`);
    return;
  }

  // Default seeding path
  const players = generatePlayerIds(numPlayers);
  const tourRef = db.collection('tournaments').doc();

  await tourRef.set({
    name: `E2E Tournament (${numPlayers})`,
    game: 'Test Game',
    status: 'upcoming',
    createdAt: new Date(),
    updatedAt: new Date(),
    maxPlayers: numPlayers,
    currentPlayers: numPlayers,
    round: 1,
    totalRounds: Math.log2(numPlayers)
  });

  // Seed players subcollection (basic IDs player1..playerN)
  for (let i = 0; i < numPlayers; i++) {
    await tourRef.collection('players').add({
      name: players[i],
      seed: i + 1,
      status: 'active',
      createdAt: new Date()
    });
  }

  // Seed Round 1 matches only (let auto-progression handle further rounds)
  const matchCount = numPlayers / 2;
  for (let i = 0; i < matchCount; i++) {
    const a = players[i * 2];
    const b = players[i * 2 + 1];
    await tourRef.collection('matches').add({
      playerA: a,
      playerB: b,
      scoreA: 0,
      scoreB: 0,
      winner: null,
      status: 'pending',
      submittedAt: null,
      reportedBy: null,
      round: 1
    });
  }

  console.log(`✅ Seeded tournament "${tourRef.id}" with ${numPlayers} players and ${matchCount} matches in Round 1`);
  console.log('Waiting for progression...');
}

seed().catch((e) => {
  console.error('❌ Seed failed', e);
  process.exit(1);
});


