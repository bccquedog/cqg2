import * as admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json";
import { issueTicket, validateTicket, revokeTicket } from "../utils/tickets";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: serviceAccount.project_id,
  });
}

async function exampleTicketUsage() {
  console.log("🎟 Ticket Utilities Example Usage\n");

  try {
    // Example 1: Issue a ticket for a tournament match
    console.log("📝 Example 1: Issuing a tournament ticket");
    const tournamentTicket = await issueTicket("user1", "soloCupS1", "R1", 30); // 30 minutes TTL
    console.log(`   Ticket Code: ${tournamentTicket.code}`);
    console.log(`   Ticket ID: ${tournamentTicket.id}`);
    console.log(`   User: user1`);
    console.log(`   Competition: soloCupS1`);
    console.log(`   Round: R1`);
    console.log(`   Expires: 30 minutes from now\n`);

    // Example 2: Issue a ticket for a league match
    console.log("📝 Example 2: Issuing a league ticket");
    const leagueTicket = await issueTicket("user2", "soloLeagueS1", "Week1", 60); // 60 minutes TTL
    console.log(`   Ticket Code: ${leagueTicket.code}`);
    console.log(`   Ticket ID: ${leagueTicket.id}`);
    console.log(`   User: user2`);
    console.log(`   Competition: soloLeagueS1`);
    console.log(`   Round: Week1`);
    console.log(`   Expires: 60 minutes from now\n`);

    // Example 3: Validate tickets
    console.log("🔍 Example 3: Validating tickets");
    const isValidTournament = await validateTicket(tournamentTicket.code, "soloCupS1");
    const isValidLeague = await validateTicket(leagueTicket.code, "soloLeagueS1");
    console.log(`   Tournament ticket valid: ${isValidTournament ? "✅ YES" : "❌ NO"}`);
    console.log(`   League ticket valid: ${isValidLeague ? "✅ YES" : "❌ NO"}\n`);

    // Example 4: Try to use ticket for wrong competition
    console.log("🚫 Example 4: Wrong competition validation");
    const wrongComp = await validateTicket(tournamentTicket.code, "wrongCompetition");
    console.log(`   Tournament ticket for wrong competition: ${wrongComp ? "✅ VALID" : "❌ INVALID"} (should be INVALID)\n`);

    // Example 5: Revoke a ticket
    console.log("🗑️ Example 5: Revoking a ticket");
    const revoked = await revokeTicket(tournamentTicket.code, "soloCupS1");
    console.log(`   Ticket revocation successful: ${revoked ? "✅ YES" : "❌ NO"}`);
    
    // Check if revoked ticket is still valid
    const isValidAfterRevoke = await validateTicket(tournamentTicket.code, "soloCupS1");
    console.log(`   Revoked ticket still valid: ${isValidAfterRevoke ? "✅ YES" : "❌ NO"} (should be NO)\n`);

    console.log("✅ Example completed! Check the tickets collection in Firestore to see the created tickets.");

  } catch (error) {
    console.error("❌ Error in example:", error);
  }
}

exampleTicketUsage();


