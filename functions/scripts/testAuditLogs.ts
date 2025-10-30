import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function testAuditLogs() {
  console.log("🔍 Testing Audit Logs...\n");

  try {
    // Check if audit logs collection exists and has data
    const auditLogsSnap = await db.collection("auditLogs").limit(5).get();
    
    if (auditLogsSnap.empty) {
      console.log("⚠️ No audit logs found yet.");
      console.log("💡 Try making some changes in the admin dashboard to generate audit logs.");
    } else {
      console.log(`✅ Found ${auditLogsSnap.docs.length} audit log entries:`);
      
      auditLogsSnap.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\n${index + 1}. ${data.action}`);
        console.log(`   Admin ID: ${data.adminId}`);
        console.log(`   Role: ${data.role || "N/A"}`);
        console.log(`   Details: ${JSON.stringify(data.details, null, 2)}`);
        console.log(`   Created: ${data.createdAt?.toDate?.() || data.createdAt}`);
      });
    }
  } catch (err) {
    console.error("❌ Error checking audit logs:", err);
  }
}

if (require.main === module) {
  testAuditLogs()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
