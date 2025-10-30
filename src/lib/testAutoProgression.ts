import { db } from '@/lib/firebase';
import { doc, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

/**
 * Test utility for auto-progression
 * Simulates match completions to test the auto-progression system
 */
export class AutoProgressionTester {
  private tournamentId: string;

  constructor(tournamentId: string) {
    this.tournamentId = tournamentId;
  }

  /**
   * Complete a specific match with random winner
   */
  async completeMatch(matchId: string, winner?: string): Promise<void> {
    try {
      const matchRef = doc(db, 'tournaments', this.tournamentId, 'matches', matchId);
      
      // Get current match data
      const matchDoc = await matchRef.get();
      if (!matchDoc.exists()) {
        throw new Error('Match not found');
      }

      const matchData = matchDoc.data();
      
      // Determine winner
      const selectedWinner = winner || (Math.random() > 0.5 ? matchData.playerA : matchData.playerB);
      const isPlayerAWinner = selectedWinner === matchData.playerA;
      
      // Update match with completion
      await updateDoc(matchRef, {
        status: 'completed',
        winner: selectedWinner,
        winnerId: selectedWinner,
        scoreA: isPlayerAWinner ? 2 : 0,
        scoreB: isPlayerAWinner ? 0 : 2,
        submittedAt: serverTimestamp(),
        reportedBy: 'test-system',
        updatedAt: serverTimestamp()
      });

      console.log(`✅ Match ${matchId} completed with winner: ${selectedWinner}`);
    } catch (error) {
      console.error('❌ Failed to complete match:', error);
      throw error;
    }
  }

  /**
   * Complete all matches in a specific round
   */
  async completeRound(round: number): Promise<void> {
    try {
      const matchesQuery = query(
        collection(db, 'tournaments', this.tournamentId, 'matches'),
        where('round', '==', round),
        where('status', '==', 'pending')
      );

      const matchesSnapshot = await getDocs(matchesQuery);
      const matches = matchesSnapshot.docs;

      console.log(`🎯 Completing ${matches.length} matches in Round ${round}`);

      // Complete all matches with random winners
      for (const matchDoc of matches) {
        const matchData = matchDoc.data();
        const winner = Math.random() > 0.5 ? matchData.playerA : matchData.playerB;
        const isPlayerAWinner = winner === matchData.playerA;

        await updateDoc(matchDoc.ref, {
          status: 'completed',
          winner,
          winnerId: winner,
          scoreA: isPlayerAWinner ? 2 : 0,
          scoreB: isPlayerAWinner ? 0 : 2,
          submittedAt: serverTimestamp(),
          reportedBy: 'test-system',
          updatedAt: serverTimestamp()
        });

        console.log(`  ✅ ${matchData.playerA} vs ${matchData.playerB} → ${winner} wins`);
      }

      console.log(`🎉 Round ${round} completed! Auto-progression should trigger next round.`);
    } catch (error) {
      console.error('❌ Failed to complete round:', error);
      throw error;
    }
  }

  /**
   * Run a full tournament simulation
   */
  async simulateFullTournament(): Promise<void> {
    try {
      console.log('🚀 Starting full tournament simulation...');

      // Get tournament info
      const tournamentRef = doc(db, 'tournaments', this.tournamentId);
      const tournamentDoc = await tournamentRef.get();
      if (!tournamentDoc.exists()) {
        throw new Error('Tournament not found');
      }

      const tournament = tournamentDoc.data();
      const totalRounds = tournament.totalRounds || 4;

      // Complete each round
      for (let round = 1; round <= totalRounds; round++) {
        console.log(`\n🎮 Processing Round ${round}...`);
        await this.completeRound(round);
        
        // Wait a bit between rounds to see progression
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      console.log('\n🏆 Tournament simulation completed!');
    } catch (error) {
      console.error('❌ Tournament simulation failed:', error);
      throw error;
    }
  }

  /**
   * Get current tournament state
   */
  async getTournamentState(): Promise<any> {
    try {
      const tournamentRef = doc(db, 'tournaments', this.tournamentId);
      const tournamentDoc = await tournamentRef.get();
      
      if (!tournamentDoc.exists()) {
        throw new Error('Tournament not found');
      }

      const tournament = tournamentDoc.data();

      // Get all matches
      const matchesQuery = query(
        collection(db, 'tournaments', this.tournamentId, 'matches')
      );
      const matchesSnapshot = await getDocs(matchesQuery);
      const matches = matchesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        tournament: { id: tournamentDoc.id, ...tournament },
        matches,
        rounds: this.groupMatchesByRound(matches)
      };
    } catch (error) {
      console.error('❌ Failed to get tournament state:', error);
      throw error;
    }
  }

  /**
   * Group matches by round
   */
  private groupMatchesByRound(matches: any[]): { [round: number]: any[] } {
    const rounds: { [round: number]: any[] } = {};
    
    matches.forEach(match => {
      const round = match.round || 1;
      if (!rounds[round]) {
        rounds[round] = [];
      }
      rounds[round].push(match);
    });

    return rounds;
  }
}

/**
 * Utility function to test auto-progression
 */
export async function testAutoProgression(tournamentId: string, round?: number): Promise<void> {
  const tester = new AutoProgressionTester(tournamentId);
  
  if (round) {
    await tester.completeRound(round);
  } else {
    await tester.simulateFullTournament();
  }
}


