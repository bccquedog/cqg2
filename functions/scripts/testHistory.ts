import * as admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();

async function createTestHistoryLogs() {
  try {
    console.log("🧪 Creating test history logs...\n");

    const historyRef = db.collection("adminControls").doc("featureToggles").collection("history");

    // Create some test history logs for different features
    const testLogs = [
      {
        feature: "autoTournaments",
        oldValue: false,
        newValue: true,
        updatedAt: admin.firestore.Timestamp.now(),
        updatedBy: "admin123"
      },
      {
        feature: "autoTournaments",
        oldValue: true,
        newValue: false,
        updatedAt: admin.firestore.Timestamp.now(),
        updatedBy: "admin456"
      },
      {
        feature: "clanTournaments",
        oldValue: false,
        newValue: true,
        updatedAt: admin.firestore.Timestamp.now(),
        updatedBy: "admin789"
      },
      {
        feature: "clanTournaments",
        oldValue: true,
        newValue: false,
        updatedAt: admin.firestore.Timestamp.now(),
        updatedBy: "admin123"
      },
      {
        feature: "clanTournaments",
        oldValue: false,
        newValue: true,
        updatedAt: admin.firestore.Timestamp.now(),
        updatedBy: "admin456"
      },
      {
        feature: "merchStore",
        oldValue: false,
        newValue: true,
        updatedAt: admin.firestore.Timestamp.now(),
        updatedBy: "admin789"
      }
    ];

    for (const log of testLogs) {
      await historyRef.add(log);
    }

    console.log(`✅ Created ${testLogs.length} test history logs`);
    console.log("   • autoTournaments: 2 logs");
    console.log("   • clanTournaments: 3 logs");
    console.log("   • merchStore: 1 log");
    console.log("   • clipUploads: 0 logs");

  } catch (err) {
    console.error("❌ Error creating test history logs:", err);
  }
}

createTestHistoryLogs();


