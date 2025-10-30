import * as admin from "firebase-admin";
import { generateWrapReport, updateLeaderboards } from "../wrapReport";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function testUpdateLeaderboards() {
  console.log("📊 Testing Leaderboard Updates from Wrap Reports...\n");

  const testCompetitionId = "soloCupS1"; // Use seeded tournament
  const testGameId = "madden";
  const testLeagueId = "soloLeagueS1";

  try {
    // Test 1: Generate a wrap report
    console.log("1️⃣ Generating wrap report...");
    const report = await generateWrapReport(testCompetitionId);
    console.log("   ✅ Wrap report generated successfully");
    console.log(`   Champion: ${report.champion || "No champion"}`);
    console.log(`   Total Players: ${Object.keys(report.stats).length}`);
    console.log(`   Total Matches: ${report.totalMatches}\n`);

    // Test 2: Manually update leaderboards
    console.log("2️⃣ Manually updating leaderboards...");
    await updateLeaderboards(report, testGameId, testLeagueId);
    console.log("   ✅ Leaderboards updated successfully\n");

    // Test 3: Check leaderboard data
    console.log("3️⃣ Checking leaderboard data...");
    const db = admin.firestore();
    
    // Check global leaderboard
    const globalRef = db.collection("leaderboards").doc("global").collection("players");
    const globalSnapshot = await globalRef.get();
    console.log(`   Global leaderboard players: ${globalSnapshot.size}`);
    
    globalSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`   ${doc.id}: ${data.wins}W-${data.losses}L, ${data.totalPoints} points, ${data.titles} titles`);
    });

    // Check game leaderboard
    const gameRef = db.collection("leaderboards").doc(testGameId).collection("players");
    const gameSnapshot = await gameRef.get();
    console.log(`\n   ${testGameId} leaderboard players: ${gameSnapshot.size}`);
    
    gameSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`   ${doc.id}: ${data.wins}W-${data.losses}L, ${data.totalPoints} points, ${data.titles} titles`);
    });

    // Check league leaderboard
    const leagueRef = db.collection("leaderboards").doc(testLeagueId).collection("players");
    const leagueSnapshot = await leagueRef.get();
    console.log(`\n   ${testLeagueId} leaderboard players: ${leagueSnapshot.size}`);
    
    leagueSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`   ${doc.id}: ${data.wins}W-${data.losses}L, ${data.totalPoints} points, ${data.titles} titles`);
    });

    console.log("\n✅ Leaderboard update test completed successfully!");

  } catch (error) {
    console.error("❌ Error testing leaderboard updates:", error);
  }
}

// Run the test
testUpdateLeaderboards().catch(console.error);


