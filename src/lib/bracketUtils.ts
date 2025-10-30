import { 
  TournamentBracket, 
  BracketRound, 
  BracketMatch, 
  LeagueBracket, 
  LeagueFixture, 
  LeagueStanding,
  BracketGenerationOptions,
  LeagueGenerationOptions,
  BracketValidationResult,
  BracketStats
} from "@/types/brackets";
import { serverTimestamp, Timestamp } from "firebase/firestore";

// ========================
// TOURNAMENT BRACKET UTILITIES
// ========================

/**
 * Generates a single elimination tournament bracket
 */
export function generateSingleEliminationBracket(
  tournamentId: string,
  participants: string[],
  seeding?: Record<string, number>
): TournamentBracket {
  const totalRounds = Math.ceil(Math.log2(participants.length));
  const rounds: BracketRound[] = [];
  
  // Sort participants by seed if provided
  const sortedParticipants = seeding 
    ? participants.sort((a, b) => (seeding[a] || 999) - (seeding[b] || 999))
    : participants;

  // Generate rounds from finals backwards
  for (let roundNum = totalRounds; roundNum >= 1; roundNum--) {
    const roundName = getRoundName(roundNum, totalRounds);
    const matchesInRound = Math.pow(2, roundNum - 1);
    const matches: BracketMatch[] = [];

    for (let matchNum = 1; matchNum <= matchesInRound; matchNum++) {
      const matchId = `round${roundNum}_match${matchNum}`;
      const match: BracketMatch = {
        id: matchId,
        roundId: `round${roundNum}`,
        matchNumber: matchNum,
        team1: { id: "", name: "TBD", isBye: false },
        team2: { id: "", name: "TBD", isBye: false },
        status: "pending"
      };

      // For first round, assign participants
      if (roundNum === totalRounds) {
        const team1Index = (matchNum - 1) * 2;
        const team2Index = team1Index + 1;
        
        if (team1Index < sortedParticipants.length) {
          match.team1.id = sortedParticipants[team1Index];
          match.team1.name = `Team ${team1Index + 1}`;
          match.team1.seed = seeding?.[sortedParticipants[team1Index]] || team1Index + 1;
        } else {
          match.team1.isBye = true;
          match.team1.name = "Bye";
        }

        if (team2Index < sortedParticipants.length) {
          match.team2.id = sortedParticipants[team2Index];
          match.team2.name = `Team ${team2Index + 1}`;
          match.team2.seed = seeding?.[sortedParticipants[team2Index]] || team2Index + 1;
        } else {
          match.team2.isBye = true;
          match.team2.name = "Bye";
        }
      }

      matches.push(match);
    }

    rounds.push({
      id: `round${roundNum}`,
      name: roundName,
      roundNumber: roundNum,
      matches,
      isComplete: false
    });
  }

  return {
    id: `bracket_${tournamentId}`,
    tournamentId,
    format: "single_elimination",
    status: "pending",
    rounds: rounds.reverse(), // Reverse to show first round first
    currentRound: 1,
    totalRounds,
    participants: sortedParticipants,
    seeding,
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp
  };
}

/**
 * Generates a round robin tournament bracket
 */
export function generateRoundRobinBracket(
  tournamentId: string,
  participants: string[],
  seeding?: Record<string, number>
): TournamentBracket {
  const totalRounds = participants.length - 1;
  const rounds: BracketRound[] = [];
  
  // Sort participants by seed if provided
  const sortedParticipants = seeding 
    ? participants.sort((a, b) => (seeding[a] || 999) - (seeding[b] || 999))
    : participants;

  // Generate round robin matches
  for (let roundNum = 1; roundNum <= totalRounds; roundNum++) {
    const matches: BracketMatch[] = [];
    const roundName = `Round ${roundNum}`;
    
    // Round robin algorithm
    for (let i = 0; i < sortedParticipants.length / 2; i++) {
      const team1Index = i;
      const team2Index = sortedParticipants.length - 1 - i;
      
      if (team1Index < team2Index) {
        const matchId = `round${roundNum}_match${i + 1}`;
        const match: BracketMatch = {
          id: matchId,
          roundId: `round${roundNum}`,
          matchNumber: i + 1,
          team1: {
            id: sortedParticipants[team1Index],
            name: `Team ${team1Index + 1}`,
            seed: seeding?.[sortedParticipants[team1Index]] || team1Index + 1
          },
          team2: {
            id: sortedParticipants[team2Index],
            name: `Team ${team2Index + 1}`,
            seed: seeding?.[sortedParticipants[team2Index]] || team2Index + 1
          },
          status: "pending"
        };
        matches.push(match);
      }
    }

    rounds.push({
      id: `round${roundNum}`,
      name: roundName,
      roundNumber: roundNum,
      matches,
      isComplete: false
    });

    // Rotate participants for next round
    const last = sortedParticipants.pop();
    if (last) {
      sortedParticipants.splice(1, 0, last);
    }
  }

  return {
    id: `bracket_${tournamentId}`,
    tournamentId,
    format: "round_robin",
    status: "pending",
    rounds,
    currentRound: 1,
    totalRounds,
    participants: sortedParticipants,
    seeding,
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp
  };
}

// ========================
// LEAGUE BRACKET UTILITIES
// ========================

/**
 * Generates a round robin league bracket
 */
export function generateRoundRobinLeague(
  leagueId: string,
  participants: string[],
  totalWeeks?: number
): LeagueBracket {
  const numParticipants = participants.length;
  const weeks = totalWeeks || (numParticipants % 2 === 0 ? numParticipants - 1 : numParticipants);
  const fixtures: LeagueFixture[] = [];
  const standings: LeagueStanding[] = [];

  // Initialize standings
  participants.forEach((participantId, index) => {
    standings.push({
      teamId: participantId,
      teamName: `Team ${index + 1}`,
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
    });
  });

  // Generate fixtures using round robin algorithm
  for (let week = 1; week <= weeks; week++) {
    const weekFixtures: LeagueFixture[] = [];
    
    for (let i = 0; i < numParticipants / 2; i++) {
      const homeIndex = i;
      const awayIndex = numParticipants - 1 - i;
      
      if (homeIndex < awayIndex) {
        const fixtureId = `week${week}_match${i + 1}`;
        const fixture: LeagueFixture = {
          id: fixtureId,
          week,
          matchNumber: i + 1,
          homeTeam: {
            id: participants[homeIndex],
            name: `Team ${homeIndex + 1}`
          },
          awayTeam: {
            id: participants[awayIndex],
            name: `Team ${awayIndex + 1}`
          },
          status: "pending"
        };
        weekFixtures.push(fixture);
      }
    }

    fixtures.push(...weekFixtures);

    // Rotate participants for next week
    const last = participants.pop();
    if (last) {
      participants.splice(1, 0, last);
    }
  }

  return {
    id: `bracket_${leagueId}`,
    leagueId,
    format: "round_robin",
    status: "pending",
    season: "2025",
    currentWeek: 1,
    totalWeeks: weeks,
    fixtures,
    standings,
    participants,
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp
  };
}

// ========================
// BRACKET VALIDATION
// ========================

/**
 * Validates a tournament bracket
 */
export function validateTournamentBracket(bracket: TournamentBracket): BracketValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check basic structure
  if (!bracket.rounds || bracket.rounds.length === 0) {
    errors.push("Bracket has no rounds");
  }

  if (bracket.totalRounds !== bracket.rounds.length) {
    errors.push(`Total rounds (${bracket.totalRounds}) doesn't match actual rounds (${bracket.rounds.length})`);
  }

  // Check rounds
  bracket.rounds.forEach((round, roundIndex) => {
    if (!round.matches || round.matches.length === 0) {
      errors.push(`Round ${roundIndex + 1} has no matches`);
    }

    round.matches.forEach((match, matchIndex) => {
      if (!match.team1.id && !match.team1.isBye) {
        errors.push(`Round ${roundIndex + 1}, Match ${matchIndex + 1}: Team 1 is empty`);
      }
      if (!match.team2.id && !match.team2.isBye) {
        errors.push(`Round ${roundIndex + 1}, Match ${matchIndex + 1}: Team 2 is empty`);
      }
      if (match.status === "completed" && !match.winner) {
        errors.push(`Round ${roundIndex + 1}, Match ${matchIndex + 1}: Completed match has no winner`);
      }
    });
  });

  // Calculate stats
  const stats = calculateBracketStats(bracket);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats
  };
}

/**
 * Validates a league bracket
 */
export function validateLeagueBracket(bracket: LeagueBracket): BracketValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check basic structure
  if (!bracket.fixtures || bracket.fixtures.length === 0) {
    errors.push("League has no fixtures");
  }

  if (!bracket.standings || bracket.standings.length === 0) {
    errors.push("League has no standings");
  }

  // Check standings match participants
  const participantIds = new Set(bracket.participants);
  bracket.standings.forEach((standing, index) => {
    if (!participantIds.has(standing.teamId)) {
      errors.push(`Standing ${index + 1}: Team ${standing.teamId} not in participants list`);
    }
  });

  // Calculate stats
  const stats = calculateLeagueStats(bracket);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats
  };
}

// ========================
// HELPER FUNCTIONS
// ========================

function getRoundName(roundNum: number, totalRounds: number): string {
  const roundNames = [
    "Finals",
    "Semifinals", 
    "Quarterfinals",
    "Round of 16",
    "Round of 32",
    "Round of 64"
  ];

  if (roundNum === 1) return "Finals";
  if (roundNum === 2) return "Semifinals";
  if (roundNum === 3) return "Quarterfinals";
  
  const participantsInRound = Math.pow(2, roundNum);
  return `Round of ${participantsInRound}`;
}

function calculateBracketStats(bracket: TournamentBracket): BracketStats {
  let totalMatches = 0;
  let completedMatches = 0;
  let pendingMatches = 0;
  let inProgressMatches = 0;
  let cancelledMatches = 0;

  bracket.rounds.forEach(round => {
    round.matches.forEach(match => {
      totalMatches++;
      switch (match.status) {
        case "completed":
          completedMatches++;
          break;
        case "pending":
          pendingMatches++;
          break;
        case "in_progress":
          inProgressMatches++;
          break;
        case "cancelled":
          cancelledMatches++;
          break;
      }
    });
  });

  return {
    totalMatches,
    completedMatches,
    pendingMatches,
    inProgressMatches,
    cancelledMatches,
    completionPercentage: totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0
  };
}

function calculateLeagueStats(bracket: LeagueBracket): BracketStats {
  let totalMatches = bracket.fixtures.length;
  let completedMatches = 0;
  let pendingMatches = 0;
  let inProgressMatches = 0;
  let cancelledMatches = 0;

  bracket.fixtures.forEach(fixture => {
    switch (fixture.status) {
      case "completed":
        completedMatches++;
        break;
      case "pending":
        pendingMatches++;
        break;
      case "in_progress":
        inProgressMatches++;
        break;
      case "cancelled":
      case "postponed":
        cancelledMatches++;
        break;
    }
  });

  return {
    totalMatches,
    completedMatches,
    pendingMatches,
    inProgressMatches,
    cancelledMatches,
    completionPercentage: totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0
  };
}


