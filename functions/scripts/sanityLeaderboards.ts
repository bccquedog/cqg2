import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export async function sanityLeaderboards() {
  console.log("📊 Running Leaderboard Sanity Check...\n");

  try {
    const leaderboards = await db.collection("leaderboards").get();
    
    if (leaderboards.empty) {
      console.log("⚠️ No leaderboards found");
      return;
    }

    let totalLeaderboards = 0;
    let totalPlayers = 0;
    let warnings = 0;
    let errors = 0;

    console.log(`Found ${leaderboards.docs.length} leaderboards\n`);

    for (const col of leaderboards.docs) {
      const leaderboardId = col.id;
      totalLeaderboards++;

      console.log(`📊 Leaderboard: ${leaderboardId}`);

      try {
        const players = await col.ref.collection("players").get();
        console.log(`   Players = ${players.size}`);
        totalPlayers += players.size;

        players.forEach((p) => {
          const data = p.data();
          const playerId = p.id;

          // Basic validation checks
          if (data.wins + data.losses === 0) {
            console.log(`   ⚠️ ${playerId} has no matches recorded`);
            warnings++;
          }

          if (data.totalPoints < 0) {
            console.log(`   ❌ Negative points for ${playerId}`);
            errors++;
          }

          // Display basic stats
          console.log(`   📈 ${playerId}: ${data.wins}W-${data.losses}L, ${data.totalPoints} points`);
        });

      } catch (playerError) {
        console.log(`   ❌ Error accessing players collection: ${playerError}`);
        errors++;
      }

      console.log(); // Empty line for readability
    }

    // Summary
    console.log("📊 Leaderboard Sanity Summary:");
    console.log(`   Total Leaderboards: ${totalLeaderboards}`);
    console.log(`   Total Players: ${totalPlayers}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Warnings: ${warnings}`);

    if (errors === 0 && warnings === 0) {
      console.log("\n✅ All leaderboards are valid!");
    } else if (errors === 0) {
      console.log(`\n⚠️ ${warnings} warnings found in leaderboards`);
    } else {
      console.log(`\n❌ ${errors} errors and ${warnings} warnings found in leaderboards`);
    }

  } catch (error) {
    console.error("❌ Error during leaderboard sanity check:", error);
    throw error;
  }
}

// Run directly
if (require.main === module) {
  sanityLeaderboards()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}