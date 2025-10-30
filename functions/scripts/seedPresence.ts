import * as admin from 'firebase-admin';
import { EventPresence } from '../src/types/presence';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

async function seedPresence() {
  const now = admin.firestore.Timestamp.now();
  const recentTime = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000)); // 5 minutes ago

  // Sample event IDs (assuming these exist from seedEvents)
  const eventIds = ['event123', 'event456', 'event789'];
  
  // Sample player IDs (assuming these exist from seedPlayers)
  const playerIds = ['player1', 'player2', 'player3', 'player4'];

  const samplePresence: EventPresence[] = [
    // Event 1 - Live tournament
    {
      playerId: 'player1',
      status: 'streaming',
      platform: 'twitch',
      streamUrl: 'https://twitch.tv/cqgsniper',
      lastUpdated: now
    },
    {
      playerId: 'player2',
      status: 'in_match',
      lastUpdated: recentTime
    },
    {
      playerId: 'player3',
      status: 'online',
      lastUpdated: recentTime
    },
    {
      playerId: 'player4',
      status: 'chilling',
      lastUpdated: recentTime
    },
    
    // Event 2 - League event
    {
      playerId: 'player1',
      status: 'streaming',
      platform: 'youtube',
      streamUrl: 'https://youtube.com/@maddenking',
      lastUpdated: now
    },
    {
      playerId: 'player2',
      status: 'dnd',
      lastUpdated: recentTime
    },
    
    // Event 3 - Community event
    {
      playerId: 'player3',
      status: 'streaming',
      platform: 'kick',
      streamUrl: 'https://kick.com/kickstreamer',
      lastUpdated: now
    },
    {
      playerId: 'player4',
      status: 'online',
      lastUpdated: recentTime
    }
  ];

  // Group presence by event
  const presenceByEvent: Record<string, EventPresence[]> = {};
  
  // Distribute presence across events
  samplePresence.forEach((presence, index) => {
    const eventId = eventIds[index % eventIds.length];
    if (!presenceByEvent[eventId]) {
      presenceByEvent[eventId] = [];
    }
    presenceByEvent[eventId].push(presence);
  });

  // Seed presence for each event
  for (const [eventId, presenceList] of Object.entries(presenceByEvent)) {
    console.log(`🎪 Seeding presence for event ${eventId}...`);
    
    for (const presence of presenceList) {
      await db.collection('events').doc(eventId)
        .collection('presence')
        .doc(presence.playerId)
        .set(presence);
      
      console.log(`   ✅ ${presence.playerId}: ${presence.status}${presence.platform ? ` (${presence.platform})` : ''}`);
    }
  }

  console.log('👥 Event presence seeded successfully');
}

seedPresence()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error seeding presence:', err);
    process.exit(1);
  });


