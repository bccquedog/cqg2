import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const sampleAlerts = [
  "⚡ Overtime! This one's going the distance!",
  "🔥 PlayerX just dropped a triple-double in NBA2K",
  "💀 Only 3 squads left in Warzone finals",
  "🎯 PlayerY hit 100% accuracy last round",
  "🏆 Champion match is about to start!",
];

export async function seedSpectatorOverlay(competitionId: string, liveMode = false) {
  try {
    console.log(`🎬 Seeding spectator overlay for ${competitionId}...`);

    // Static spotlight
    const spotlightRef = db.collection("tournaments").doc(competitionId).collection("spotlights").doc("current");
    await spotlightRef.set({
      playerId: "player123",
      title: "Player of the Week",
      description: "Dominated the league with 5 MVP performances",
      createdAt: new Date().toISOString(),
    });

    console.log(`🌟 Spotlight seeded for ${competitionId}`);

    if (liveMode) {
      console.log("🎬 Starting live alert simulation...");
      let i = 0;
      const interval = setInterval(async () => {
        const msg = sampleAlerts[i % sampleAlerts.length];
        await db.collection("tournaments").doc(competitionId).collection("alerts").add({
          message: msg,
          timestamp: new Date().toISOString(),
        });
        console.log(`⚡ Alert added: ${msg}`);
        i++;
        if (i >= sampleAlerts.length * 2) {
          clearInterval(interval);
          console.log("✅ Live simulation ended.");
          process.exit(0);
        }
      }, 5000); // every 5s
    } else {
      // Seed a few static alerts
      await db.collection("tournaments").doc(competitionId).collection("alerts").add({
        message: "⚡ 2 minutes left in Finals — clutch time!",
        timestamp: new Date().toISOString(),
      });
      await db.collection("tournaments").doc(competitionId).collection("alerts").add({
        message: "🔥 PlayerX just dropped 40 kills in Warzone",
        timestamp: new Date().toISOString(),
      });

      console.log(`🎬 Static alerts seeded for ${competitionId}`);
      process.exit(0);
    }
  } catch (error) {
    console.error(`❌ Error seeding spectator overlay for ${competitionId}:`, error);
    throw error;
  }
}

// Run directly
if (require.main === module) {
  const compId = process.argv[2] || "soloCupS1";
  const liveMode = process.argv.includes("--live");
  
  console.log(`🎬 Starting spectator overlay seeding for: ${compId}`);
  if (liveMode) {
    console.log("🎬 Live mode enabled - alerts will be added every 5 seconds");
  }
  
  seedSpectatorOverlay(compId, liveMode).catch((err) => {
    console.error("❌ Spectator overlay seeding failed:", err);
    process.exit(1);
  });
}
