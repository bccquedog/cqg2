import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

interface Match {
  id: string;
  playerA: string;
  playerB: string;
  playerAId: string;
  playerBId: string;
  round: number;
  roundNumber: number;
  status: 'pending' | 'live' | 'completed';
  winner?: string;
  winnerId?: string;
  scoreA: number;
  scoreB: number;
}

interface Tournament {
  id: string;
  status: string;
  settings: {
    autoProgress: boolean;
    simulationMode?: boolean;
  };
  currentRound: number;
  totalRounds: number;
}

export class AutoProgressionManager {
  private tournamentId: string;

  constructor(tournamentId: string) {
    this.tournamentId = tournamentId;
  }

  /**
   * Main auto-progression handler - called when a match is completed
   */
  async handleMatchCompletion(matchId: string): Promise<void> {
    try {
      console.log(`🔄 Auto-progression triggered for match ${matchId}`);

      // Get tournament settings
      const tournament = await this.getTournament();
      if (!tournament?.settings?.autoProgress) {
        console.log('⏸️ Auto-progression disabled for this tournament');
        return;
      }

      // Get the completed match
      const match = await this.getMatch(matchId);
      if (!match || match.status !== 'completed') {
        console.log('❌ Match not found or not completed');
        return;
      }

      // Determine winner (manual or simulation)
      const winner = await this.determineWinner(match, tournament);
      if (!winner) {
        console.log('❌ Could not determine winner');
        return;
      }

      // Update match with winner if not already set
      if (!match.winner) {
        await this.updateMatchWinner(matchId, winner);
      }

      // Check if we need to create next round matches
      await this.progressToNextRound(match, winner);

      console.log(`✅ Auto-progression completed for match ${matchId}, winner: ${winner}`);
    } catch (error) {
      console.error('❌ Auto-progression failed:', error);
      throw error;
    }
  }

  /**
   * Get tournament data and settings
   */
  private async getTournament(): Promise<Tournament | null> {
    const tournamentRef = doc(db, 'tournaments', this.tournamentId);
    const tournamentDoc = await getDoc(tournamentRef);
    
    if (!tournamentDoc.exists()) {
      return null;
    }

    return {
      id: tournamentDoc.id,
      ...tournamentDoc.data()
    } as Tournament;
  }

  /**
   * Get match data
   */
  private async getMatch(matchId: string): Promise<Match | null> {
    const matchRef = doc(db, 'tournaments', this.tournamentId, 'matches', matchId);
    const matchDoc = await getDoc(matchRef);
    
    if (!matchDoc.exists()) {
      return null;
    }

    return {
      id: matchDoc.id,
      ...matchDoc.data()
    } as Match;
  }

  /**
   * Determine winner - manual or simulation mode
   */
  private async determineWinner(match: Match, tournament: Tournament): Promise<string | null> {
    // If winner is already set manually, use it
    if (match.winner) {
      return match.winner;
    }

    // If simulation mode is enabled, pick random winner
    if (tournament.settings?.simulationMode) {
      const isPlayerAWinner = Math.random() > 0.5;
      const winner = isPlayerAWinner ? match.playerA : match.playerB;
      console.log(`🎲 Simulation mode: Random winner selected: ${winner}`);
      return winner;
    }

    // If no manual winner and no simulation, return null
    console.log('⚠️ No winner set and simulation mode disabled');
    return null;
  }

  /**
   * Update match with winner information
   */
  private async updateMatchWinner(matchId: string, winner: string): Promise<void> {
    const matchRef = doc(db, 'tournaments', this.tournamentId, 'matches', matchId);
    await updateDoc(matchRef, {
      winner,
      winnerId: winner,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Progress to next round if all matches in current round are complete
   */
  private async progressToNextRound(completedMatch: Match, winner: string): Promise<void> {
    const currentRound = completedMatch.round;
    
    // Get all matches in the current round
    const currentRoundMatches = await this.getMatchesInRound(currentRound);
    
    // Check if all matches in current round are completed
    const allCompleted = currentRoundMatches.every(match => match.status === 'completed');
    
    if (!allCompleted) {
      console.log(`⏳ Round ${currentRound} not yet complete, waiting for other matches`);
      return;
    }

    console.log(`🎯 Round ${currentRound} complete! Progressing to next round...`);

    // Get all winners from current round
    const winners = currentRoundMatches
      .map(match => match.winner)
      .filter(winner => winner) as string[];

    // Create next round matches
    const nextRound = currentRound + 1;
    await this.createNextRoundMatches(winners, nextRound);

    // Update tournament status
    await this.updateTournamentProgress(nextRound, winners.length);

    console.log(`✅ Created Round ${nextRound} with ${winners.length} players`);
  }

  /**
   * Get all matches in a specific round
   */
  private async getMatchesInRound(round: number): Promise<Match[]> {
    const matchesQuery = query(
      collection(db, 'tournaments', this.tournamentId, 'matches'),
      where('round', '==', round)
    );

    const matchesSnapshot = await getDocs(matchesQuery);
    return matchesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Match[];
  }

  /**
   * Create matches for the next round
   */
  private async createNextRoundMatches(winners: string[], nextRound: number): Promise<void> {
    // Shuffle winners for random seeding
    const shuffledWinners = [...winners].sort(() => Math.random() - 0.5);

    // Create matches in pairs
    for (let i = 0; i < shuffledWinners.length; i += 2) {
      if (i + 1 < shuffledWinners.length) {
        const playerA = shuffledWinners[i];
        const playerB = shuffledWinners[i + 1];

        await addDoc(collection(db, 'tournaments', this.tournamentId, 'matches'), {
          playerA,
          playerB,
          playerAId: playerA,
          playerBId: playerB,
          round: nextRound,
          roundNumber: nextRound,
          status: 'pending',
          scoreA: 0,
          scoreB: 0,
          winner: null,
          winnerId: null,
          submittedAt: null,
          reportedBy: null,
          createdAt: serverTimestamp(),
          streamLink: null
        });

        console.log(`🎮 Created match: ${playerA} vs ${playerB} (Round ${nextRound})`);
      }
    }
  }

  /**
   * Update tournament progress and status
   */
  private async updateTournamentProgress(currentRound: number, remainingPlayers: number): Promise<void> {
    const tournamentRef = doc(db, 'tournaments', this.tournamentId);
    
    const updateData: any = {
      currentRound,
      updatedAt: serverTimestamp()
    };

    // Check if tournament is complete (only 1 player left)
    if (remainingPlayers === 1) {
      updateData.status = 'completed';
      updateData.champion = remainingPlayers > 0 ? 'TBD' : null; // Will be set when final match completes
      console.log('🏆 Tournament completed!');
    } else if (currentRound > 1) {
      updateData.status = 'live';
      console.log(`🔥 Tournament now live with ${remainingPlayers} players remaining`);
    }

    await updateDoc(tournamentRef, updateData);
  }

  /**
   * Set tournament champion when final match completes
   */
  async setTournamentChampion(champion: string): Promise<void> {
    const tournamentRef = doc(db, 'tournaments', this.tournamentId);
    await updateDoc(tournamentRef, {
      champion,
      status: 'completed',
      updatedAt: serverTimestamp()
    });

    console.log(`👑 Tournament champion set: ${champion}`);
  }

  /**
   * Enable/disable auto-progression for tournament
   */
  async setAutoProgress(enabled: boolean, simulationMode: boolean = false): Promise<void> {
    const tournamentRef = doc(db, 'tournaments', this.tournamentId);
    await updateDoc(tournamentRef, {
      'settings.autoProgress': enabled,
      'settings.simulationMode': simulationMode,
      updatedAt: serverTimestamp()
    });

    console.log(`⚙️ Auto-progression ${enabled ? 'enabled' : 'disabled'} (simulation: ${simulationMode})`);
  }
}

/**
 * Utility function to trigger auto-progression
 */
export async function triggerAutoProgression(tournamentId: string, matchId: string): Promise<void> {
  const manager = new AutoProgressionManager(tournamentId);
  await manager.handleMatchCompletion(matchId);
}

/**
 * Utility function to set auto-progression settings
 */
export async function setAutoProgressSettings(
  tournamentId: string, 
  enabled: boolean, 
  simulationMode: boolean = false
): Promise<void> {
  const manager = new AutoProgressionManager(tournamentId);
  await manager.setAutoProgress(enabled, simulationMode);
}


