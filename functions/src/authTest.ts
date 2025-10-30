import * as admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json";

// Initialize Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

async function testAuth() {
  try {
    const projectId = (serviceAccount as any).project_id;
    console.log("✅ Using projectId from service account:", projectId);

    // Verify access by listing collections (empty if no data yet)
    const db = admin.firestore();
    const collections = await db.listCollections();
    console.log("✅ Connected to Firestore. Collections:", collections.map(c => c.id));
  } catch (err) {
    console.error("❌ Auth test failed:", err);
  }
}

testAuth();


