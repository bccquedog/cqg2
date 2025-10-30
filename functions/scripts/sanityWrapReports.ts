import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function sanityWrapReports() {
  console.log("🏆 Sanity Check: Wrap Reports\n");

  let totalReports = 0;
  let totalTournaments = 0;
  let totalLeagues = 0;
  let reportsWithChampions = 0;
  let reportsWithoutChampions = 0;
  let totalMatches = 0;
  let totalPlayers = 0;
  let warnings = 0;

  try {
    // Check tournaments
    console.log("🏆 Checking Tournament Wrap Reports...");
    const tournamentsSnapshot = await db.collection("tournaments").get();
    
    for (const tournamentDoc of tournamentsSnapshot.docs) {
      const tournamentId = tournamentDoc.id;
      const tournamentData = tournamentDoc.data();
      totalTournaments++;

      console.log(`\n📋 Tournament: ${tournamentData.name || "Unknown"} (${tournamentId})`);

      // Check for wrap report
      const wrapReportRef = db.collection("tournaments").doc(tournamentId).collection("reports").doc("final");
      const wrapReportSnap = await wrapReportRef.get();

      if (wrapReportSnap.exists) {
        const report = wrapReportSnap.data();
        totalReports++;

        console.log(`   ✅ Wrap report found`);
        console.log(`   Champion: ${report?.champion || "No champion"}`);
        console.log(`   Completed: ${report?.completedAt || "Unknown"}`);
        console.log(`   Total Matches: ${report?.totalMatches || 0}`);
        console.log(`   Total Players: ${report?.summary?.totalPlayers || 0}`);
        console.log(`   Completed Matches: ${report?.summary?.completedMatches || 0}`);

        // Statistics
        if (report?.champion) {
          reportsWithChampions++;
        } else {
          reportsWithoutChampions++;
        }

        totalMatches += report?.totalMatches || 0;
        totalPlayers += report?.summary?.totalPlayers || 0;

        // Validation checks
        if (!report?.completedAt) {
          console.log(`   ⚠️ Warning: Missing completion timestamp`);
          warnings++;
        }

        if (!report?.champion && report?.totalMatches > 0) {
          console.log(`   ⚠️ Warning: Tournament has matches but no champion`);
          warnings++;
        }

        if (report?.totalMatches === 0) {
          console.log(`   ⚠️ Warning: Tournament has no matches`);
          warnings++;
        }

        if (report?.summary?.completedMatches === 0 && report?.totalMatches > 0) {
          console.log(`   ⚠️ Warning: No matches completed`);
          warnings++;
        }

        // Display player statistics
        if (report?.stats && Object.keys(report.stats).length > 0) {
          console.log(`   📊 Player Stats:`);
          Object.entries(report.stats).forEach(([player, stats]: [string, any]) => {
            console.log(`      ${player}: ${stats.wins}W-${stats.losses}L, ${stats.totalPoints} points`);
          });
        }

      } else {
        console.log(`   ❌ No wrap report found`);
        warnings++;
      }
    }

    // Check leagues
    console.log("\n🏅 Checking League Wrap Reports...");
    const leaguesSnapshot = await db.collection("leagues").get();
    
    for (const leagueDoc of leaguesSnapshot.docs) {
      const leagueId = leagueDoc.id;
      const leagueData = leagueDoc.data();
      totalLeagues++;

      console.log(`\n📋 League: ${leagueData.name || "Unknown"} (${leagueId})`);

      // Check for wrap report
      const wrapReportRef = db.collection("leagues").doc(leagueId).collection("reports").doc("final");
      const wrapReportSnap = await wrapReportRef.get();

      if (wrapReportSnap.exists) {
        const report = wrapReportSnap.data();
        totalReports++;

        console.log(`   ✅ Wrap report found`);
        console.log(`   Champion: ${report?.champion || "No champion"}`);
        console.log(`   Completed: ${report?.completedAt || "Unknown"}`);
        console.log(`   Total Matches: ${report?.totalMatches || 0}`);
        console.log(`   Total Players: ${report?.summary?.totalPlayers || 0}`);
        console.log(`   Completed Matches: ${report?.summary?.completedMatches || 0}`);

        // Statistics
        if (report?.champion) {
          reportsWithChampions++;
        } else {
          reportsWithoutChampions++;
        }

        totalMatches += report?.totalMatches || 0;
        totalPlayers += report?.summary?.totalPlayers || 0;

        // Validation checks
        if (!report?.completedAt) {
          console.log(`   ⚠️ Warning: Missing completion timestamp`);
          warnings++;
        }

        if (!report?.champion && report?.totalMatches > 0) {
          console.log(`   ⚠️ Warning: League has matches but no champion`);
          warnings++;
        }

        if (report?.totalMatches === 0) {
          console.log(`   ⚠️ Warning: League has no matches`);
          warnings++;
        }

        if (report?.summary?.completedMatches === 0 && report?.totalMatches > 0) {
          console.log(`   ⚠️ Warning: No matches completed`);
          warnings++;
        }

        // Display player statistics
        if (report?.stats && Object.keys(report.stats).length > 0) {
          console.log(`   📊 Player Stats:`);
          Object.entries(report.stats).forEach(([player, stats]: [string, any]) => {
            console.log(`      ${player}: ${stats.wins}W-${stats.losses}L, ${stats.totalPoints} points`);
          });
        }

      } else {
        console.log(`   ❌ No wrap report found`);
        warnings++;
      }
    }

    // Summary
    console.log("\n📊 Wrap Reports Summary:");
    console.log(`   Total Tournaments: ${totalTournaments}`);
    console.log(`   Total Leagues: ${totalLeagues}`);
    console.log(`   Total Competitions: ${totalTournaments + totalLeagues}`);
    console.log(`   Wrap Reports Found: ${totalReports}`);
    console.log(`   Reports with Champions: ${reportsWithChampions}`);
    console.log(`   Reports without Champions: ${reportsWithoutChampions}`);
    console.log(`   Total Matches: ${totalMatches}`);
    console.log(`   Total Players: ${totalPlayers}`);
    console.log(`   Warnings: ${warnings}`);

    if (warnings === 0) {
      console.log("\n✅ All wrap reports are valid!");
    } else {
      console.log(`\n⚠️ ${warnings} warnings found in wrap reports`);
    }

  } catch (error) {
    console.error("❌ Error during wrap reports sanity check:", error);
  }
}

// Run the sanity check
sanityWrapReports().catch(console.error);


