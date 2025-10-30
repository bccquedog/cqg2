import * as admin from "firebase-admin";
import { faker } from "@faker-js/faker";
import serviceAccount from "../serviceAccountKey.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();

async function seedFirestore() {
  try {
    console.log("🌱 Starting Firestore seeding with faker data...");

    // --- USERS ---
    const tiers = ["Gamer", "Mamba", "King", "Elite"];
    const users: any[] = [];
    for (let i = 1; i <= 20; i++) {
      const id = `user${i}`;
      const user = {
        id,
        username: faker.internet.username(),
        email: faker.internet.email(),
        tier: faker.helpers.arrayElement(tiers),
        xp: faker.number.int({ min: 100, max: 10000 }),
        stats: {
          wins: faker.number.int({ min: 0, max: 50 }),
          losses: faker.number.int({ min: 0, max: 50 }),
          surgeScore: faker.number.int({ min: 50, max: 2000 }),
        },
        createdAt: new Date().toISOString(),
      };
      users.push(user);
      await db.collection("users").doc(id).set(user);
    }

    console.log(`👥 Seeded ${users.length} users`);

    // --- MEMBERSHIP TIERS ---
    const membershipTiers = [
      { id: "gamer", name: "Gamer", price: 0, perks: ["Free leagues", "Basic tournaments"], active: true },
      { id: "mamba", name: "Mamba", price: 9.99, perks: ["Premium leagues", "1 free tournament request"], active: true },
      { id: "king", name: "The King", price: 19.99, perks: ["2 free tournament requests", "Early access events"], active: true },
      { id: "elite", name: "CQG Elite", price: 0, perks: ["Invite only"], active: true },
    ];
    for (const t of membershipTiers) {
      await db.collection("membershipTiers").doc(t.id).set(t);
    }

    console.log("🏆 Membership tiers added");

    // --- CLANS ---
    const clansRef = db.collection("clans");
    await clansRef.doc("clanAlpha").set({
      name: "Clan Alpha",
      logo: "https://example.com/logo-alpha.png",
      captainId: "user1",
      members: ["user1", "user2", "user3"],
      stats: { wins: 5, losses: 2, tournamentsWon: 1 },
      createdAt: new Date().toISOString()
    });

    await clansRef.doc("clanBravo").set({
      name: "Clan Bravo",
      logo: "https://example.com/logo-bravo.png",
      captainId: "user4",
      members: ["user4", "user5", "user6"],
      stats: { wins: 3, losses: 4, tournamentsWon: 0 },
      createdAt: new Date().toISOString()
    });

    console.log("🏰 Clans seeded: Clan Alpha, Clan Bravo");

    // --- MEMBERSHIPS ---
    const membershipsRef = db.collection("memberships");

    await membershipsRef.doc("gamer").set({
      name: "Gamer",
      description: "Free tier with access to standard leagues & tournaments.",
      priceUSD: 0,
      features: ["standardLeagues", "standardTournaments"],
      buyInOverride: { exempt: false, discountPercent: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await membershipsRef.doc("mamba").set({
      name: "Mamba",
      description: "Premium tier with 1 free tournament request & exclusive leagues.",
      priceUSD: 9.99,
      features: ["standardLeagues", "standardTournaments", "premiumLeagues", "1TournamentRequest"],
      buyInOverride: { exempt: false, discountPercent: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await membershipsRef.doc("theKing").set({
      name: "The King",
      description: "Top tier with 2 tournament requests & boosted exposure.",
      priceUSD: 19.99,
      features: ["standardLeagues", "standardTournaments", "premiumLeagues", "2TournamentRequests", "creatorTools", "prioritySupport"],
      buyInOverride: { exempt: false, discountPercent: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await membershipsRef.doc("elite").set({
      name: "CQG Elite",
      description: "Invite-only prestigious tier with full access.",
      priceUSD: 0,
      features: ["allFeatures"],
      buyInOverride: { exempt: true, discountPercent: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log("👑 Memberships seeded with feature mappings for access control");

    // --- MATCHES ---
    const matchesRef = db.collection("matches");
    
    // 1v1 Match
    await matchesRef.doc("match1v1_1").set({
      format: "1v1",
      teams: [
        {
          teamId: "team1",
          players: ["user1"],
          score: 16
        },
        {
          teamId: "team2", 
          players: ["user2"],
          score: 14
        }
      ],
      winnerTeamId: "team1",
      streamLink: "https://twitch.tv/cqg/match1v1_1",
      createdAt: new Date().toISOString()
    });

    // 2v2 Match
    await matchesRef.doc("match2v2_1").set({
      format: "2v2",
      teams: [
        {
          teamId: "team3",
          clanId: "clanAlpha",
          players: ["user1", "user2"],
          score: 16
        },
        {
          teamId: "team4",
          clanId: "clanBravo", 
          players: ["user4", "user5"],
          score: 12
        }
      ],
      winnerTeamId: "team3",
      streamLink: "https://twitch.tv/cqg/match2v2_1",
      createdAt: new Date().toISOString()
    });

    // 5v5 Match
    await matchesRef.doc("match5v5_1").set({
      format: "5v5",
      teams: [
        {
          teamId: "team5",
          clanId: "clanAlpha",
          players: ["user1", "user2", "user3", "user7", "user8"],
          score: 16
        },
        {
          teamId: "team6",
          clanId: "clanBravo",
          players: ["user4", "user5", "user6", "user9", "user10"],
          score: 8
        }
      ],
      winnerTeamId: "team5",
      streamLink: "https://twitch.tv/cqg/match5v5_1",
      createdAt: new Date().toISOString()
    });

    console.log("⚔️ Matches created: 1v1, 2v2, 5v5");

    // --- LEAGUES ---
    const leaguesRef = db.collection("leagues");
    await leaguesRef.doc("soloLeagueS1").set({
      name: "Solo League S1",
      type: "solo",
      game: "NBA2K",
      season: "2025",
      participants: ["user1", "user2", "user3", "user4"],
      stats: { matchesPlayed: 0, wins: 0, losses: 0 },
      buyIn: {
        enabled: true,
        amount: 25,
        currency: "usd"
      },
      membershipRules: {
        requiredFeatures: ["premiumLeagues"],   // Mamba+ only
        hostRequired: ["canHostLeague"]        // Only King+ or Elite can create
      },
      createdBy: "user1",
      createdAt: new Date().toISOString()
    });

    await leaguesRef.doc("clanLeagueS1").set({
      name: "Clan League S1",
      type: "clan",
      game: "COD",
      season: "2025",
      participants: ["clanAlpha", "clanBravo"],
      stats: { matchesPlayed: 0, wins: 0, losses: 0 },
      buyIn: {
        enabled: false,
        amount: 0,
        currency: "usd"
      },
      membershipRules: {
        requiredFeatures: ["standardLeagues"], // all tiers can join
        hostRequired: ["canHostLeague"]
      },
      createdBy: "user4",
      createdAt: new Date().toISOString()
    });

    // --- TOURNAMENTS ---
    const tournamentsRef = db.collection("tournaments");
    await tournamentsRef.doc("soloCupS1").set({
      name: "Solo Cup S1",
      type: "solo",
      game: "NBA2K",
      season: "2025",
      participants: ["user1", "user2"],
      buyIn: {
        enabled: true,
        amount: 10,
        currency: "usd"
      },
      membershipRules: {
        requiredFeatures: ["standardTournaments"],  // anyone can join
        hostRequired: ["canHostTournament"]        // Mamba+ only
      },
      createdBy: "user2",
      createdAt: new Date().toISOString()
    });

    await tournamentsRef.doc("clanCupS1").set({
      name: "Clan Cup S1",
      type: "clan",
      game: "COD",
      season: "2025",
      participants: ["clanAlpha", "clanBravo"],
      buyIn: {
        enabled: false,
        amount: 0,
        currency: "usd"
      },
      membershipRules: {
        requiredFeatures: ["premiumLeagues"],      // Mamba+ or higher
        hostRequired: ["canHostTournament"]
      },
      createdBy: "user5",
      createdAt: new Date().toISOString()
    });

    console.log("🏆 Competitions seeded with membership gating + buy-in rules");

    // --- TOURNAMENT BRACKETS ---
    // Solo Tournament Bracket (Single Elimination)
    const soloBracketRef = tournamentsRef.doc("soloCupS1").collection("bracket");
    await soloBracketRef.doc("bracket").set({
      id: "bracket_soloCupS1",
      tournamentId: "soloCupS1",
      format: "single_elimination",
      status: "in_progress",
      rounds: [
        {
          id: "round1",
          name: "Semifinals",
          roundNumber: 1,
          matches: [
            {
              id: "round1_match1",
              roundId: "round1",
              matchNumber: 1,
              team1: { id: "user1", name: "Player 1", seed: 1 },
              team2: { id: "user2", name: "Player 2", seed: 2 },
              winner: "user1",
              score: { team1: 21, team2: 17 },
              status: "completed",
              completedAt: new Date().toISOString(),
              streamLink: "https://twitch.tv/soloMatch"
            }
          ],
          isComplete: true,
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString()
        },
        {
          id: "round2",
          name: "Finals",
          roundNumber: 2,
          matches: [
            {
              id: "round2_match1",
              roundId: "round2",
              matchNumber: 1,
              team1: { id: "user1", name: "Player 1", seed: 1 },
              team2: { id: "", name: "TBD", isBye: false },
              status: "pending"
            }
          ],
          isComplete: false
        }
      ],
      currentRound: 2,
      totalRounds: 2,
      participants: ["user1", "user2"],
      seeding: { "user1": 1, "user2": 2 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Clan Tournament Bracket (Round Robin)
    const clanBracketRef = tournamentsRef.doc("clanCupS1").collection("bracket");
    await clanBracketRef.doc("bracket").set({
      id: "bracket_clanCupS1",
      tournamentId: "clanCupS1",
      format: "round_robin",
      status: "in_progress",
      rounds: [
        {
          id: "round1",
          name: "Round 1",
          roundNumber: 1,
          matches: [
            {
              id: "round1_match1",
              roundId: "round1",
              matchNumber: 1,
              team1: { id: "clanAlpha", name: "Clan Alpha", seed: 1 },
              team2: { id: "clanBravo", name: "Clan Bravo", seed: 2 },
              winner: "clanBravo",
              score: { team1: 78, team2: 82 },
              status: "completed",
              completedAt: new Date().toISOString(),
              streamLink: "https://twitch.tv/clanMatch"
            }
          ],
          isComplete: true,
      startDate: new Date().toISOString(),
          endDate: new Date().toISOString()
        }
      ],
      currentRound: 1,
      totalRounds: 1,
      participants: ["clanAlpha", "clanBravo"],
      seeding: { "clanAlpha": 1, "clanBravo": 2 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log("🏆 Tournament brackets seeded: Single elimination + Round robin");

    // --- LEAGUE BRACKETS ---
    // Solo League Bracket (Round Robin)
    const soloLeagueBracketRef = leaguesRef.doc("soloLeagueS1").collection("bracket");
    await soloLeagueBracketRef.doc("bracket").set({
      id: "bracket_soloLeagueS1",
      leagueId: "soloLeagueS1",
      format: "round_robin",
      status: "in_progress",
      season: "2025",
      currentWeek: 2,
      totalWeeks: 3,
      fixtures: [
        {
          id: "week1_match1",
          week: 1,
          matchNumber: 1,
          homeTeam: { id: "user1", name: "Player 1" },
          awayTeam: { id: "user2", name: "Player 2" },
          winner: "user1",
          score: { home: 21, away: 17 },
          status: "completed",
          completedAt: new Date().toISOString(),
          streamLink: "https://twitch.tv/leagueMatch1"
        },
        {
          id: "week2_match1",
          week: 2,
          matchNumber: 1,
          homeTeam: { id: "user2", name: "Player 2" },
          awayTeam: { id: "user1", name: "Player 1" },
          status: "pending",
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
        }
      ],
      standings: [
        {
          teamId: "user1",
          teamName: "Player 1",
          matchesPlayed: 1,
          wins: 1,
          losses: 0,
          draws: 0,
          points: 3,
          goalsFor: 21,
          goalsAgainst: 17,
          goalDifference: 4,
          winPercentage: 100,
          streak: { type: "win", count: 1 }
        },
        {
          teamId: "user2",
          teamName: "Player 2",
          matchesPlayed: 1,
          wins: 0,
          losses: 1,
          draws: 0,
          points: 0,
          goalsFor: 17,
          goalsAgainst: 21,
          goalDifference: -4,
          winPercentage: 0,
          streak: { type: "loss", count: 1 }
        }
      ],
      participants: ["user1", "user2"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Clan League Bracket (Round Robin)
    const clanLeagueBracketRef = leaguesRef.doc("clanLeagueS1").collection("bracket");
    await clanLeagueBracketRef.doc("bracket").set({
      id: "bracket_clanLeagueS1",
      leagueId: "clanLeagueS1",
      format: "round_robin",
      status: "in_progress",
      season: "2025",
      currentWeek: 1,
      totalWeeks: 1,
      fixtures: [
        {
          id: "week1_match1",
          week: 1,
          matchNumber: 1,
          homeTeam: { id: "clanAlpha", name: "Clan Alpha" },
          awayTeam: { id: "clanBravo", name: "Clan Bravo" },
          status: "pending",
          scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() // Day after tomorrow
        }
      ],
      standings: [
        {
          teamId: "clanAlpha",
          teamName: "Clan Alpha",
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          points: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          winPercentage: 0,
          streak: { type: "loss", count: 0 }
        },
        {
          teamId: "clanBravo",
          teamName: "Clan Bravo",
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          points: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          winPercentage: 0,
          streak: { type: "loss", count: 0 }
        }
      ],
      participants: ["clanAlpha", "clanBravo"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log("🏆 League brackets seeded: Round robin with standings");

    // --- Bracket Seeder ---
    const bracketsRef = db.collection("tournaments").doc("soloCupS1").collection("bracket");

    await bracketsRef.doc("bracketDoc").set({
      rounds: [
        {
          roundNumber: 1,
          matches: [
            {
              matchId: "R1M1",
      players: ["user1", "user2"],
              status: "pending",
              winner: null,
              scores: { user1: null, user2: null },
              ticketCodes: { user1: "ABC123XYZ", user2: "DEF456QWE" }
            },
            {
              matchId: "R1M2",
              players: ["user3", "user4"],
              status: "pending",
              winner: null,
              scores: { user3: null, user4: null },
              ticketCodes: { user3: "JKL789MNO", user4: "PQR123STU" }
            }
          ]
        }
      ],
      currentRound: 1,
      bracketType: "singleElim",
      createdAt: new Date().toISOString()
    });

    console.log("🏆 Bracket seeded for Solo Cup S1");

    // --- TOURNAMENT SCHEDULES ---
    // Solo Tournament Schedule
    const soloScheduleRef = tournamentsRef.doc("soloCupS1").collection("schedule");
    await soloScheduleRef.doc("schedule").set({
      id: "schedule_soloCupS1",
      tournamentId: "soloCupS1",
      name: "Solo Cup S1 Schedule",
      description: "Single elimination tournament schedule",
      startDate: "2025-09-06",
      endDate: "2025-09-07",
      timezone: "America/New_York",
      days: [
        {
          date: "2025-09-06",
          events: [
            {
              id: "round1_start",
              title: "Round 1 - Start",
              type: "round",
              startTime: "2025-09-06T18:00:00.000Z",
              endTime: "2025-09-06T18:15:00.000Z",
              status: "scheduled",
              metadata: { roundId: "round1", roundNumber: 1 }
            },
            {
              id: "round1_match1",
              title: "Round 1 - Match 1",
              type: "match",
              startTime: "2025-09-06T18:15:00.000Z",
              endTime: "2025-09-06T19:15:00.000Z",
              status: "scheduled",
              streamLink: "https://twitch.tv/soloCupS1",
              participants: ["user1", "user2"],
              metadata: { roundId: "round1", matchId: "R1M1", roundNumber: 1, matchNumber: 1 }
            },
            {
              id: "round1_match2",
              title: "Round 1 - Match 2",
              type: "match",
              startTime: "2025-09-06T19:30:00.000Z",
              endTime: "2025-09-06T20:30:00.000Z",
              status: "scheduled",
              streamLink: "https://twitch.tv/soloCupS1",
              participants: ["user3", "user4"],
              metadata: { roundId: "round1", matchId: "R1M2", roundNumber: 1, matchNumber: 2 }
            }
          ]
        },
        {
          date: "2025-09-07",
          events: [
            {
              id: "finals_start",
              title: "Finals - Start",
              type: "round",
              startTime: "2025-09-07T19:00:00.000Z",
              endTime: "2025-09-07T19:15:00.000Z",
              status: "scheduled",
              metadata: { roundId: "finals", roundNumber: 2 }
            },
            {
              id: "finals_match1",
              title: "Finals - Match 1",
              type: "match",
              startTime: "2025-09-07T19:15:00.000Z",
              endTime: "2025-09-07T20:15:00.000Z",
              status: "scheduled",
              streamLink: "https://twitch.tv/soloCupS1",
              participants: ["TBD", "TBD"],
              metadata: { roundId: "finals", matchId: "F1", roundNumber: 2, matchNumber: 1 }
            },
            {
              id: "awards_ceremony",
              title: "Awards Ceremony",
              type: "ceremony",
              startTime: "2025-09-07T20:30:00.000Z",
              endTime: "2025-09-07T21:00:00.000Z",
              status: "scheduled",
              streamLink: "https://twitch.tv/soloCupS1",
              metadata: { ceremonyType: "awards" }
            }
          ]
        }
      ],
      totalEvents: 6,
      completedEvents: 0,
      status: "published",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Clan Tournament Schedule
    const clanScheduleRef = tournamentsRef.doc("clanCupS1").collection("schedule");
    await clanScheduleRef.doc("schedule").set({
      id: "schedule_clanCupS1",
      tournamentId: "clanCupS1",
      name: "Clan Cup S1 Schedule",
      description: "Round robin clan tournament schedule",
      startDate: "2025-09-08",
      endDate: "2025-09-08",
      timezone: "America/New_York",
      days: [
        {
          date: "2025-09-08",
          events: [
            {
              id: "clan_match1",
              title: "Clan Alpha vs Clan Bravo",
              type: "match",
              startTime: "2025-09-08T20:00:00.000Z",
              endTime: "2025-09-08T22:00:00.000Z",
              status: "scheduled",
              streamLink: "https://twitch.tv/clanCupS1",
              participants: ["clanAlpha", "clanBravo"],
              metadata: { roundId: "round1", matchId: "R1M1", roundNumber: 1, matchNumber: 1 }
            }
          ]
        }
      ],
      totalEvents: 1,
      completedEvents: 0,
      status: "published",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log("📅 Tournament schedules seeded: Solo + Clan");

    // --- LEAGUE SCHEDULES ---
    // Solo League Schedule
    const soloLeagueScheduleRef = leaguesRef.doc("soloLeagueS1").collection("schedule");
    await soloLeagueScheduleRef.doc("schedule").set({
      id: "schedule_soloLeagueS1",
      leagueId: "soloLeagueS1",
      name: "Solo League S1 Schedule",
      description: "Weekly league matches",
      season: "2025",
      startDate: "2025-09-09",
      endDate: "2025-09-30",
      timezone: "America/New_York",
      weeks: [
        {
          weekNumber: 1,
          startDate: "2025-09-09",
          endDate: "2025-09-15",
          events: [
            {
              id: "week1_match1",
              title: "Week 1 - Player 1 vs Player 2",
              type: "match",
              startTime: "2025-09-10T19:00:00.000Z",
              endTime: "2025-09-10T20:00:00.000Z",
              status: "completed",
              streamLink: "https://twitch.tv/leagueMatch1",
              participants: ["user1", "user2"],
              metadata: { weekId: "week1", fixtureId: "week1_match1", weekNumber: 1, matchNumber: 1 }
            }
          ]
        },
        {
          weekNumber: 2,
          startDate: "2025-09-16",
          endDate: "2025-09-22",
          events: [
            {
              id: "week2_match1",
              title: "Week 2 - Player 2 vs Player 1",
              type: "match",
              startTime: "2025-09-17T19:00:00.000Z",
              endTime: "2025-09-17T20:00:00.000Z",
              status: "scheduled",
              streamLink: "https://twitch.tv/leagueMatch2",
              participants: ["user2", "user1"],
              metadata: { weekId: "week2", fixtureId: "week2_match1", weekNumber: 2, matchNumber: 1 }
            }
          ]
        },
        {
          weekNumber: 3,
          startDate: "2025-09-23",
          endDate: "2025-09-29",
          events: [
            {
              id: "week3_match1",
              title: "Week 3 - Player 1 vs Player 2",
              type: "match",
              startTime: "2025-09-24T19:00:00.000Z",
              endTime: "2025-09-24T20:00:00.000Z",
              status: "scheduled",
              streamLink: "https://twitch.tv/leagueMatch3",
              participants: ["user1", "user2"],
              metadata: { weekId: "week3", fixtureId: "week3_match1", weekNumber: 3, matchNumber: 1 }
            }
          ]
        }
      ],
      totalWeeks: 3,
      currentWeek: 2,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Clan League Schedule
    const clanLeagueScheduleRef = leaguesRef.doc("clanLeagueS1").collection("schedule");
    await clanLeagueScheduleRef.doc("schedule").set({
      id: "schedule_clanLeagueS1",
      leagueId: "clanLeagueS1",
      name: "Clan League S1 Schedule",
      description: "Weekly clan league matches",
      season: "2025",
      startDate: "2025-09-10",
      endDate: "2025-09-10",
      timezone: "America/New_York",
      weeks: [
        {
          weekNumber: 1,
          startDate: "2025-09-10",
          endDate: "2025-09-10",
          events: [
            {
              id: "clan_week1_match1",
              title: "Week 1 - Clan Alpha vs Clan Bravo",
              type: "match",
              startTime: "2025-09-10T21:00:00.000Z",
              endTime: "2025-09-10T23:00:00.000Z",
              status: "scheduled",
              streamLink: "https://twitch.tv/clanLeagueMatch1",
              participants: ["clanAlpha", "clanBravo"],
              metadata: { weekId: "week1", fixtureId: "week1_match1", weekNumber: 1, matchNumber: 1 }
            }
          ]
        }
      ],
      totalWeeks: 1,
      currentWeek: 1,
      status: "published",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log("📅 League schedules seeded: Solo + Clan");

    // --- TOURNAMENT MATCHES ---
    // Solo Tournament Match (1v1)
    const soloMatchesRef = tournamentsRef.doc("soloCupS1").collection("matches");
    await soloMatchesRef.doc("match1").set({
      format: "1v1",
      teams: [
        { teamId: "team1", players: ["user1"], score: 21 },
        { teamId: "team2", players: ["user2"], score: 17 }
      ],
      winnerTeamId: "team1",
      streamLink: "https://twitch.tv/soloMatch",
      createdAt: new Date().toISOString()
    });

    // Clan Tournament Match (5v5)
    const clanMatchesRef = tournamentsRef.doc("clanCupS1").collection("matches");
    await clanMatchesRef.doc("match1").set({
      format: "5v5",
      teams: [
        { teamId: "team1", clanId: "clanAlpha", players: ["user1","user2","user3","user7","user8"], score: 78 },
        { teamId: "team2", clanId: "clanBravo", players: ["user4","user5","user6","user9","user10"], score: 82 }
      ],
      winnerTeamId: "team2",
      streamLink: "https://twitch.tv/clanMatch",
      createdAt: new Date().toISOString()
    });

    console.log("⚔️ Matches seeded: Solo 1v1 + Clan 5v5");
    console.log("💰 Buy-in support seeded for leagues + tournaments");

    // --- CLIPS ---
    for (let i = 1; i <= 10; i++) {
      const user = faker.helpers.arrayElement(users);
      await db.collection("clips").doc(`clip${i}`).set({
        userId: user.id,
        game: faker.helpers.arrayElement(["Call of Duty", "Madden 25", "NBA 2K25", "Apex Legends"]),
        title: faker.lorem.words(3),
        url: `https://youtube.com/watch?v=${faker.string.alphanumeric(8)}`,
        tags: [faker.word.noun(), faker.word.noun()],
        surgeScore: faker.number.int({ min: 50, max: 200 }),
        createdAt: new Date().toISOString(),
      });
    }

    console.log("🎥 Clips uploaded");

    // --- ADMIN CONTROLS ---
    // Feature toggles
    await db.collection("adminControls").doc("featureToggles").set({
      autoTournaments: {
        enabled: true,
        updatedAt: new Date().toISOString(),
        lastUpdatedBy: "system",
        scope: ["all"],
        retentionDays: 30,
      },
      clanTournaments: {
        enabled: true,
        updatedAt: new Date().toISOString(),
        lastUpdatedBy: "system",
        scope: ["all"],
        retentionDays: 60,
      },
      clipUploads: {
      enabled: true,
      updatedAt: new Date().toISOString(),
        lastUpdatedBy: "system",
        scope: ["all"],
        retentionDays: 30,
      },
      merchStore: {
        enabled: false,
        updatedAt: new Date().toISOString(),
        lastUpdatedBy: "system",
        scope: ["all"],
        retentionDays: 90,
      },
      staleCompetitions: {
        enabled: true,
        autoPurge: false,
        retentionDays: 30,
        updatedAt: new Date().toISOString(),
        lastUpdatedBy: "system",
        scope: ["all"]
      },
      buyIns: {
        enabled: true,
        amount: 25,
        currency: "usd"
      }
    });

    console.log("⚙️ Admin controls set");

    // --- GLOBAL BUY-INS TOGGLE ---
    const togglesRef = db.collection("adminControls").doc("featureToggles");

    await togglesRef.set({
      buyIns: {
        enabled: true,                  // default ON
        scope: ["all"],                 // applies to all tiers
        retentionDays: 0,               // not needed, but keep consistent
        updatedAt: new Date().toISOString(),
        lastUpdatedBy: "system"
      }
    }, { merge: true });

    console.log("💰 Global buyIns toggle seeded in featureToggles");

    // --- MATCH TICKETS SEEDER ---
    const ticketsRef = db.collection("tickets");

    // Example: Ticket for user1 in Solo Cup S1 Round 1
    await ticketsRef.doc("ticket1").set({
      code: "ABC123XYZ",
      userId: "user1",
      competitionId: "soloCupS1",
      roundId: "R1",
      valid: true,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour later
    });

    // Example: Ticket for user2 in Solo League S1 Week 1
    await ticketsRef.doc("ticket2").set({
      code: "DEF456QWE",
      userId: "user2",
      competitionId: "soloLeagueS1",
      roundId: "Week1",
      valid: true,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
    });

    console.log("🎟 Tickets seeded for competitions");

    // --- TOURNAMENT REPORTS SEEDER ---
    const reportsRef = db.collection("tournaments").doc("soloCupS1").collection("reports");

    // Sample report 1: Match incident
    await reportsRef.doc("report1").set({
      id: "report1",
      tournamentId: "soloCupS1",
      title: "Player Disconnection During Match",
      description: "User experienced connection issues during Round 1 Match 1",
      type: "incident",
      status: "submitted",
      priority: "high",
      content: {
        summary: "Player disconnected during critical match moment",
        details: "User1 disconnected at 15:30 during Round 1 Match 1. Connection was restored after 2 minutes but match was already lost.",
        evidence: ["https://example.com/screenshot1.png", "https://example.com/logs.txt"],
        affectedPlayers: ["user1", "user2"],
        matchId: "R1M1",
        roundId: "R1"
      },
      reportedBy: "user1",
      reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      isPublic: false,
      tags: ["disconnection", "technical", "match-issue"],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    });

    // Sample report 2: Performance issue
    await reportsRef.doc("report2").set({
      id: "report2",
      tournamentId: "soloCupS1",
      title: "Lag Spikes During Tournament",
      description: "Multiple players reporting lag spikes during matches",
      type: "performance",
      status: "reviewed",
      priority: "medium",
      content: {
        summary: "Server performance issues affecting gameplay",
        details: "Several players reported lag spikes of 200-500ms during matches. Issue seems to affect all participants.",
        evidence: ["https://example.com/ping-tests.png"],
        affectedPlayers: ["user1", "user2", "user3", "user4"]
      },
      reportedBy: "user2",
      reportedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      assignedTo: "admin1",
      reviewedBy: "admin1",
      reviewedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      resolution: "Investigating server performance. Will monitor and optimize.",
      resolutionNotes: "Contacted hosting provider for performance analysis.",
      isPublic: true,
      tags: ["performance", "server", "lag"],
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    });

    // Sample report 3: Tournament feedback
    await reportsRef.doc("report3").set({
      id: "report3",
      tournamentId: "soloCupS1",
      title: "Tournament Format Feedback",
      description: "Suggestions for improving tournament structure",
      type: "tournament",
      status: "draft",
      priority: "low",
      content: {
        summary: "Feedback on tournament format and scheduling",
        details: "The single elimination format is good, but would like to see double elimination for future tournaments. Also, the 2-hour time limit per match feels too short for competitive play.",
        evidence: [],
        affectedPlayers: []
      },
      reportedBy: "user3",
      reportedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      isPublic: true,
      tags: ["feedback", "format", "scheduling"],
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    });

    // Add comments to report2
    const commentsRef = reportsRef.doc("report2").collection("comments");
    
    await commentsRef.doc("comment1").set({
      id: "comment1",
      reportId: "report2",
      authorId: "admin1",
      content: "Thanks for reporting this. We're looking into the server performance issues.",
      isAdmin: true,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    });

    await commentsRef.doc("comment2").set({
      id: "comment2",
      reportId: "report2",
      authorId: "user1",
      content: "I can confirm the lag was really bad during my match. Hope this gets fixed soon!",
      isAdmin: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    });

    // Add report to clan tournament
    const clanReportsRef = db.collection("tournaments").doc("clanCupS1").collection("reports");
    
    await clanReportsRef.doc("report4").set({
      id: "report4",
      tournamentId: "clanCupS1",
      title: "Clan Member Dispute",
      description: "Disagreement between clan members during tournament",
      type: "incident",
      status: "resolved",
      priority: "critical",
      content: {
        summary: "Internal clan conflict affecting tournament participation",
        details: "Two clan members had a disagreement about strategy during the match. This led to poor coordination and eventual loss.",
        evidence: ["https://example.com/chat-logs.png"],
        affectedPlayers: ["user5", "user6"],
        matchId: "R1M1",
        roundId: "R1"
      },
      reportedBy: "user5",
      reportedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      assignedTo: "admin1",
      reviewedBy: "admin1",
      reviewedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      resolution: "Clan members have been counseled. Conflict resolved.",
      resolutionNotes: "Mediated discussion between clan members. Both parties agreed to improve communication.",
      isPublic: false,
      tags: ["dispute", "clan", "communication"],
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    });

    console.log("📋 Tournament reports seeded with sample data");

    // --- Tournament Schedule Seeder ---
    await db.collection("tournaments").doc("soloCupS1").collection("schedule").doc("main").set({
      startTime: "2025-09-01T20:00:00Z",
      checkInOpens: "2025-09-01T19:30:00Z",
      checkInCloses: "2025-09-01T19:55:00Z",
      roundDurations: {
        R1: 30,
        R2: 45,
        Finals: 60,
      },
      reminders: {
        preCheckIn: true,
        preMatch: true,
        lateWarning: true,
      }
    });

    console.log("⏰ Schedule seeded for Solo Cup S1");

    // --- LEADERBOARDS ---
    // Global Leaderboard
    await db.collection("leaderboards").doc("global").set({
      id: "global",
      type: "global",
      title: "Global Leaderboard",
      description: "Overall performance across all games and competitions",
      lastUpdated: new Date().toISOString(),
      totalPlayers: 20,
      entries: [
        {
          userId: "user1",
          username: users[0].username,
          rank: 1,
          score: 2850,
          wins: 45,
          losses: 5,
          winRate: 0.9,
          totalPoints: 12500,
          averagePoints: 250,
          gamesPlayed: 50,
          lastPlayed: new Date().toISOString(),
          streak: { current: 8, type: "win" },
          achievements: ["champion", "undefeated"],
          tier: "Grandmaster",
          badge: "🏆"
        },
        {
          userId: "user2",
          username: users[1].username,
          rank: 2,
          score: 2650,
          wins: 42,
          losses: 8,
          winRate: 0.84,
          totalPoints: 11800,
          averagePoints: 236,
          gamesPlayed: 50,
          lastPlayed: new Date().toISOString(),
          streak: { current: 5, type: "win" },
          achievements: ["champion"],
          tier: "Master",
          badge: "🔥"
        },
        {
          userId: "user3",
          username: users[2].username,
          rank: 3,
          score: 2400,
          wins: 38,
          losses: 12,
          winRate: 0.76,
          totalPoints: 10500,
          averagePoints: 210,
          gamesPlayed: 50,
          lastPlayed: new Date().toISOString(),
          streak: { current: 3, type: "win" },
          achievements: ["comeback"],
          tier: "Diamond",
          badge: "💪"
        }
      ],
      metadata: {
        season: "S1",
        period: "all-time",
        gameCount: 3,
        competitionCount: 8
      }
    });

    // Game-specific Leaderboards
    await db.collection("leaderboards").doc("game-madden").set({
      id: "game-madden",
      type: "game",
      gameId: "madden",
      gameName: "Madden NFL 24",
      title: "Madden NFL 24 Leaderboard",
      description: "Performance rankings for Madden NFL 24",
      lastUpdated: new Date().toISOString(),
      totalPlayers: 15,
      entries: [
        {
          userId: "user1",
          username: users[0].username,
          rank: 1,
          score: 2200,
          wins: 35,
          losses: 5,
          winRate: 0.875,
          totalPoints: 9500,
          averagePoints: 237.5,
          gamesPlayed: 40,
          lastPlayed: new Date().toISOString(),
          streak: { current: 6, type: "win" },
          achievements: ["champion"],
          tier: "Master",
          badge: "🏆"
        },
        {
          userId: "user4",
          username: users[3].username,
          rank: 2,
          score: 1950,
          wins: 30,
          losses: 10,
          winRate: 0.75,
          totalPoints: 8200,
          averagePoints: 205,
          gamesPlayed: 40,
          lastPlayed: new Date().toISOString(),
          streak: { current: 4, type: "win" },
          achievements: [],
          tier: "Diamond",
          badge: "🔥"
        }
      ],
      metadata: {
        season: "S1",
        period: "all-time",
        competitionCount: 4,
        averageScore: 1800,
        topScore: 2200
      }
    });

    await db.collection("leaderboards").doc("game-2k").set({
      id: "game-2k",
      type: "game",
      gameId: "2k",
      gameName: "NBA 2K24",
      title: "NBA 2K24 Leaderboard",
      description: "Performance rankings for NBA 2K24",
      lastUpdated: new Date().toISOString(),
      totalPlayers: 12,
      entries: [
        {
          userId: "user2",
          username: users[1].username,
          rank: 1,
          score: 2100,
          wins: 32,
          losses: 8,
          winRate: 0.8,
          totalPoints: 8800,
          averagePoints: 220,
          gamesPlayed: 40,
          lastPlayed: new Date().toISOString(),
          streak: { current: 5, type: "win" },
          achievements: ["champion"],
          tier: "Master",
          badge: "🏆"
        },
        {
          userId: "user5",
          username: users[4].username,
          rank: 2,
          score: 1850,
          wins: 28,
          losses: 12,
          winRate: 0.7,
          totalPoints: 7600,
          averagePoints: 190,
          gamesPlayed: 40,
          lastPlayed: new Date().toISOString(),
          streak: { current: 2, type: "win" },
          achievements: [],
          tier: "Diamond",
          badge: "🔥"
        }
      ],
      metadata: {
        season: "S1",
        period: "all-time",
        competitionCount: 3,
        averageScore: 1650,
        topScore: 2100
      }
    });

    // League-specific Leaderboards
    await db.collection("leaderboards").doc("league-soloLeagueS1").set({
      id: "league-soloLeagueS1",
      type: "league",
      leagueId: "soloLeagueS1",
      leagueName: "Solo League S1",
      title: "Solo League S1 Leaderboard",
      description: "Performance rankings for Solo League S1",
      lastUpdated: new Date().toISOString(),
      totalPlayers: 8,
      entries: [
        {
          userId: "user1",
          username: users[0].username,
          rank: 1,
          score: 1800,
          wins: 18,
          losses: 2,
          winRate: 0.9,
          totalPoints: 7200,
          averagePoints: 360,
          gamesPlayed: 20,
          lastPlayed: new Date().toISOString(),
          streak: { current: 8, type: "win" },
          achievements: ["champion"],
          tier: "Master",
          badge: "🏆"
        },
        {
          userId: "user3",
          username: users[2].username,
          rank: 2,
          score: 1600,
          wins: 15,
          losses: 5,
          winRate: 0.75,
          totalPoints: 6000,
          averagePoints: 300,
          gamesPlayed: 20,
          lastPlayed: new Date().toISOString(),
          streak: { current: 3, type: "win" },
          achievements: [],
          tier: "Diamond",
          badge: "🔥"
        }
      ],
      metadata: {
        season: "S1",
        period: "all-time",
        totalMatches: 20,
        averageScore: 1400,
        topScore: 1800,
        leagueStatus: "active"
      }
    });

    await db.collection("leaderboards").doc("league-clanLeagueS1").set({
      id: "league-clanLeagueS1",
      type: "league",
      leagueId: "clanLeagueS1",
      leagueName: "Clan League S1",
      title: "Clan League S1 Leaderboard",
      description: "Performance rankings for Clan League S1",
      lastUpdated: new Date().toISOString(),
      totalPlayers: 6,
      entries: [
        {
          userId: "user2",
          username: users[1].username,
          rank: 1,
          score: 1750,
          wins: 16,
          losses: 4,
          winRate: 0.8,
          totalPoints: 6800,
          averagePoints: 340,
          gamesPlayed: 20,
          lastPlayed: new Date().toISOString(),
          streak: { current: 5, type: "win" },
          achievements: ["champion"],
          tier: "Master",
          badge: "🏆"
        },
        {
          userId: "user4",
          username: users[3].username,
          rank: 2,
          score: 1550,
          wins: 14,
          losses: 6,
          winRate: 0.7,
          totalPoints: 5600,
          averagePoints: 280,
          gamesPlayed: 20,
          lastPlayed: new Date().toISOString(),
          streak: { current: 2, type: "win" },
          achievements: [],
          tier: "Diamond",
          badge: "🔥"
        }
      ],
      metadata: {
        season: "S1",
        period: "all-time",
        totalMatches: 18,
        averageScore: 1300,
        topScore: 1750,
        leagueStatus: "active"
      }
    });

    console.log("🏆 Leaderboards seeded with sample data");
    console.log("✅ Seeding complete!");
  } catch (err) {
    console.error("❌ Error seeding Firestore:", err);
  }
}

seedFirestore();
