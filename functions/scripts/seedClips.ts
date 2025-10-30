import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function seedClips(competitionId: string) {
  const clipsRef = db.collection("tournaments").doc(competitionId).collection("clips");

  const sampleClips = [
    {
      playerId: "player123",
      url: "https://www.twitch.tv/clip/ExcitingClip123",
      embedUrl: "https://clips.twitch.tv/embed?clip=ExcitingClip123",
      source: "twitch",
      description: "🔥 Insane 1v4 clutch",
      surgeScore: 95,
      createdAt: new Date().toISOString(),
    },
    {
      playerId: "player456",
      url: "https://youtube.com/watch?v=abc123",
      embedUrl: "https://www.youtube.com/embed/abc123",
      source: "youtube",
      description: "🏀 Half-court buzzer beater!",
      surgeScore: 88,
      createdAt: new Date().toISOString(),
    },
    {
      playerId: "player789",
      url: "https://www.twitch.tv/clip/BigPlays456",
      embedUrl: "https://clips.twitch.tv/embed?clip=BigPlays456",
      source: "twitch",
      description: "💀 Triple kill to win the round",
      surgeScore: 92,
      createdAt: new Date().toISOString(),
    },
  ];

  for (const clip of sampleClips) {
    await clipsRef.add(clip);
    console.log(`🎬 Clip added: ${clip.description}`);
  }

  console.log(`✅ Clips seeded for ${competitionId}`);
}

// Run directly
if (require.main === module) {
  const compId = process.argv[2] || "soloCupS1";
  seedClips(compId)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
