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

async function seedCompetitions() {
  console.log("🏆 Seeding Competitions (Tournaments + Leagues)...\n");

  try {
    // Create seasons for different competition types
    const tournamentSeasonId = await tournamentService.createSeason({
      name: "2025 Q1 Tournament Season",
      year: 2025,
      quarter: 1,
      startDate: "2025-01-01T00:00:00Z",
      endDate: "2025-03-31T23:59:59Z",
      status: "active",
      totalTournaments: 0,
      totalPrizePool: 0,
    });

    const leagueSeasonId = await tournamentService.createSeason({
      name: "2025 Fall League Season",
      year: 2025,
      quarter: 4,
      startDate: "2025-09-01T00:00:00Z",
      endDate: "2025-12-31T23:59:59Z",
      status: "active",
      totalTournaments: 0,
      totalPrizePool: 0,
    });

    console.log(`✅ Created tournament season: ${tournamentSeasonId}`);
    console.log(`✅ Created league season: ${leagueSeasonId}`);

    // 1. Individual Tournament Example (Madden Kickoff Cup)
    const maddenTournamentId = await tournamentService.createTournament({
      name: "Madden Kickoff Cup",
      game: "Madden 25",
      status: "upcoming",
      type: "single_elim",
      seasonId: tournamentSeasonId,
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
    });

    console.log(`✅ Created tournament: Madden Kickoff Cup (${maddenTournamentId})`);

    // Add sample players to the tournament
    await tournamentService.registerPlayer(maddenTournamentId, "player1", {
      playerName: "QB_Killer23",
      playerTag: "QB_Killer23",
    });

    await tournamentService.registerPlayer(maddenTournamentId, "player2", {
      playerName: "Gridiron_Guru",
      playerTag: "Gridiron_Guru",
    });

    await tournamentService.registerPlayer(maddenTournamentId, "player3", {
      playerName: "Touchdown_Titan",
      playerTag: "Touchdown_Titan",
    });

    await tournamentService.registerPlayer(maddenTournamentId, "player4", {
      playerName: "Defense_Destroyer",
      playerTag: "Defense_Destroyer",
    });

    // Check in some players
    await tournamentService.checkInPlayer(maddenTournamentId, "player1");
    await tournamentService.checkInPlayer(maddenTournamentId, "player2");

    // Create sample matches
    const match1Id = await tournamentService.createMatch(maddenTournamentId, {
      round: 1,
      player1: "player1",
      player2: "player2",
      player1Score: 0,
      player2Score: 0,
      status: "scheduled",
      scheduledTime: "2025-01-20T18:30:00Z",
      matchType: "individual",
    });

    const match2Id = await tournamentService.createMatch(maddenTournamentId, {
      round: 1,
      player1: "player3",
      player2: "player4",
      player1Score: 0,
      player2Score: 0,
      status: "scheduled",
      scheduledTime: "2025-01-20T19:00:00Z",
      matchType: "individual",
    });

    console.log(`✅ Created matches for Madden tournament`);

    // Set up prizes for the tournament
    await tournamentService.setTournamentPrizes(maddenTournamentId, [
      { rank: 1, amount: 400, percentage: 40, description: "1st Place" },
      { rank: 2, amount: 200, percentage: 20, description: "2nd Place" },
      { rank: 3, amount: 100, percentage: 10, description: "3rd Place" },
      { rank: 4, amount: 50, percentage: 5, description: "4th Place" },
    ]);

    // Update tournament prize pool
    const maddenPrizes = await tournamentService.getTournamentPrizes(maddenTournamentId);
    const maddenPrizePool = maddenPrizes.reduce((sum, prize) => sum + prize.amount, 0);
    await tournamentService.updateTournament(maddenTournamentId, {
      prizePool: maddenPrizePool,
    });

    console.log(`✅ Set up prizes for Madden tournament ($${maddenPrizePool})`);

    // 2. League Example (COD Fall League)
    const codLeagueId = await tournamentService.createTournament({
      name: "COD Fall League",
      game: "Call of Duty",
      status: "live",
      type: "league",
      seasonId: leagueSeasonId,
      buyIn: 25,
      settings: {
        maxPlayers: 0, // Not used for leagues
        maxTeams: 16,
        streamRequired: false,
        disputesAllowed: true,
        registrationDeadline: "2025-09-15T23:59:59Z",
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
      startDate: "2025-09-20T19:00:00Z",
      endDate: "2025-12-15T21:00:00Z",
      maxPlayers: 0,
      currentPlayers: 0,
      prizePool: 0,
    });

    console.log(`✅ Created league: COD Fall League (${codLeagueId})`);

    // Create sample teams for the league
    const team1Id = await tournamentService.registerTeam(codLeagueId, {
      teamName: "CQG Warriors",
      teamTag: "CQG",
      captainId: "captain1",
      captainName: "Warrior_Leader",
      members: [
        {
          playerId: "captain1",
          playerName: "Warrior_Leader",
          playerTag: "WL",
          role: "captain",
          joinedAt: new Date().toISOString(),
        },
        {
          playerId: "player1",
          playerName: "Sniper_Elite",
          playerTag: "SE",
          role: "member",
          joinedAt: new Date().toISOString(),
        },
        {
          playerId: "player2",
          playerName: "Assault_King",
          playerTag: "AK",
          role: "member",
          joinedAt: new Date().toISOString(),
        },
        {
          playerId: "player3",
          playerName: "Support_Master",
          playerTag: "SM",
          role: "member",
          joinedAt: new Date().toISOString(),
        },
      ],
      checkedIn: true,
      eliminated: false,
    });

    const team2Id = await tournamentService.registerTeam(codLeagueId, {
      teamName: "Elite Squad",
      teamTag: "ES",
      captainId: "captain2",
      captainName: "Elite_Commander",
      members: [
        {
          playerId: "captain2",
          playerName: "Elite_Commander",
          playerTag: "EC",
          role: "captain",
          joinedAt: new Date().toISOString(),
        },
        {
          playerId: "player4",
          playerName: "Tactical_Genius",
          playerTag: "TG",
          role: "member",
          joinedAt: new Date().toISOString(),
        },
        {
          playerId: "player5",
          playerName: "Combat_Expert",
          playerTag: "CE",
          role: "member",
          joinedAt: new Date().toISOString(),
        },
        {
          playerId: "player6",
          playerName: "Strategy_Pro",
          playerTag: "SP",
          role: "member",
          joinedAt: new Date().toISOString(),
        },
      ],
      checkedIn: true,
      eliminated: false,
    });

    const team3Id = await tournamentService.registerTeam(codLeagueId, {
      teamName: "Storm Troopers",
      teamTag: "ST",
      captainId: "captain3",
      captainName: "Storm_Leader",
      members: [
        {
          playerId: "captain3",
          playerName: "Storm_Leader",
          playerTag: "SL",
          role: "captain",
          joinedAt: new Date().toISOString(),
        },
        {
          playerId: "player7",
          playerName: "Lightning_Fast",
          playerTag: "LF",
          role: "member",
          joinedAt: new Date().toISOString(),
        },
        {
          playerId: "player8",
          playerName: "Thunder_Strike",
          playerTag: "TS",
          role: "member",
          joinedAt: new Date().toISOString(),
        },
      ],
      checkedIn: false,
      eliminated: false,
    });

    console.log(`✅ Created teams for COD league`);

    // Add some stats for the checked-in teams
    await tournamentService.updateTeamStats(codLeagueId, team1Id, {
      wins: 3,
      losses: 1,
      draws: 0,
      pointDiff: 15,
      totalPoints: 45,
      totalPointsAgainst: 30,
      matchesPlayed: 4,
      customStats: {
        kills: 120,
        deaths: 85,
        assists: 60,
      },
    });

    await tournamentService.updateTeamStats(codLeagueId, team2Id, {
      wins: 2,
      losses: 2,
      draws: 0,
      pointDiff: 5,
      totalPoints: 40,
      totalPointsAgainst: 35,
      matchesPlayed: 4,
      customStats: {
        kills: 110,
        deaths: 95,
        assists: 55,
      },
    });

    // Create sample league matches
    const leagueMatch1Id = await tournamentService.createMatch(codLeagueId, {
      round: 1,
      team1: team1Id,
      team2: team2Id,
      team1Score: 0,
      team2Score: 0,
      status: "scheduled",
      scheduledTime: "2025-09-27T19:00:00Z",
      matchType: "team",
    });

    const leagueMatch2Id = await tournamentService.createMatch(codLeagueId, {
      round: 1,
      team1: team1Id,
      team2: team3Id,
      team1Score: 0,
      team2Score: 0,
      status: "scheduled",
      scheduledTime: "2025-10-04T19:00:00Z",
      matchType: "team",
    });

    console.log(`✅ Created league matches`);

    // 3. Additional Tournament Examples
    const fifaTournamentId = await tournamentService.createTournament({
      name: "FIFA Champions League",
      game: "FIFA 25",
      status: "live",
      type: "double_elim",
      seasonId: tournamentSeasonId,
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
      prizePool: 0,
    });

    // Set up prizes for FIFA tournament
    await tournamentService.setTournamentPrizes(fifaTournamentId, [
      { rank: 1, amount: 350, percentage: 50, description: "1st Place" },
      { rank: 2, amount: 175, percentage: 25, description: "2nd Place" },
      { rank: 3, amount: 105, percentage: 15, description: "3rd Place" },
      { rank: 4, amount: 70, percentage: 10, description: "4th Place" },
    ]);

    const fifaPrizes = await tournamentService.getTournamentPrizes(fifaTournamentId);
    const fifaPrizePool = fifaPrizes.reduce((sum, prize) => sum + prize.amount, 0);
    await tournamentService.updateTournament(fifaTournamentId, {
      prizePool: fifaPrizePool,
    });

    console.log(`✅ Created FIFA tournament with prizes ($${fifaPrizePool})`);

    // 4. Additional League Example
    const rocketLeagueId = await tournamentService.createTournament({
      name: "Rocket League Pro League",
      game: "Rocket League",
      status: "upcoming",
      type: "league",
      seasonId: leagueSeasonId,
      buyIn: 50,
      settings: {
        maxPlayers: 0,
        maxTeams: 8,
        streamRequired: true,
        disputesAllowed: true,
        registrationDeadline: "2025-10-10T23:59:59Z",
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
      startDate: "2025-10-15T20:00:00Z",
      endDate: "2025-12-30T22:00:00Z",
      maxPlayers: 0,
      currentPlayers: 0,
      prizePool: 0,
    });

    // Create sample teams for Rocket League
    const rlTeam1Id = await tournamentService.registerTeam(rocketLeagueId, {
      teamName: "Aerial Aces",
      teamTag: "AA",
      captainId: "rl_captain1",
      captainName: "Aerial_Master",
      members: [
        {
          playerId: "rl_captain1",
          playerName: "Aerial_Master",
          playerTag: "AM",
          role: "captain",
          joinedAt: new Date().toISOString(),
        },
        {
          playerId: "rl_player1",
          playerName: "Boost_Beast",
          playerTag: "BB",
          role: "member",
          joinedAt: new Date().toISOString(),
        },
        {
          playerId: "rl_player2",
          playerName: "Goal_Guardian",
          playerTag: "GG",
          role: "member",
          joinedAt: new Date().toISOString(),
        },
      ],
      checkedIn: true,
      eliminated: false,
    });

    const rlTeam2Id = await tournamentService.registerTeam(rocketLeagueId, {
      teamName: "Speed Demons",
      teamTag: "SD",
      captainId: "rl_captain2",
      captainName: "Speed_King",
      members: [
        {
          playerId: "rl_captain2",
          playerName: "Speed_King",
          playerTag: "SK",
          role: "captain",
          joinedAt: new Date().toISOString(),
        },
        {
          playerId: "rl_player3",
          playerName: "Turbo_Titan",
          playerTag: "TT",
          role: "member",
          joinedAt: new Date().toISOString(),
        },
        {
          playerId: "rl_player4",
          playerName: "Velocity_Viper",
          playerTag: "VV",
          role: "member",
          joinedAt: new Date().toISOString(),
        },
      ],
      checkedIn: true,
      eliminated: false,
    });

    // Add stats for Rocket League teams
    await tournamentService.updateTeamStats(rocketLeagueId, rlTeam1Id, {
      wins: 1,
      losses: 0,
      draws: 0,
      pointDiff: 3,
      totalPoints: 5,
      totalPointsAgainst: 2,
      matchesPlayed: 1,
      customStats: {
        goals: 5,
        assists: 8,
        saves: 12,
      },
    });

    await tournamentService.updateTeamStats(rocketLeagueId, rlTeam2Id, {
      wins: 0,
      losses: 1,
      draws: 0,
      pointDiff: -3,
      totalPoints: 2,
      totalPointsAgainst: 5,
      matchesPlayed: 1,
      customStats: {
        goals: 2,
        assists: 4,
        saves: 8,
      },
    });

    console.log(`✅ Created Rocket League teams with stats`);

    // Update season statistics
    const tournamentSeasonStats = await tournamentService.getTournamentsBySeason(tournamentSeasonId);
    const leagueSeasonStats = await tournamentService.getTournamentsBySeason(leagueSeasonId);
    
    const tournamentPrizePool = tournamentSeasonStats.reduce((sum, tournament) => sum + (tournament.prizePool || 0), 0);
    const leaguePrizePool = leagueSeasonStats.reduce((sum, tournament) => sum + (tournament.prizePool || 0), 0);

    await db.collection("tournamentSeasons").doc(tournamentSeasonId).update({
      totalTournaments: tournamentSeasonStats.length,
      totalPrizePool: tournamentPrizePool,
      updatedAt: new Date().toISOString(),
    });

    await db.collection("tournamentSeasons").doc(leagueSeasonId).update({
      totalTournaments: leagueSeasonStats.length,
      totalPrizePool: leaguePrizePool,
      updatedAt: new Date().toISOString(),
    });

    console.log(`\n🎉 Competition seeding completed successfully!`);
    console.log(`📊 Created ${tournamentSeasonStats.length} tournaments`);
    console.log(`🏆 Created ${leagueSeasonStats.length} leagues`);
    console.log(`💰 Tournament prize pool: $${tournamentPrizePool}`);
    console.log(`💰 League prize pool: $${leaguePrizePool}`);
    console.log(`📅 Tournament season: ${tournamentSeasonId}`);
    console.log(`📅 League season: ${leagueSeasonId}`);

  } catch (error) {
    console.error("❌ Error seeding competitions:", error);
    throw error;
  }
}

// Run the seeder
seedCompetitions()
  .then(() => {
    console.log("\n✅ Competition seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Competition seeding failed:", error);
    process.exit(1);
  });


