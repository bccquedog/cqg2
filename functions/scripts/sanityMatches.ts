import * as admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();

async function sanityCheckMatches() {
  try {
    console.log("🔍 Starting Match Sanity Check...\n");

    const snapshot = await db.collection("matches").get();
    if (snapshot.empty) {
      console.log("❌ No matches found");
      return;
    }

    console.log("✅ Matches in Firestore:\n");
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`⚔️ ${doc.id} | Format: ${data.format} | Teams: ${data.teams.length} | Winner: ${data.winnerTeamId}`);
      data.teams.forEach((team: any, index: number) => {
        console.log(`   Team ${index + 1}: ${team.teamId} (${team.clanId ? `Clan: ${team.clanId}` : 'Solo'}) | Players: ${team.players.join(", ")} | Score: ${team.score}`);
      });
      console.log(`   Stream: ${data.streamLink}`);
      console.log(`   Created: ${data.createdAt}`);
      console.log("");
    });

    // Summary by format
    const formatCounts = { "1v1": 0, "2v2": 0, "5v5": 0 };
    snapshot.forEach(doc => {
      const data = doc.data();
      formatCounts[data.format as keyof typeof formatCounts]++;
    });

    console.log("📊 Match Summary:");
    console.log(`   • Total matches: ${snapshot.size}`);
    console.log(`   • 1v1 matches: ${formatCounts["1v1"]}`);
    console.log(`   • 2v2 matches: ${formatCounts["2v2"]}`);
    console.log(`   • 5v5 matches: ${formatCounts["5v5"]}`);

    console.log("\n✅ Match sanity check completed successfully!");

  } catch (err) {
    console.error("❌ Match sanity check failed:", err);
  }
}

sanityCheckMatches();


