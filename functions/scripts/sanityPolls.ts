import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export async function sanityPolls(competitionId: string) {
  try {
    console.log(`📊 Checking polls for ${competitionId}...`);

    const now = new Date();
    const pollsSnap = await db
      .collection("tournaments")
      .doc(competitionId)
      .collection("polls")
      .orderBy("createdAt", "desc")
      .get();

    if (pollsSnap.empty) {
      console.log("⚠️ No polls found");
      return;
    }

    const batch = db.batch();
    let expiredCount = 0;
    let activeCount = 0;

    pollsSnap.forEach((doc) => {
      const data = doc.data();
      
      // Handle different timestamp formats
      let closesAt: Date | null = null;
      if (data.closesAt) {
        if (typeof data.closesAt.toDate === 'function') {
          closesAt = data.closesAt.toDate();
        } else if (typeof data.closesAt === 'string') {
          closesAt = new Date(data.closesAt);
        } else if (data.closesAt instanceof Date) {
          closesAt = data.closesAt;
        }
      }
      
      const totalVotes = Object.keys(data.votes || {}).length;
      const isExpired = closesAt && !isNaN(closesAt.getTime()) && closesAt < now;

      if (isExpired) {
        // Auto-prune expired poll
        batch.delete(doc.ref);
        expiredCount++;
        console.log(`🗑️ Expired poll deleted: ${data.question}`);
      } else {
        activeCount++;
        console.log(`\n📋 Poll: ${data.question}`);
        console.log(`   Type: ${data.type}`);
        console.log(`   Options: ${data.options.join(", ")}`);
        console.log(`   Total Votes: ${totalVotes}`);
        console.log(`   Closes At: ${closesAt && !isNaN(closesAt.getTime()) ? closesAt.toISOString() : 'Invalid/No closing time'}`);
        console.log(`   Poll ID: ${doc.id}`);

        // Show vote breakdown if there are votes
        if (data.votes && Object.keys(data.votes).length > 0) {
          const voteCounts: Record<string, number> = {};
          data.options.forEach((option: string) => {
            voteCounts[option] = 0;
          });
          
          Object.values(data.votes).forEach((vote: string) => {
            voteCounts[vote] = (voteCounts[vote] || 0) + 1;
          });

          console.log(`   Vote Breakdown:`);
          data.options.forEach((option: string) => {
            const count = voteCounts[option] || 0;
            const percentage = data.votes ? 
              Math.round((count / Object.keys(data.votes).length) * 100) : 0;
            console.log(`     ${option}: ${count} votes (${percentage}%)`);
          });
        }
      }
    });

    if (expiredCount > 0) {
      await batch.commit();
      console.log(`\n🗑️ Pruned ${expiredCount} expired polls.`);
    } else {
      console.log(`\n✅ No expired polls to prune.`);
    }

    console.log(`\n📊 Summary: ${activeCount} active polls, ${expiredCount} expired polls removed`);
    console.log(`✅ Poll sanity check completed for ${competitionId}`);

  } catch (error) {
    console.error(`❌ Error checking polls for ${competitionId}:`, error);
    throw error;
  }
}

// Run directly
if (require.main === module) {
  const compId = process.argv[2] || "soloCupS1";
  
  console.log(`📊 Starting poll sanity check for: ${compId}`);
  
  sanityPolls(compId)
    .then(() => {
      console.log("📊 Poll sanity check completed successfully!");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Poll sanity check failed:", err);
      process.exit(1);
    });
}
