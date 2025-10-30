import * as admin from "firebase-admin";
import { TournamentService } from "../src/services/tournamentService";
import { Tournament, TournamentSeason, TournamentPrize } from "../src/types/tournament";

if (!admin.apps.length) {
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const tournamentService = new TournamentService();

async function seedTournaments() {
  console.log("🏆 Seeding Tournaments...\n");

  try {
    // First, create a season
    const seasonId = await tournamentService.createSeason({
      name: "2025 Q1 Season",
      year: 2025,
      quarter: 1,
      startDate: "2025-01-01T00:00:00Z",
      endDate: "2025-03-31T23:59:59Z",
      status: "active",
      totalTournaments: 0,
      totalPrizePool: 0,
    });

    console.log(`✅ Created season: ${seasonId}`);

    // Sample tournaments
    const tournaments: Omit<Tournament, "id" | "createdAt" | "updatedAt">[] = [
      {
        name: "Madden Kickoff Cup",
        game: "Madden 25",
        status: "upcoming",
        type: "single_elim",
        seasonId,
        buyIn: 10,
        settings: {
          maxPlayers: 64,
          streamRequired: true,
          disputesAllowed: true,
          registrationDeadline: "2025-01-15T23:59:59Z",
          checkInRequired: true,
          checkInDuration: 30,
          matchTimeLimit: 60,
          breakTimeBetweenMatches: 15,
          allowLateRegistration: false,
          requireVerification: true,
          customRules: "Standard Madden 25 rules apply. No glitch plays allowed.",
        },
        description: "The ultimate Madden 25 tournament to kick off the 2025 season!",
        startDate: "2025-01-20T18:00:00Z",
        endDate: "2025-01-20T23:00:00Z",
        maxPlayers: 64,
        currentPlayers: 0,
        prizePool: 0,
      },
      {
        name: "FIFA Champions League",
        game: "FIFA 25",
        status: "live",
        type: "double_elim",
        seasonId,
        buyIn: 25,
        settings: {
          maxPlayers: 32,
          streamRequired: true,
          disputesAllowed: true,
          registrationDeadline: "2025-01-10T23:59:59Z",
          checkInRequired: true,
          checkInDuration: 45,
          matchTimeLimit: 90,
          breakTimeBetweenMatches: 20,
          allowLateRegistration: false,
          requireVerification: true,
          customRules: "FIFA 25 Ultimate Team rules. No custom tactics allowed.",
        },
        description: "Double elimination FIFA 25 tournament with premium prizes!",
        startDate: "2025-01-15T19:00:00Z",
        endDate: "2025-01-15T23:30:00Z",
        maxPlayers: 32,
        currentPlayers: 28,
        prizePool: 700,
      },
      {
        name: "Rocket League Grand Prix",
        game: "Rocket League",
        status: "completed",
        type: "swiss",
        seasonId,
        buyIn: 15,
        settings: {
          maxPlayers: 16,
          streamRequired: false,
          disputesAllowed: true,
          registrationDeadline: "2025-01-05T23:59:59Z",
          checkInRequired: true,
          checkInDuration: 20,
          matchTimeLimit: 15,
          breakTimeBetweenMatches: 5,
          allowLateRegistration: true,
          requireVerification: false,
          customRules: "3v3 Standard rules. No mutators allowed.",
        },
        description: "Swiss format Rocket League tournament with quick matches!",
        startDate: "2025-01-10T20:00:00Z",
        endDate: "2025-01-10T22:00:00Z",
        maxPlayers: 16,
        currentPlayers: 16,
        prizePool: 240,
        winner: "player_rocket_king",
      },
      {
        name: "Call of Duty Warzone Battle Royale",
        game: "Call of Duty: Warzone",
        status: "upcoming",
        type: "round_robin",
        seasonId,
        buyIn: 20,
        settings: {
          maxPlayers: 20,
          streamRequired: true,
          disputesAllowed: true,
          registrationDeadline: "2025-01-25T23:59:59Z",
          checkInRequired: true,
          checkInDuration: 30,
          matchTimeLimit: 30,
          breakTimeBetweenMatches: 10,
          allowLateRegistration: false,
          requireVerification: true,
          customRules: "Solo Warzone matches. No teaming allowed.",
        },
        description: "Round robin Warzone tournament - every player faces every other player!",
        startDate: "2025-01-30T21:00:00Z",
        endDate: "2025-01-30T23:00:00Z",
        maxPlayers: 20,
        currentPlayers: 0,
        prizePool: 0,
      },
      {
        name: "Street Fighter 6 Masters",
        game: "Street Fighter 6",
        status: "upcoming",
        type: "single_elim",
        seasonId,
        buyIn: 30,
        settings: {
          maxPlayers: 8,
          streamRequired: true,
          disputesAllowed: true,
          registrationDeadline: "2025-02-05T23:59:59Z",
          checkInRequired: true,
          checkInDuration: 15,
          matchTimeLimit: 10,
          breakTimeBetweenMatches: 5,
          allowLateRegistration: false,
          requireVerification: true,
          customRules: "Best of 3 matches. No banned characters.",
        },
        description: "Elite Street Fighter 6 tournament for the best players only!",
        startDate: "2025-02-10T19:00:00Z",
        endDate: "2025-02-10T21:00:00Z",
        maxPlayers: 8,
        currentPlayers: 0,
        prizePool: 0,
      },
      {
        name: "COD Fall League",
        game: "Call of Duty",
        status: "live",
        type: "league",
        seasonId,
        buyIn: 25,
        settings: {
          maxPlayers: 0, // Not used for leagues
          maxTeams: 16,
          streamRequired: false,
          disputesAllowed: true,
          registrationDeadline: "2025-01-20T23:59:59Z",
          checkInRequired: true,
          checkInDuration: 30,
          matchTimeLimit: 30,
          breakTimeBetweenMatches: 10,
          allowLateRegistration: false,
          requireVerification: true,
          customRules: "Standard Call of Duty rules. Team-based matches.",
          matchFrequency: "weekly",
          statTracking: ["wins", "losses", "pointDiff"],
          tier: "Mamba",
        },
        description: "Fall Call of Duty league with weekly matches and team-based competition!",
        startDate: "2025-01-25T19:00:00Z",
        endDate: "2025-03-15T21:00:00Z",
        maxPlayers: 0,
        currentPlayers: 0,
        prizePool: 0,
      },
      {
        name: "Rocket League Pro League",
        game: "Rocket League",
        status: "upcoming",
        type: "league",
        seasonId,
        buyIn: 50,
        settings: {
          maxPlayers: 0, // Not used for leagues
          maxTeams: 8,
          streamRequired: true,
          disputesAllowed: true,
          registrationDeadline: "2025-02-10T23:59:59Z",
          checkInRequired: true,
          checkInDuration: 20,
          matchTimeLimit: 15,
          breakTimeBetweenMatches: 5,
          allowLateRegistration: false,
          requireVerification: true,
          customRules: "3v3 Standard rules. No mutators allowed.",
          matchFrequency: "biweekly",
          statTracking: ["wins", "losses", "goals", "assists", "saves"],
          tier: "Elite",
        },
        description: "Professional Rocket League league with bi-weekly matches and elite competition!",
        startDate: "2025-02-15T20:00:00Z",
        endDate: "2025-04-30T22:00:00Z",
        maxPlayers: 0,
        currentPlayers: 0,
        prizePool: 0,
      },
    ];

    // Create tournaments
    const createdTournaments: string[] = [];
    for (const tournament of tournaments) {
      const tournamentId = await tournamentService.createTournament(tournament);
      createdTournaments.push(tournamentId);
      console.log(`✅ Created tournament: ${tournament.name} (${tournamentId})`);
    }

    // Set up prizes for some tournaments
    const prizeData: { tournamentId: string; prizes: Omit<TournamentPrize, "id" | "tournamentId">[] }[] = [
      {
        tournamentId: createdTournaments[0], // Madden Kickoff Cup
        prizes: [
          { rank: 1, amount: 400, percentage: 40, description: "1st Place" },
          { rank: 2, amount: 200, percentage: 20, description: "2nd Place" },
          { rank: 3, amount: 100, percentage: 10, description: "3rd Place" },
          { rank: 4, amount: 50, percentage: 5, description: "4th Place" },
        ],
      },
      {
        tournamentId: createdTournaments[1], // FIFA Champions League
        prizes: [
          { rank: 1, amount: 350, percentage: 50, description: "1st Place" },
          { rank: 2, amount: 175, percentage: 25, description: "2nd Place" },
          { rank: 3, amount: 105, percentage: 15, description: "3rd Place" },
          { rank: 4, amount: 70, percentage: 10, description: "4th Place" },
        ],
      },
      {
        tournamentId: createdTournaments[2], // Rocket League Grand Prix
        prizes: [
          { rank: 1, amount: 120, percentage: 50, description: "1st Place" },
          { rank: 2, amount: 60, percentage: 25, description: "2nd Place" },
          { rank: 3, amount: 36, percentage: 15, description: "3rd Place" },
          { rank: 4, amount: 24, percentage: 10, description: "4th Place" },
        ],
      },
    ];

    for (const prizeInfo of prizeData) {
      await tournamentService.setTournamentPrizes(prizeInfo.tournamentId, prizeInfo.prizes);
      console.log(`✅ Set prizes for tournament: ${prizeInfo.tournamentId}`);
    }

    // Update tournament prize pools
    for (let i = 0; i < createdTournaments.length; i++) {
      const tournamentId = createdTournaments[i];
      const prizes = await tournamentService.getTournamentPrizes(tournamentId);
      const totalPrizePool = prizes.reduce((sum, prize) => sum + prize.amount, 0);
      
      await tournamentService.updateTournament(tournamentId, {
        prizePool: totalPrizePool,
      });
      
      console.log(`✅ Updated prize pool for tournament: ${tournamentId} ($${totalPrizePool})`);
    }

    // Create sample teams for league tournaments
    const leagueTournaments = createdTournaments.filter((_, index) => 
      tournaments[index].type === "league"
    );

    for (const tournamentId of leagueTournaments) {
      const tournament = tournaments[createdTournaments.indexOf(tournamentId)];
      const teamCount = Math.min(4, tournament.settings?.maxTeams || 4); // Create 4 sample teams

      for (let i = 1; i <= teamCount; i++) {
        const teamId = await tournamentService.registerTeam(tournamentId, {
          teamName: `${tournament.game} Team ${i}`,
          teamTag: `T${i}`,
          captainId: `captain_${i}`,
          captainName: `Captain ${i}`,
          members: [
            {
              playerId: `captain_${i}`,
              playerName: `Captain ${i}`,
              playerTag: `C${i}`,
              role: "captain",
              joinedAt: new Date().toISOString(),
            },
            {
              playerId: `player_${i}_1`,
              playerName: `Player ${i}.1`,
              playerTag: `P${i}.1`,
              role: "member",
              joinedAt: new Date().toISOString(),
            },
            {
              playerId: `player_${i}_2`,
              playerName: `Player ${i}.2`,
              playerTag: `P${i}.2`,
              role: "member",
              joinedAt: new Date().toISOString(),
            },
          ],
          checkedIn: i <= 2, // First 2 teams are checked in
          eliminated: false,
        });

        // Add some sample stats for checked-in teams
        if (i <= 2) {
          await tournamentService.updateTeamStats(tournamentId, teamId, {
            wins: Math.floor(Math.random() * 3),
            losses: Math.floor(Math.random() * 2),
            draws: Math.floor(Math.random() * 2),
            pointDiff: Math.floor(Math.random() * 20) - 10,
            totalPoints: Math.floor(Math.random() * 50) + 20,
            totalPointsAgainst: Math.floor(Math.random() * 50) + 15,
            matchesPlayed: Math.floor(Math.random() * 5) + 1,
            customStats: {
              goals: Math.floor(Math.random() * 20),
              assists: Math.floor(Math.random() * 15),
              saves: Math.floor(Math.random() * 10),
            },
          });
        }

        console.log(`✅ Created team: ${tournament.game} Team ${i} for tournament: ${tournamentId}`);
      }
    }

    // Update season stats
    const seasonTournaments = await tournamentService.getTournamentsBySeason(seasonId);
    const totalPrizePool = seasonTournaments.reduce((sum, tournament) => sum + (tournament.prizePool || 0), 0);
    
    await db.collection("tournamentSeasons").doc(seasonId).update({
      totalTournaments: seasonTournaments.length,
      totalPrizePool,
      updatedAt: new Date().toISOString(),
    });

    console.log(`\n🎉 Tournament seeding completed successfully!`);
    console.log(`📊 Created ${createdTournaments.length} tournaments`);
    console.log(`🏆 Total prize pool: $${totalPrizePool}`);
    console.log(`📅 Season: ${seasonId}`);

  } catch (error) {
    console.error("❌ Error seeding tournaments:", error);
    throw error;
  }
}

// Run the seeder
seedTournaments()
  .then(() => {
    console.log("\n✅ Tournament seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Tournament seeding failed:", error);
    process.exit(1);
  });
