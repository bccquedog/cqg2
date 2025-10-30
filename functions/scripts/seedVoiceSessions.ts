import * as admin from 'firebase-admin';
import { VoiceSession } from '../src/types/voiceSessions';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

async function seedVoiceSessions() {
  const now = admin.firestore.Timestamp.now();
  const pastTime = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)); // 2 hours ago
  const recentTime = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 30 * 60 * 1000)); // 30 minutes ago

  // Sample clan IDs (assuming these exist)
  const clanIds = ['clan1', 'clan2', 'clan3'];
  
  // Sample player IDs
  const playerIds = ['player1', 'player2', 'player3', 'player4', 'player5'];

  const sampleVoiceSessions: Array<{ clanId: string; session: VoiceSession }> = [
    // Clan 1 - Active sessions
    {
      clanId: 'clan1',
      session: {
        sessionId: 'session1',
        createdBy: 'player1',
        createdAt: pastTime,
        type: 'permanent',
        status: 'active',
        participants: [
          {
            playerId: 'player1',
            joinedAt: pastTime
          },
          {
            playerId: 'player2',
            joinedAt: recentTime
          }
        ],
        metadata: {
          isRecording: false
        }
      }
    },
    {
      clanId: 'clan1',
      session: {
        sessionId: 'session2',
        createdBy: 'player2',
        createdAt: recentTime,
        type: 'match',
        status: 'active',
        participants: [
          {
            playerId: 'player1',
            joinedAt: recentTime
          },
          {
            playerId: 'player2',
            joinedAt: recentTime
          },
          {
            playerId: 'player3',
            joinedAt: recentTime
          }
        ],
        metadata: {
          linkedEventId: 'event123',
          isRecording: true
        }
      }
    },
    
    // Clan 2 - Mixed sessions
    {
      clanId: 'clan2',
      session: {
        sessionId: 'session3',
        createdBy: 'player3',
        createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 4 * 60 * 60 * 1000)),
        type: 'huddle',
        status: 'ended',
        participants: [
          {
            playerId: 'player3',
            joinedAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 4 * 60 * 60 * 1000)),
            leftAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 3 * 60 * 60 * 1000))
          },
          {
            playerId: 'player4',
            joinedAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 3.5 * 60 * 60 * 1000)),
            leftAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 3 * 60 * 60 * 1000))
          }
        ],
        metadata: {
          isRecording: false
        }
      }
    },
    {
      clanId: 'clan2',
      session: {
        sessionId: 'session4',
        createdBy: 'player4',
        createdAt: now,
        type: 'permanent',
        status: 'active',
        participants: [
          {
            playerId: 'player4',
            joinedAt: now
          }
        ],
        metadata: {
          isRecording: false
        }
      }
    },
    
    // Clan 3 - Tournament session
    {
      clanId: 'clan3',
      session: {
        sessionId: 'session5',
        createdBy: 'player5',
        createdAt: recentTime,
        type: 'match',
        status: 'active',
        participants: [
          {
            playerId: 'player5',
            joinedAt: recentTime
          },
          {
            playerId: 'player1',
            joinedAt: recentTime
          }
        ],
        metadata: {
          linkedEventId: 'event456',
          isRecording: true
        }
      }
    }
  ];

  // Seed voice sessions
  for (const { clanId, session } of sampleVoiceSessions) {
    await db.collection('clans').doc(clanId)
      .collection('voiceSessions')
      .doc(session.sessionId)
      .set(session);
    
    console.log(`✅ Created voice session: ${session.sessionId} in clan ${clanId}`);
    console.log(`   Type: ${session.type} | Status: ${session.status}`);
    console.log(`   Participants: ${session.participants.length}`);
    if (session.metadata.linkedEventId) {
      console.log(`   Linked Event: ${session.metadata.linkedEventId}`);
    }
    if (session.metadata.isRecording) {
      console.log(`   🔴 Recording`);
    }
    console.log('');
  }

  console.log('🎤 Voice sessions seeded successfully');
}

seedVoiceSessions()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error seeding voice sessions:', err);
    process.exit(1);
  });


