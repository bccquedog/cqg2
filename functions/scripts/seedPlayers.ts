import * as admin from 'firebase-admin';
import { PlayerDoc } from '../src/types/players';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

async function seedPlayers() {
  const now = admin.firestore.Timestamp.now();
  const pastTime = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)); // 2 hours ago
  const futureTime = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 2 * 60 * 60 * 1000)); // 2 hours from now

  const samplePlayers: Omit<PlayerDoc, 'id'>[] = [
    {
      profile: {
        gamerTag: 'CQGSniper',
        avatarUrl: 'https://example.com/avatars/sniper.jpg',
        bio: 'Professional Call of Duty player with 5+ years experience'
      },
      status: {
        live: true,
        platform: 'twitch',
        streamUrl: 'https://twitch.tv/cqgsniper',
        currentEventId: 'event123'
      },
      clips: [
        {
          clipId: 'clip1',
          eventId: 'event123',
          url: 'https://clips.twitch.tv/example1',
          surgeScore: 150,
          featured: true
        },
        {
          clipId: 'clip2',
          url: 'https://clips.twitch.tv/example2',
          surgeScore: 75
        }
      ],
      streams: [
        {
          streamId: 'stream1',
          eventId: 'event123',
          platform: 'twitch',
          url: 'https://twitch.tv/cqgsniper',
          startTime: pastTime,
          endTime: now
        },
        {
          streamId: 'stream2',
          platform: 'twitch',
          url: 'https://twitch.tv/cqgsniper',
          startTime: now
        }
      ],
      legacy: [
        {
          season: 1,
          type: 'tournament',
          description: 'CQG Championship Winner',
          date: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        },
        {
          season: 1,
          type: 'league',
          description: 'Madden League Runner-up',
          date: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000))
        }
      ]
    },
    {
      profile: {
        gamerTag: 'MaddenKing',
        avatarUrl: 'https://example.com/avatars/madden.jpg',
        bio: 'Madden NFL specialist and content creator'
      },
      status: {
        live: false,
        platform: 'youtube',
        streamUrl: 'https://youtube.com/@maddenking'
      },
      clips: [
        {
          clipId: 'clip3',
          eventId: 'event456',
          url: 'https://youtube.com/clip/example3',
          surgeScore: 200,
          featured: true
        }
      ],
      streams: [
        {
          streamId: 'stream3',
          eventId: 'event456',
          platform: 'youtube',
          url: 'https://youtube.com/@maddenking',
          startTime: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 4 * 60 * 60 * 1000)),
          endTime: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000))
        }
      ],
      legacy: [
        {
          season: 1,
          type: 'challenge',
          description: 'Weekly Challenge Winner',
          date: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        }
      ]
    },
    {
      profile: {
        gamerTag: 'KickStreamer',
        avatarUrl: 'https://example.com/avatars/kick.jpg',
        bio: 'Multi-platform streamer and community builder'
      },
      status: {
        live: true,
        platform: 'kick',
        streamUrl: 'https://kick.com/kickstreamer',
        currentEventId: 'event789'
      },
      clips: [],
      streams: [
        {
          streamId: 'stream4',
          eventId: 'event789',
          platform: 'kick',
          url: 'https://kick.com/kickstreamer',
          startTime: now
        }
      ],
      legacy: [
        {
          season: 1,
          type: 'stream',
          description: 'Community Game Night Host',
          date: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000))
        }
      ]
    },
    {
      profile: {
        gamerTag: 'RookiePlayer',
        avatarUrl: 'https://example.com/avatars/rookie.jpg',
        bio: 'New to competitive gaming, learning the ropes'
      },
      status: {
        live: false
      },
      clips: [],
      streams: [],
      legacy: []
    }
  ];

  for (const playerData of samplePlayers) {
    const docRef = await db.collection('players').add(playerData);
    console.log(`✅ Created player: ${playerData.profile.gamerTag} (${docRef.id})`);
  }

  console.log('👥 Players seeded successfully');
}

seedPlayers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error seeding players:', err);
    process.exit(1);
  });


