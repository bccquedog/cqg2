import * as admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json";
import { sanityTickets } from "./sanityTickets";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: serviceAccount.project_id,
  });
}

async function exampleUsage() {
  console.log("📋 Example: Importing and using sanityTickets function\n");
  
  try {
    // Import and use the sanity function
    await sanityTickets();
    
    console.log("\n✅ Successfully imported and executed sanityTickets function!");
    console.log("💡 This demonstrates how to use the function in other scripts.");
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

exampleUsage();


