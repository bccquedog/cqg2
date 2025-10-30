import * as admin from "firebase-admin";
import { generateWrapReport, getWrapReport, hasWrapReport } from "../wrapReport";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function testWrapReport() {
  console.log("🏆 Testing Wrap Report System...\n");

  const testCompetitionId = "soloCupS1"; // Use seeded tournament

  try {
    // Test 1: Check if wrap report exists
    console.log("1️⃣ Checking if wrap report exists...");
    const exists = await hasWrapReport(testCompetitionId);
    console.log(`   Wrap report exists: ${exists ? "✅ Yes" : "❌ No"}\n`);

    // Test 2: Generate wrap report
    console.log("2️⃣ Generating wrap report...");
    const report = await generateWrapReport(testCompetitionId);
    console.log("   ✅ Wrap report generated successfully");
    console.log(`   Champion: ${report.champion || "No champion"}`);
    console.log(`   Total Matches: ${report.totalMatches}`);
    console.log(`   Total Players: ${report.summary.totalPlayers}`);
    console.log(`   Completed Matches: ${report.summary.completedMatches}\n`);

    // Test 3: Retrieve wrap report
    console.log("3️⃣ Retrieving wrap report...");
    const retrievedReport = await getWrapReport(testCompetitionId);
    console.log("   ✅ Wrap report retrieved successfully");
    console.log(`   Retrieved Champion: ${retrievedReport?.champion || "No champion"}`);
    console.log(`   Retrieved Total Matches: ${retrievedReport?.totalMatches}\n`);

    // Test 4: Display player statistics
    console.log("4️⃣ Player Statistics:");
    if (report.stats && Object.keys(report.stats).length > 0) {
      Object.entries(report.stats).forEach(([player, stats]) => {
        console.log(`   ${player}: ${stats.wins}W-${stats.losses}L, ${stats.totalPoints} points`);
      });
    } else {
      console.log("   No player statistics available");
    }
    console.log();

    // Test 5: Display match summary
    console.log("5️⃣ Match Summary:");
    if (report.matches && report.matches.length > 0) {
      report.matches.forEach((match, index) => {
        console.log(`   Match ${index + 1}: ${match.players?.join(" vs ") || "Unknown players"} - Winner: ${match.winner || "No winner"}`);
      });
    } else {
      console.log("   No matches found");
    }
    console.log();

    console.log("✅ Wrap report test completed successfully!");

  } catch (error) {
    console.error("❌ Error testing wrap report:", error);
  }
}

// Run the test
testWrapReport().catch(console.error);


