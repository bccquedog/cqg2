import * as admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json";
import { issueTicket } from "../utils/tickets";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: serviceAccount.project_id,
  });
}

async function issueBracketTickets() {
  console.log("🎟 Issuing new tickets for bracket matches...\n");

  try {
    // Issue tickets for R1M1 (user1 vs user2)
    console.log("📝 Issuing ticket for user1 in R1M1...");
    const ticket1 = await issueTicket("user1", "soloCupS1", "R1M1", 120); // 2 hours
    console.log("✅ Ticket issued:", ticket1);

    console.log("📝 Issuing ticket for user2 in R1M1...");
    const ticket2 = await issueTicket("user2", "soloCupS1", "R1M1", 120); // 2 hours
    console.log("✅ Ticket issued:", ticket2);

    // Issue tickets for R1M2 (user3 vs user4)
    console.log("📝 Issuing ticket for user3 in R1M2...");
    const ticket3 = await issueTicket("user3", "soloCupS1", "R1M2", 120); // 2 hours
    console.log("✅ Ticket issued:", ticket3);

    console.log("📝 Issuing ticket for user4 in R1M2...");
    const ticket4 = await issueTicket("user4", "soloCupS1", "R1M2", 120); // 2 hours
    console.log("✅ Ticket issued:", ticket4);

    console.log("\n🎉 All bracket tickets issued successfully!");
    console.log("💡 You can now test score submissions with these new ticket codes");

  } catch (error) {
    console.error("❌ Error issuing tickets:", error);
  }
}

issueBracketTickets();


