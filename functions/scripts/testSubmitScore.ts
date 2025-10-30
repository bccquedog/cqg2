import * as admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json";
import { submitScore } from "../submitScore";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: serviceAccount.project_id,
  });
}

async function testSubmitScore() {
  console.log("🏆 Testing Score Submission System...\n");

  try {
    // Test submitting scores for the seeded bracket
    console.log("📝 Submitting score for user1 in R1M1...");
    const result1 = await submitScore(
      "user1",
      "soloCupS1", 
      "R1M1",
      "R7IN2K84EJ", // New ticket code
      25
    );
    console.log("✅ Result:", result1);

    console.log("\n📝 Submitting score for user2 in R1M1...");
    const result2 = await submitScore(
      "user2",
      "soloCupS1",
      "R1M1", 
      "QJRRHL1NR4", // New ticket code
      18
    );
    console.log("✅ Result:", result2);

    console.log("\n📝 Submitting score for user3 in R1M2...");
    const result3 = await submitScore(
      "user3",
      "soloCupS1",
      "R1M2",
      "FU09PBD3GR", // New ticket code
      22
    );
    console.log("✅ Result:", result3);

    console.log("\n📝 Submitting score for user4 in R1M2...");
    const result4 = await submitScore(
      "user4",
      "soloCupS1",
      "R1M2",
      "OBVTTF0530", // New ticket code
      20
    );
    console.log("✅ Result:", result4);

    console.log("\n🎉 All score submissions completed successfully!");
    console.log("💡 Check the bracket with: pnpm sanity:brackets");

  } catch (error) {
    console.error("❌ Error during score submission:", error);
  }
}

testSubmitScore();
