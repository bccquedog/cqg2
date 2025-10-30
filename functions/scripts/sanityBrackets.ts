import * as admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();

export async function sanityBrackets() {
  console.log("🏆 Running Bracket Sanity Check...");

  const competitions = ["tournaments", "leagues"];
  let issues = 0;
  let totalBrackets = 0;

  for (const col of competitions) {
    const snapshot = await db.collectionGroup("bracket").get();
    for (const doc of snapshot.docs) {
      const data = doc.data();
      totalBrackets++;

      console.log(`\nBracket: ${doc.ref.path}`);
      console.log(`   Type: ${data.bracketType || 'undefined'}`);
      console.log(`   Current Round: ${data.currentRound || 'undefined'}`);

      // Check if this bracket has the expected structure
      if (!data.rounds || !Array.isArray(data.rounds)) {
        console.log("   ⚠️ No rounds array found or invalid structure");
        issues++;
        continue;
      }

      data.rounds.forEach((round: any, roundIndex: number) => {
        if (!round.matches || !Array.isArray(round.matches)) {
          console.log(`   ⚠️ Round ${roundIndex + 1}: No matches array found`);
          issues++;
          return;
        }

        round.matches.forEach((match: any, matchIndex: number) => {
          console.log(`   Match ${match.matchId || `R${roundIndex + 1}M${matchIndex + 1}`} → Players: ${match.players ? match.players.join(" vs ") : 'No players'}`);

          if (match.status === "completed" && !match.winner) {
            console.log("      ⚠️ Completed match without winner!");
            issues++;
          }

          if (match.players && match.players.length !== 2) {
            console.log("      ⚠️ Invalid player count (should be 2)");
            issues++;
          }

          if (match.ticketCodes) {
            for (const [uid, code] of Object.entries(match.ticketCodes)) {
              if (!code) {
                console.log(`      ⚠️ Missing ticket code for ${uid}`);
                issues++;
              }
            }
          }
        });
      });
    }
  }

  console.log(`\n📌 Bracket Sanity Summary:`);
  console.log(`   Total Brackets: ${totalBrackets}`);
  console.log(`   Issues Found: ${issues}`);
  
  if (issues === 0) {
    console.log("   ✅ All brackets are valid!");
  } else {
    console.log(`   ⚠️ ${issues} issues need attention`);
  }
}

// Run script if executed directly
if (require.main === module) {
  sanityBrackets()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}