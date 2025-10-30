import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export async function seedPoll(competitionId: string, type: "prediction" | "overunder") {
  try {
    const pollRef = db
      .collection("tournaments")
      .doc(competitionId)
      .collection("polls")
      .doc();

    let pollData;

    if (type === "prediction") {
      pollData = {
        type: "prediction",
        question: "Who wins Game 7 Finals?",
        options: ["PlayerA", "PlayerB"],
        votes: {},
        createdAt: new Date().toISOString(),
        closesAt: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 mins
        isActive: true,
      };
    } else {
      pollData = {
        type: "overunder",
        question: "Will PlayerX drop 30+ kills this match?",
        options: ["Yes", "No"],
        votes: {},
        createdAt: new Date().toISOString(),
        closesAt: new Date(Date.now() + 1000 * 60 * 5).toISOString(), // 5 mins
        isActive: true,
      };
    }

    await pollRef.set(pollData);
    console.log(`📊 Poll (${type}) seeded for ${competitionId}: ${pollData.question}`);
    console.log(`   • Closes in: ${type === "prediction" ? "10 minutes" : "5 minutes"}`);
    console.log(`   • Poll ID: ${pollRef.id}`);
    
    return pollRef.id;
  } catch (error) {
    console.error(`❌ Error seeding ${type} poll for ${competitionId}:`, error);
    throw error;
  }
}

// Run directly
if (require.main === module) {
  const compId = process.argv[2] || "soloCupS1";
  const type = (process.argv[3] as "prediction" | "overunder") || "prediction";
  
  console.log(`🗳️ Starting poll seeding for: ${compId} (${type})`);
  
  seedPoll(compId, type)
    .then(() => {
      console.log("🗳️ Poll seeding completed successfully!");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Poll seeding failed:", err);
      process.exit(1);
    });
}
