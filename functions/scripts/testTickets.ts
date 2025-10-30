import * as admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json";
import { issueTicket, validateTicket, revokeTicket } from "../utils/tickets";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: serviceAccount.project_id,
  });
}

async function testTicketUtilities() {
  console.log("🎟 Testing Ticket Utilities...\n");

  try {
    // Test 1: Issue a ticket
    console.log("1️⃣ Testing ticket issuance...");
    const { id, code } = await issueTicket("user1", "soloCupS1", "R1", 5); // 5 minutes TTL
    console.log(`   ✅ Ticket issued: ${code} (ID: ${id})`);

    // Test 2: Validate the ticket
    console.log("\n2️⃣ Testing ticket validation...");
    const isValid = await validateTicket(code, "soloCupS1");
    console.log(`   ✅ Ticket validation: ${isValid ? "VALID" : "INVALID"}`);

    // Test 3: Try to validate with wrong competition
    console.log("\n3️⃣ Testing validation with wrong competition...");
    const isValidWrongComp = await validateTicket(code, "wrongCompetition");
    console.log(`   ✅ Wrong competition validation: ${isValidWrongComp ? "VALID" : "INVALID"} (should be INVALID)`);

    // Test 4: Revoke the ticket
    console.log("\n4️⃣ Testing ticket revocation...");
    const revoked = await revokeTicket(code, "soloCupS1");
    console.log(`   ✅ Ticket revocation: ${revoked ? "SUCCESS" : "FAILED"}`);

    // Test 5: Validate revoked ticket
    console.log("\n5️⃣ Testing validation of revoked ticket...");
    const isValidAfterRevoke = await validateTicket(code, "soloCupS1");
    console.log(`   ✅ Revoked ticket validation: ${isValidAfterRevoke ? "VALID" : "INVALID"} (should be INVALID)`);

    // Test 6: Issue another ticket and test expiration
    console.log("\n6️⃣ Testing ticket expiration...");
    const { code: expiringCode } = await issueTicket("user2", "soloLeagueS1", "Week1", 1); // 1 minute TTL
    console.log(`   ✅ Expiring ticket issued: ${expiringCode}`);
    console.log("   ⏰ Waiting 70 seconds for ticket to expire...");
    
    // Wait 70 seconds
    await new Promise(resolve => setTimeout(resolve, 70000));
    
    const isValidAfterExpire = await validateTicket(expiringCode, "soloLeagueS1");
    console.log(`   ✅ Expired ticket validation: ${isValidAfterExpire ? "VALID" : "INVALID"} (should be INVALID)`);

    console.log("\n✅ All ticket utility tests completed!");

  } catch (error) {
    console.error("❌ Error testing ticket utilities:", error);
  }
}

testTicketUtilities();


