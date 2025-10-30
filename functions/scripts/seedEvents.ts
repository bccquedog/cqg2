import * as admin from 'firebase-admin';
import { EventDoc } from '../src/types/events';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

async function seedEvents() {
  const now = admin.firestore.Timestamp.now();
  const futureTime = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 7 days from now
  const pastTime = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)); // 2 days ago

  const sampleEvents: Omit<EventDoc, 'id' | 'audit'>[] = [
    {
      type: 'tournament',
      status: 'live',
      details: {
        title: 'CQG Weekly COD Championship',
        description: 'Weekly Call of Duty tournament with $500 prize pool',
        game: 'Call of Duty',
        startTime: pastTime,
        endTime: futureTime,
        organizerId: 'admin123'
      },
      streams: [
        {
          streamId: 'stream1',
          playerId: 'player1',
          platform: 'twitch',
          url: 'https://twitch.tv/cqgplayer1',
          isFeatured: true,
          status: 'live'
        },
        {
          streamId: 'stream2',
          playerId: 'player2',
          platform: 'youtube',
          url: 'https://youtube.com/watch?v=example',
          isFeatured: false,
          status: 'live'
        }
      ],
      overlays: {
        activePoll: 'poll123',
        activeClip: 'clip456',
        ads: [
          {
            adId: 'ad1',
            type: 'static',
            url: 'https://example.com/ad1.png',
            slot: 'pregame'
          },
          {
            adId: 'ad2',
            type: 'video',
            url: 'https://example.com/ad2.mp4',
            slot: 'betweenMatches'
          }
        ]
      },
      surgeHighlights: [
        {
          clipId: 'clip789',
          playerId: 'player1',
          scoreBoost: 50,
          timestamp: now
        }
      ],
      chatIntegration: {
        discordChannelId: '123456789',
        cqgChatEnabled: true
      }
    },
    {
      type: 'league',
      status: 'pregame',
      details: {
        title: 'Madden NFL Season 2',
        description: 'Season 2 of our competitive Madden NFL league',
        game: 'Madden NFL',
        startTime: futureTime,
        organizerId: 'admin123'
      },
      streams: [],
      overlays: {
        ads: []
      },
      surgeHighlights: [],
      chatIntegration: {
        cqgChatEnabled: true
      }
    },
    {
      type: 'community',
      status: 'completed',
      details: {
        title: 'Community Game Night',
        description: 'Casual gaming session for community members',
        startTime: pastTime,
        endTime: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)),
        organizerId: 'moderator1'
      },
      streams: [
        {
          streamId: 'stream3',
          platform: 'kick',
          url: 'https://kick.com/community',
          isFeatured: true,
          status: 'completed'
        }
      ],
      overlays: {
        ads: []
      },
      surgeHighlights: [],
      chatIntegration: {
        cqgChatEnabled: false
      }
    },
    {
      type: 'special',
      status: 'draft',
      details: {
        title: 'CQG Anniversary Tournament',
        description: 'Special anniversary tournament with exclusive rewards',
        game: 'Call of Duty',
        startTime: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        organizerId: 'admin123'
      },
      streams: [],
      overlays: {
        ads: []
      },
      surgeHighlights: [],
      chatIntegration: {
        cqgChatEnabled: true
      }
    }
  ];

  for (const eventData of sampleEvents) {
    const audit = {
      createdBy: 'admin123',
      createdAt: now,
      updatedAt: now
    };

    const docRef = await db.collection('events').add({
      ...eventData,
      audit
    });

    console.log(`✅ Created event: ${eventData.details.title} (${docRef.id})`);
  }

  console.log('🎪 Events seeded successfully');
}

seedEvents()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error seeding events:', err);
    process.exit(1);
  });


