import * as admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json";
import { sanityBrackets } from "./sanityBrackets";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: serviceAccount.project_id,
  });
}

async function exampleBracketUsage() {
  console.log("🏆 Example: Bracket System Usage\n");
  
  try {
    // Run the sanity check to show current bracket status
    await sanityBrackets();
    
    console.log("\n💡 This demonstrates the bracket system functionality:");
    console.log("   • Tournament brackets with single elimination and round robin formats");
    console.log("   • League brackets with fixtures and standings");
    console.log("   • Match/fixture tracking with scores and winners");
    console.log("   • Comprehensive validation and sanity checking");
    console.log("   • Support for both solo and clan competitions");
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

exampleBracketUsage();


