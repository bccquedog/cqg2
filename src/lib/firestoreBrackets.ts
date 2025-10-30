import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebaseClient";
import { 
  TournamentBracket, 
  LeagueBracket, 
  BracketMatch, 
  LeagueFixture,
  BracketValidationResult 
} from "@/types/brackets";
import { 
  generateSingleEliminationBracket, 
  generateRoundRobinBracket,
  generateRoundRobinLeague,
  validateTournamentBracket,
  validateLeagueBracket
} from "./bracketUtils";

// ========================
// TOURNAMENT BRACKET FUNCTIONS
// ========================

/**
 * Creates a tournament bracket
 */
export async function createTournamentBracket(
  tournamentId: string,
  format: "single_elimination" | "round_robin",
  participants: string[],
  seeding?: Record<string, number>
): Promise<string> {
  try {
    let bracket: TournamentBracket;

    switch (format) {
      case "single_elimination":
        bracket = generateSingleEliminationBracket(tournamentId, participants, seeding);
        break;
      case "round_robin":
        bracket = generateRoundRobinBracket(tournamentId, participants, seeding);
        break;
      default:
        throw new Error(`Unsupported bracket format: ${format}`);
    }

    const docRef = await addDoc(collection(db, "tournaments", tournamentId, "bracket"), bracket);
    return docRef.id;
  } catch (error) {
    console.error("Error creating tournament bracket:", error);
    throw new Error("Failed to create tournament bracket");
  }
}

/**
 * Gets a tournament bracket
 */
export async function getTournamentBracket(tournamentId: string): Promise<TournamentBracket | null> {
  try {
    const bracketRef = doc(db, "tournaments", tournamentId, "bracket", "bracket");
    const bracketDoc = await getDoc(bracketRef);
    
    if (!bracketDoc.exists()) {
      return null;
    }

    return bracketDoc.data() as TournamentBracket;
  } catch (error) {
    console.error("Error getting tournament bracket:", error);
    throw new Error("Failed to get tournament bracket");
  }
}

/**
 * Updates a tournament bracket
 */
export async function updateTournamentBracket(
  tournamentId: string, 
  bracketData: Partial<TournamentBracket>
): Promise<void> {
  try {
    const bracketRef = doc(db, "tournaments", tournamentId, "bracket", "bracket");
    await updateDoc(bracketRef, {
      ...bracketData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating tournament bracket:", error);
    throw new Error("Failed to update tournament bracket");
  }
}

/**
 * Updates a specific match in a tournament bracket
 */
export async function updateTournamentMatch(
  tournamentId: string,
  roundId: string,
  matchId: string,
  matchData: Partial<BracketMatch>
): Promise<void> {
  try {
    const bracket = await getTournamentBracket(tournamentId);
    if (!bracket) {
      throw new Error("Tournament bracket not found");
    }

    // Find and update the match
    const round = bracket.rounds.find(r => r.id === roundId);
    if (!round) {
      throw new Error("Round not found");
    }

    const match = round.matches.find(m => m.id === matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    // Update match data
    Object.assign(match, matchData);

    // Update bracket
    await updateTournamentBracket(tournamentId, { rounds: bracket.rounds });
  } catch (error) {
    console.error("Error updating tournament match:", error);
    throw new Error("Failed to update tournament match");
  }
}

/**
 * Advances tournament to next round
 */
export async function advanceTournamentRound(tournamentId: string): Promise<void> {
  try {
    const bracket = await getTournamentBracket(tournamentId);
    if (!bracket) {
      throw new Error("Tournament bracket not found");
    }

    if (bracket.currentRound >= bracket.totalRounds) {
      throw new Error("Tournament is already at the final round");
    }

    // Check if current round is complete
    const currentRound = bracket.rounds.find(r => r.roundNumber === bracket.currentRound);
    if (!currentRound) {
      throw new Error("Current round not found");
    }

    const incompleteMatches = currentRound.matches.filter(m => m.status !== "completed");
    if (incompleteMatches.length > 0) {
      throw new Error("Current round has incomplete matches");
    }

    // Advance to next round
    const nextRound = bracket.currentRound + 1;
    await updateTournamentBracket(tournamentId, { 
      currentRound: nextRound,
      status: nextRound === bracket.totalRounds ? "completed" : "in_progress"
    });
  } catch (error) {
    console.error("Error advancing tournament round:", error);
    throw new Error("Failed to advance tournament round");
  }
}

// ========================
// LEAGUE BRACKET FUNCTIONS
// ========================

/**
 * Creates a league bracket
 */
export async function createLeagueBracket(
  leagueId: string,
  format: "round_robin",
  participants: string[],
  totalWeeks?: number
): Promise<string> {
  try {
    const bracket = generateRoundRobinLeague(leagueId, participants, totalWeeks);
    
    const docRef = await addDoc(collection(db, "leagues", leagueId, "bracket"), bracket);
    return docRef.id;
  } catch (error) {
    console.error("Error creating league bracket:", error);
    throw new Error("Failed to create league bracket");
  }
}

/**
 * Gets a league bracket
 */
export async function getLeagueBracket(leagueId: string): Promise<LeagueBracket | null> {
  try {
    const bracketRef = doc(db, "leagues", leagueId, "bracket", "bracket");
    const bracketDoc = await getDoc(bracketRef);
    
    if (!bracketDoc.exists()) {
      return null;
    }

    return bracketDoc.data() as LeagueBracket;
  } catch (error) {
    console.error("Error getting league bracket:", error);
    throw new Error("Failed to get league bracket");
  }
}

/**
 * Updates a league bracket
 */
export async function updateLeagueBracket(
  leagueId: string, 
  bracketData: Partial<LeagueBracket>
): Promise<void> {
  try {
    const bracketRef = doc(db, "leagues", leagueId, "bracket", "bracket");
    await updateDoc(bracketRef, {
      ...bracketData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating league bracket:", error);
    throw new Error("Failed to update league bracket");
  }
}

/**
 * Updates a specific fixture in a league bracket
 */
export async function updateLeagueFixture(
  leagueId: string,
  fixtureId: string,
  fixtureData: Partial<LeagueFixture>
): Promise<void> {
  try {
    const bracket = await getLeagueBracket(leagueId);
    if (!bracket) {
      throw new Error("League bracket not found");
    }

    // Find and update the fixture
    const fixture = bracket.fixtures.find(f => f.id === fixtureId);
    if (!fixture) {
      throw new Error("Fixture not found");
    }

    // Update fixture data
    Object.assign(fixture, fixtureData);

    // If match is completed, update standings
    if (fixtureData.status === "completed" && fixtureData.winner && fixtureData.score) {
      await updateLeagueStandings(leagueId, fixture);
    }

    // Update bracket
    await updateLeagueBracket(leagueId, { fixtures: bracket.fixtures });
  } catch (error) {
    console.error("Error updating league fixture:", error);
    throw new Error("Failed to update league fixture");
  }
}

/**
 * Updates league standings based on completed fixture
 */
async function updateLeagueStandings(leagueId: string, fixture: LeagueFixture): Promise<void> {
  try {
    const bracket = await getLeagueBracket(leagueId);
    if (!bracket || !fixture.score) return;

    const homeStanding = bracket.standings.find(s => s.teamId === fixture.homeTeam.id);
    const awayStanding = bracket.standings.find(s => s.teamId === fixture.awayTeam.id);

    if (!homeStanding || !awayStanding) return;

    // Update matches played
    homeStanding.matchesPlayed++;
    awayStanding.matchesPlayed++;

    // Update goals
    homeStanding.goalsFor = (homeStanding.goalsFor || 0) + fixture.score.home;
    homeStanding.goalsAgainst = (homeStanding.goalsAgainst || 0) + fixture.score.away;
    awayStanding.goalsFor = (awayStanding.goalsFor || 0) + fixture.score.away;
    awayStanding.goalsAgainst = (awayStanding.goalsAgainst || 0) + fixture.score.home;

    // Update goal difference
    homeStanding.goalDifference = (homeStanding.goalsFor || 0) - (homeStanding.goalsAgainst || 0);
    awayStanding.goalDifference = (awayStanding.goalsFor || 0) - (awayStanding.goalsAgainst || 0);

    // Determine winner and update points
    if (fixture.score.home > fixture.score.away) {
      // Home team wins
      homeStanding.wins++;
      homeStanding.points += 3;
      awayStanding.losses++;
    } else if (fixture.score.away > fixture.score.home) {
      // Away team wins
      awayStanding.wins++;
      awayStanding.points += 3;
      homeStanding.losses++;
    } else {
      // Draw
      homeStanding.draws = (homeStanding.draws || 0) + 1;
      homeStanding.points += 1;
      awayStanding.draws = (awayStanding.draws || 0) + 1;
      awayStanding.points += 1;
    }

    // Update win percentage
    homeStanding.winPercentage = homeStanding.matchesPlayed > 0 
      ? (homeStanding.wins / homeStanding.matchesPlayed) * 100 
      : 0;
    awayStanding.winPercentage = awayStanding.matchesPlayed > 0 
      ? (awayStanding.wins / awayStanding.matchesPlayed) * 100 
      : 0;

    // Update bracket with new standings
    await updateLeagueBracket(leagueId, { standings: bracket.standings });
  } catch (error) {
    console.error("Error updating league standings:", error);
    throw new Error("Failed to update league standings");
  }
}

// ========================
// BRACKET VALIDATION FUNCTIONS
// ========================

/**
 * Validates a tournament bracket
 */
export async function validateTournamentBracketData(tournamentId: string): Promise<BracketValidationResult> {
  try {
    const bracket = await getTournamentBracket(tournamentId);
    if (!bracket) {
      return {
        isValid: false,
        errors: ["Tournament bracket not found"],
        warnings: [],
        stats: {
          totalMatches: 0,
          completedMatches: 0,
          pendingMatches: 0,
          inProgressMatches: 0,
          cancelledMatches: 0,
          completionPercentage: 0
        }
      };
    }

    return validateTournamentBracket(bracket);
  } catch (error) {
    console.error("Error validating tournament bracket:", error);
    throw new Error("Failed to validate tournament bracket");
  }
}

/**
 * Validates a league bracket
 */
export async function validateLeagueBracketData(leagueId: string): Promise<BracketValidationResult> {
  try {
    const bracket = await getLeagueBracket(leagueId);
    if (!bracket) {
      return {
        isValid: false,
        errors: ["League bracket not found"],
        warnings: [],
        stats: {
          totalMatches: 0,
          completedMatches: 0,
          pendingMatches: 0,
          inProgressMatches: 0,
          cancelledMatches: 0,
          completionPercentage: 0
        }
      };
    }

    return validateLeagueBracket(bracket);
  } catch (error) {
    console.error("Error validating league bracket:", error);
    throw new Error("Failed to validate league bracket");
  }
}


