import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export async function sanityReports() {
  console.log("📑 Running Report Sanity Check...\n");

  try {
    const reports = await db.collectionGroup("reports").get();
    if (reports.empty) {
      console.log("⚠️ No reports found");
      return;
    }

    let totalReports = 0;
    let issues = 0;
    let reportsWithChampions = 0;
    let reportsWithoutChampions = 0;
    let totalMatches = 0;
    let totalPlayers = 0;
    let reportsWithStats = 0;
    let reportsWithoutStats = 0;

    console.log(`Found ${reports.docs.length} reports across all collections\n`);

    for (const doc of reports.docs) {
      const data = doc.data();
      totalReports++;

      console.log(`📋 Report: ${doc.ref.path}`);
      console.log(`   Champion: ${data.champion || "No champion"}`);
      console.log(`   Completed At: ${data.completedAt || "Not specified"}`);
      console.log(`   Total Matches: ${data.totalMatches || 0}`);
      console.log(`   Total Players: ${data.summary?.totalPlayers || 0}`);
      console.log(`   Completed Matches: ${data.summary?.completedMatches || 0}`);

      // Validation checks
      if (!data.champion) {
        console.log("   ❌ Missing champion");
        issues++;
        reportsWithoutChampions++;
      } else {
        reportsWithChampions++;
      }

      if (!data.matches || data.matches.length === 0) {
        console.log("   ❌ Missing match history");
        issues++;
      } else {
        totalMatches += data.matches.length;
      }

      if (!data.completedAt) {
        console.log("   ❌ Missing completion timestamp");
        issues++;
      }

      if (!data.totalMatches || data.totalMatches === 0) {
        console.log("   ❌ Missing or zero total matches");
        issues++;
      }

      if (!data.summary) {
        console.log("   ❌ Missing summary data");
        issues++;
      } else {
        if (!data.summary.totalPlayers || data.summary.totalPlayers === 0) {
          console.log("   ❌ Missing or zero total players");
          issues++;
        } else {
          totalPlayers += data.summary.totalPlayers;
        }

        if (data.summary.completedMatches === 0 && data.totalMatches > 0) {
          console.log("   ⚠️ Warning: No matches completed despite having matches");
          issues++;
        }
      }

      if (!data.stats || Object.keys(data.stats).length === 0) {
        console.log("   ❌ Missing player statistics");
        issues++;
        reportsWithoutStats++;
      } else {
        reportsWithStats++;
        console.log(`   📊 Player Stats: ${Object.keys(data.stats).length} players`);
        
        // Display top performers
        const sortedStats = Object.entries(data.stats)
          .sort(([,a], [,b]) => (b as any).wins - (a as any).wins)
          .slice(0, 3);
        
        if (sortedStats.length > 0) {
          console.log("   🏆 Top Performers:");
          sortedStats.forEach(([player, stats]: [string, any]) => {
            console.log(`      ${player}: ${stats.wins}W-${stats.losses}L, ${stats.totalPoints} points`);
          });
        }
      }

      // Check for bracket snapshot
      if (!data.bracketSnapshot) {
        console.log("   ❌ Missing bracket snapshot");
        issues++;
      } else {
        console.log(`   ✅ Bracket snapshot preserved`);
      }

      // Check for competition ID
      if (!data.competitionId) {
        console.log("   ❌ Missing competition ID");
        issues++;
      }

      console.log(); // Empty line for readability
    }

    // Summary
    console.log("📊 Report Sanity Summary:");
    console.log(`   Total Reports: ${totalReports}`);
    console.log(`   Reports with Champions: ${reportsWithChampions}`);
    console.log(`   Reports without Champions: ${reportsWithoutChampions}`);
    console.log(`   Reports with Stats: ${reportsWithStats}`);
    console.log(`   Reports without Stats: ${reportsWithoutStats}`);
    console.log(`   Total Matches: ${totalMatches}`);
    console.log(`   Total Players: ${totalPlayers}`);
    console.log(`   Issues Found: ${issues}`);

    if (issues === 0) {
      console.log("\n✅ All reports are valid!");
    } else {
      console.log(`\n⚠️ ${issues} issues found in reports`);
    }

    // Additional insights
    if (totalReports > 0) {
      const avgMatchesPerReport = totalMatches / totalReports;
      const avgPlayersPerReport = totalPlayers / totalReports;
      const completionRate = reportsWithChampions / totalReports * 100;

      console.log("\n📈 Report Insights:");
      console.log(`   Average Matches per Report: ${avgMatchesPerReport.toFixed(1)}`);
      console.log(`   Average Players per Report: ${avgPlayersPerReport.toFixed(1)}`);
      console.log(`   Champion Completion Rate: ${completionRate.toFixed(1)}%`);
    }

  } catch (error) {
    console.error("❌ Error during report sanity check:", error);
    throw error;
  }
}

// Run directly
if (require.main === module) {
  sanityReports()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}