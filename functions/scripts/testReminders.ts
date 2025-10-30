import * as admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json";
import { sendCompetitionReminders } from "../reminders";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: serviceAccount.project_id,
  });
}

async function testReminders() {
  console.log("🔔 Testing Competition Reminders System...\n");

  try {
    // Run the reminders check
    await sendCompetitionReminders();
    
    console.log("\n✅ Reminders test completed successfully!");
    console.log("💡 Check the reminderLogs collection in Firestore to see sent reminders");
    
  } catch (error) {
    console.error("❌ Error during reminders test:", error);
  }
}

testReminders();