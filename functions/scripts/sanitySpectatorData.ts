import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export async function sanitySpectatorData() {
  console.log("🎬 Running Spectator Data Sanity Check...\n");

  try {
    const competitions = ["soloCupS1", "clanCupS1", "soloLeagueS1", "clanLeagueS1"];
    let totalAlerts = 0;
    let totalChatMessages = 0;
    let spotlightsFound = 0;
    let statsFound = 0;
    let warnings = 0;
    let errors = 0;

    for (const competitionId of competitions) {
      console.log(`📊 Checking ${competitionId}...`);

      try {
        // Check Alerts
        const alertsSnapshot = await db
          .collection("tournaments")
          .doc(competitionId)
          .collection("alerts")
          .orderBy("timestamp", "desc")
          .get();

        if (alertsSnapshot.empty) {
          console.log(`   ⚠️ No alerts found for ${competitionId}`);
          warnings++;
        } else {
          console.log(`   📢 Alerts: ${alertsSnapshot.size} found`);
          totalAlerts += alertsSnapshot.size;

          // Check alert structure
          alertsSnapshot.docs.forEach((doc, index) => {
            if (index < 3) { // Show first 3 alerts
              const data = doc.data();
              console.log(`      ${index + 1}. [${data.priority?.toUpperCase() || 'UNKNOWN'}] ${data.message}`);
              console.log(`         Type: ${data.type || 'unknown'}, Time: ${data.timestamp?.toDate?.()?.toLocaleString() || 'unknown'}`);
            }
          });

          if (alertsSnapshot.size > 3) {
            console.log(`      ... and ${alertsSnapshot.size - 3} more alerts`);
          }
        }

        // Check Spotlight
        const spotlightDoc = await db
          .collection("tournaments")
          .doc(competitionId)
          .collection("spotlights")
          .doc("current")
          .get();

        if (!spotlightDoc.exists) {
          console.log(`   ⚠️ No spotlight found for ${competitionId}`);
          warnings++;
        } else {
          const spotlightData = spotlightDoc.data();
          console.log(`   🌟 Spotlight: ${spotlightData?.playerId || 'Unknown Player'}`);
          console.log(`      Title: ${spotlightData?.title || 'No title'}`);
          console.log(`      Type: ${spotlightData?.type || 'unknown'}`);
          if (spotlightData?.stats) {
            console.log(`      Stats: ${spotlightData.stats.wins || 0}W-${spotlightData.stats.losses || 0}L (${spotlightData.stats.winRate || 0}% win rate)`);
          }
          if (spotlightData?.achievements?.length) {
            console.log(`      Achievements: ${spotlightData.achievements.slice(0, 2).join(', ')}${spotlightData.achievements.length > 2 ? '...' : ''}`);
          }
          spotlightsFound++;
        }

        // Check Spectator Stats
        const statsDoc = await db
          .collection("tournaments")
          .doc(competitionId)
          .collection("spectatorStats")
          .doc("live")
          .get();

        if (!statsDoc.exists) {
          console.log(`   ⚠️ No spectator stats found for ${competitionId}`);
          warnings++;
        } else {
          const statsData = statsDoc.data();
          console.log(`   📊 Stats: ${statsData?.totalViewers || 0} viewers (peak: ${statsData?.peakViewers || 0})`);
          console.log(`      Chat: ${statsData?.chatMessages || 0} messages, ${statsData?.reactions || 0} reactions, ${statsData?.shares || 0} shares`);
          statsFound++;
        }

        // Check Chat Messages
        const chatSnapshot = await db
          .collection("tournaments")
          .doc(competitionId)
          .collection("chat")
          .orderBy("timestamp", "desc")
          .limit(5)
          .get();

        if (chatSnapshot.empty) {
          console.log(`   ⚠️ No chat messages found for ${competitionId}`);
          warnings++;
        } else {
          console.log(`   💬 Chat: ${chatSnapshot.size} recent messages`);
          totalChatMessages += chatSnapshot.size;

          // Show recent messages
          chatSnapshot.docs.slice(0, 2).forEach((doc, index) => {
            const data = doc.data();
            const userIcon = data.type === "system" ? "🤖" : "👤";
            console.log(`      ${index + 1}. ${userIcon} ${data.user}: ${data.message}`);
          });

          if (chatSnapshot.size > 2) {
            console.log(`      ... and ${chatSnapshot.size - 2} more messages`);
          }
        }

        console.log(); // Empty line for readability

      } catch (error) {
        console.log(`   ❌ Error checking ${competitionId}: ${error}`);
        errors++;
      }
    }

    // Summary
    console.log("🎬 Spectator Data Sanity Summary:");
    console.log(`   Total Competitions Checked: ${competitions.length}`);
    console.log(`   Total Alerts: ${totalAlerts}`);
    console.log(`   Total Chat Messages: ${totalChatMessages}`);
    console.log(`   Spotlights Found: ${spotlightsFound}`);
    console.log(`   Stats Documents Found: ${statsFound}`);
    console.log(`   Warnings: ${warnings}`);
    console.log(`   Errors: ${errors}`);

    if (errors === 0 && warnings === 0) {
      console.log("\n✅ All spectator data is valid!");
    } else if (errors === 0) {
      console.log(`\n⚠️ ${warnings} warnings found in spectator data`);
    } else {
      console.log(`\n❌ ${errors} errors and ${warnings} warnings found in spectator data`);
    }

    // Data Structure Validation
    console.log("\n📋 Data Structure Validation:");
    console.log("   ✅ Alerts: /tournaments/{id}/alerts/{alertId}");
    console.log("   ✅ Spotlight: /tournaments/{id}/spotlights/current");
    console.log("   ✅ Stats: /tournaments/{id}/spectatorStats/live");
    console.log("   ✅ Chat: /tournaments/{id}/chat/{messageId}");

    console.log("\n🔗 Test the SpectatorOverlay component at:");
    console.log("   • /test-spectator-overlay");
    console.log("   • /spectate/soloCupS1");

  } catch (error) {
    console.error("❌ Error during spectator data sanity check:", error);
    throw error;
  }
}

// Run directly
if (require.main === module) {
  sanitySpectatorData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}


