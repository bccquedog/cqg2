import * as admin from "firebase-admin";
import { TournamentService } from "../src/services/tournamentService";

if (!admin.apps.length) {
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const tournamentService = new TournamentService();

async function sanityTournaments() {
  console.log("🔍 Tournament Sanity Check...\n");

  try {
    // Check tournaments collection
    const tournamentsSnap = await db.collection("tournaments").get();
    console.log(`📊 Total tournaments: ${tournamentsSnap.size}`);

    if (tournamentsSnap.empty) {
      console.log("⚠️ No tournaments found. Run seedTournaments.ts first.");
      return;
    }

    // Check each tournament
    for (const doc of tournamentsSnap.docs) {
      const tournament = { id: doc.id, ...doc.data() };
      console.log(`\n🏆 Tournament: ${tournament.name}`);
      console.log(`   ID: ${tournament.id}`);
      console.log(`   Game: ${tournament.game}`);
      console.log(`   Status: ${tournament.status}`);
      console.log(`   Type: ${tournament.type}`);
      console.log(`   Buy-in: $${tournament.buyIn}`);
      console.log(`   Max Players: ${tournament.settings?.maxPlayers || 'N/A'}`);
      console.log(`   Current Players: ${tournament.currentPlayers || 0}`);
      console.log(`   Prize Pool: $${tournament.prizePool || 0}`);
      console.log(`   Stream Required: ${tournament.settings?.streamRequired ? 'Yes' : 'No'}`);
      console.log(`   Disputes Allowed: ${tournament.settings?.disputesAllowed ? 'Yes' : 'No'}`);
      console.log(`   Created: ${tournament.createdAt}`);
      console.log(`   Updated: ${tournament.updatedAt}`);

      // Check participants
      const participantsSnap = await db.collection("tournamentParticipants")
        .where("tournamentId", "==", tournament.id)
        .get();
      console.log(`   Participants: ${participantsSnap.size}`);

      // Check matches
      const matchesSnap = await db.collection("tournamentMatches")
        .where("tournamentId", "==", tournament.id)
        .get();
      console.log(`   Matches: ${matchesSnap.size}`);

      // Check disputes
      const disputes = await tournamentService.getTournamentDisputes(tournament.id);
      console.log(`   Disputes: ${disputes.length}`);

      // Check prizes
      const prizes = await tournamentService.getTournamentPrizes(tournament.id);
      console.log(`   Prizes: ${prizes.length}`);
      if (prizes.length > 0) {
        const totalPrizePool = prizes.reduce((sum, prize) => sum + prize.amount, 0);
        console.log(`   Total Prize Pool: $${totalPrizePool}`);
      }

      // Check teams (for league tournaments)
      if (tournament.type === "league") {
        const teams = await tournamentService.getTournamentTeams(tournament.id);
        console.log(`   Teams: ${teams.length}`);
        if (teams.length > 0) {
          const checkedInTeams = teams.filter(team => team.checkedIn).length;
          console.log(`   Checked-in Teams: ${checkedInTeams}`);
          
          // Show team stats
          teams.forEach((team, index) => {
            if (index < 3) { // Show first 3 teams
              console.log(`     Team ${index + 1}: ${team.teamName} (${team.stats.wins}W-${team.stats.losses}L-${team.stats.draws}D)`);
            }
          });
        }
      }
    }

    // Check seasons
    const seasonsSnap = await db.collection("tournamentSeasons").get();
    console.log(`\n📅 Total seasons: ${seasonsSnap.size}`);

    for (const doc of seasonsSnap.docs) {
      const season = { id: doc.id, ...doc.data() };
      console.log(`\n📅 Season: ${season.name}`);
      console.log(`   ID: ${season.id}`);
      console.log(`   Year: ${season.year}`);
      console.log(`   Quarter: ${season.quarter}`);
      console.log(`   Status: ${season.status}`);
      console.log(`   Total Tournaments: ${season.totalTournaments}`);
      console.log(`   Total Prize Pool: $${season.totalPrizePool}`);
      console.log(`   Start Date: ${season.startDate}`);
      console.log(`   End Date: ${season.endDate}`);
    }

    // Get tournament statistics
    const activeTournaments = await tournamentService.getActiveTournaments();
    const upcomingTournaments = await tournamentService.getUpcomingTournaments();
    const completedTournaments = await tournamentService.getCompletedTournaments();

    console.log(`\n📊 Tournament Statistics:`);
    console.log(`   Active: ${activeTournaments.length}`);
    console.log(`   Upcoming: ${upcomingTournaments.length}`);
    console.log(`   Completed: ${completedTournaments.length}`);

    // Check for data consistency
    console.log(`\n🔍 Data Consistency Checks:`);
    
    // Check if tournament prize pools match their prizes
    let inconsistentPrizePools = 0;
    for (const doc of tournamentsSnap.docs) {
      const tournament = { id: doc.id, ...doc.data() };
      const prizes = await tournamentService.getTournamentPrizes(tournament.id);
      const calculatedPrizePool = prizes.reduce((sum, prize) => sum + prize.amount, 0);
      
      if (tournament.prizePool !== calculatedPrizePool) {
        console.log(`   ⚠️ Tournament ${tournament.name}: Prize pool mismatch (stored: $${tournament.prizePool}, calculated: $${calculatedPrizePool})`);
        inconsistentPrizePools++;
      }
    }

    if (inconsistentPrizePools === 0) {
      console.log(`   ✅ All tournament prize pools are consistent`);
    }

    // Check for tournaments with no participants
    let tournamentsWithoutParticipants = 0;
    for (const doc of tournamentsSnap.docs) {
      const tournament = { id: doc.id, ...doc.data() };
      const participantsSnap = await db.collection("tournamentParticipants")
        .where("tournamentId", "==", tournament.id)
        .get();
      
      if (participantsSnap.empty && tournament.status !== "upcoming") {
        console.log(`   ⚠️ Tournament ${tournament.name} has no participants but is not upcoming`);
        tournamentsWithoutParticipants++;
      }
    }

    if (tournamentsWithoutParticipants === 0) {
      console.log(`   ✅ All active/live tournaments have participants`);
    }

    // Check for open disputes
    const allDisputes: any[] = [];
    for (const doc of tournamentsSnap.docs) {
      const tournament = { id: doc.id, ...doc.data() };
      const disputes = await tournamentService.getTournamentDisputes(tournament.id);
      allDisputes.push(...disputes);
    }

    const openDisputes = allDisputes.filter(dispute => 
      dispute.status === "open" || dispute.status === "under_review"
    );

    console.log(`   📋 Total disputes: ${allDisputes.length}`);
    console.log(`   🔴 Open disputes: ${openDisputes.length}`);

    if (openDisputes.length > 0) {
      console.log(`   ⚠️ Open disputes that need attention:`);
      openDisputes.forEach(dispute => {
        console.log(`      - Match ${dispute.matchId}: ${dispute.reason} (${dispute.status})`);
      });
    }

    console.log(`\n✅ Tournament sanity check completed successfully!`);

  } catch (error) {
    console.error("❌ Error during tournament sanity check:", error);
    throw error;
  }
}

// Run the sanity check
sanityTournaments()
  .then(() => {
    console.log("\n✅ Tournament sanity check completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Tournament sanity check failed:", error);
    process.exit(1);
  });