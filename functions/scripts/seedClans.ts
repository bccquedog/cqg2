import * as admin from 'firebase-admin';
import { Clan } from '../src/types/clans';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

async function seedClans() {
  const now = admin.firestore.Timestamp.now();
  const pastTime = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30 days ago

  const sampleClans: Omit<Clan, 'id'>[] = [
    {
      name: 'CQG Elite',
      logoUrl: 'https://example.com/logos/cqg-elite.png',
      leaderId: 'player1',
      tagline: 'The ultimate competitive gaming clan',
      roster: [
        {
          playerId: 'player1',
          role: 'leader',
          joinedAt: pastTime,
          status: {
            online: true,
            activity: 'streaming',
            platform: 'twitch',
            streamUrl: 'https://twitch.tv/cqgsniper'
          }
        },
        {
          playerId: 'player2',
          role: 'co-leader',
          joinedAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)),
          status: {
            online: true,
            activity: 'in_match'
          }
        },
        {
          playerId: 'player3',
          role: 'member',
          joinedAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)),
          status: {
            online: false,
            activity: 'idle'
          }
        },
        {
          playerId: 'player4',
          role: 'member',
          joinedAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)),
          status: {
            online: true,
            activity: 'in_voice'
          }
        }
      ],
      voiceSessions: [
        {
          sessionId: 'session1',
          type: 'hq',
          status: 'active',
          participants: ['player1', 'player2', 'player4'],
          createdAt: now
        },
        {
          sessionId: 'session2',
          type: 'match',
          status: 'ended',
          participants: ['player1', 'player2'],
          linkedEventId: 'event123',
          createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000))
        }
      ],
      stats: {
        wins: 45,
        losses: 12,
        surgePower: 2850,
        trophies: ['Championship S1', 'League Winners', 'Tournament Masters']
      },
      clips: ['clip1', 'clip2', 'clip3'],
      comms: {
        activeSessions: [
          {
            sessionId: 'session1',
            type: 'hq',
            participants: 3,
            createdAt: now
          }
        ],
        lastSessionAt: now
      }
    },
    {
      name: 'Madden Kings',
      logoUrl: 'https://example.com/logos/madden-kings.png',
      leaderId: 'player5',
      tagline: 'Dominating the gridiron since day one',
      roster: [
        {
          playerId: 'player5',
          role: 'leader',
          joinedAt: pastTime,
          status: {
            online: true,
            activity: 'streaming',
            platform: 'youtube',
            streamUrl: 'https://youtube.com/@maddenking'
          }
        },
        {
          playerId: 'player6',
          role: 'co-leader',
          joinedAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)),
          status: {
            online: false,
            activity: 'dnd'
          }
        },
        {
          playerId: 'player7',
          role: 'member',
          joinedAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 18 * 24 * 60 * 60 * 1000)),
          status: {
            online: true,
            activity: 'in_match'
          }
        }
      ],
      voiceSessions: [
        {
          sessionId: 'session3',
          type: 'huddle',
          status: 'active',
          participants: ['player5', 'player7'],
          createdAt: now
        }
      ],
      stats: {
        wins: 32,
        losses: 8,
        surgePower: 2100,
        trophies: ['Madden League Champions', 'Season 2 Winners']
      },
      clips: ['clip4', 'clip5'],
      comms: {
        activeSessions: [
          {
            sessionId: 'session3',
            type: 'huddle',
            participants: 2,
            createdAt: now
          }
        ],
        lastSessionAt: now
      }
    },
    {
      name: 'Kick Streamers',
      logoUrl: 'https://example.com/logos/kick-streamers.png',
      leaderId: 'player8',
      tagline: 'Live streaming excellence',
      roster: [
        {
          playerId: 'player8',
          role: 'leader',
          joinedAt: pastTime,
          status: {
            online: true,
            activity: 'streaming',
            platform: 'kick',
            streamUrl: 'https://kick.com/kickstreamer'
          }
        },
        {
          playerId: 'player9',
          role: 'member',
          joinedAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)),
          status: {
            online: true,
            activity: 'streaming',
            platform: 'kick',
            streamUrl: 'https://kick.com/player9'
          }
        }
      ],
      voiceSessions: [
        {
          sessionId: 'session4',
          type: 'hq',
          status: 'active',
          participants: ['player8', 'player9'],
          createdAt: now
        }
      ],
      stats: {
        wins: 18,
        losses: 5,
        surgePower: 1650,
        trophies: ['Streaming Champions']
      },
      clips: ['clip6'],
      comms: {
        activeSessions: [
          {
            sessionId: 'session4',
            type: 'hq',
            participants: 2,
            createdAt: now
          }
        ],
        lastSessionAt: now
      }
    },
    {
      name: 'Rookie Squad',
      logoUrl: 'https://example.com/logos/rookie-squad.png',
      leaderId: 'player10',
      tagline: 'Learning and growing together',
      roster: [
        {
          playerId: 'player10',
          role: 'leader',
          joinedAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
          status: {
            online: false,
            activity: 'idle'
          }
        }
      ],
      voiceSessions: [],
      stats: {
        wins: 2,
        losses: 8,
        surgePower: 450,
        trophies: []
      },
      clips: [],
      comms: {
        activeSessions: [],
        lastSessionAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // 7 days ago
      }
    }
  ];

  for (const clanData of sampleClans) {
    const docRef = await db.collection('clans').add(clanData);
    console.log(`✅ Created clan: ${clanData.name} (${docRef.id})`);
    console.log(`   Leader: ${clanData.leaderId}`);
    console.log(`   Members: ${clanData.roster.length}`);
    console.log(`   Voice Sessions: ${clanData.voiceSessions.length}`);
    console.log(`   Active Comms: ${clanData.comms.activeSessions.length}`);
    console.log(`   Surge Power: ${clanData.stats.surgePower}`);
    console.log(`   Trophies: ${clanData.stats.trophies.length}`);
    console.log(`   Clips: ${clanData.clips.length}`);
    console.log('');
  }

  console.log('🏰 Clans seeded successfully');
}

seedClans()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error seeding clans:', err);
    process.exit(1);
  });
