import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

/**
 * Auto-progression trigger for match completion
 * Triggers when a match document is updated and status becomes 'completed'
 */
export const onMatchCompletion = functions.firestore.onDocumentUpdated(
  'tournaments/{tournamentId}/matches/{matchId}',
  async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const tournamentId = context.params.tournamentId;
    const matchId = context.params.matchId;

    console.log(`Match update detected: ${tournamentId}/${matchId}`);

    // Check if match status changed to 'completed'
    if (beforeData?.status !== 'completed' && afterData?.status === 'completed') {
      console.log(`Match ${matchId} completed, triggering auto-progression`);

      try {
        await handleAutoProgression(tournamentId, matchId, afterData);
      } catch (error) {
        console.error('Auto-progression failed:', error);
      }
    }
  }
);

/**
 * Handle auto-progression logic
 */
async function handleAutoProgression(tournamentId: string, matchId: string, matchData: any) {
  // Get tournament settings
  const tournamentRef = db.collection('tournaments').doc(tournamentId);
  const tournamentDoc = await tournamentRef.get();
  
  if (!tournamentDoc.exists) {
    console.error(`Tournament ${tournamentId} not found`);
    return;
  }

  const tournament = tournamentDoc.data();
  
  // Check if auto-progression is enabled
  if (!tournament?.settings?.autoProgress) {
    console.log(`Auto-progression disabled for tournament ${tournamentId}`);
    return;
  }

  // Determine winner
  let winner = matchData.winner;
  
  // If no winner set and simulation mode enabled, pick random winner
  if (!winner && tournament.settings?.simulationMode) {
    const isPlayerAWinner = Math.random() > 0.5;
    winner = isPlayerAWinner ? matchData.playerA : matchData.playerB;
    
    // Update match with random winner
    await db.collection('tournaments').doc(tournamentId)
      .collection('matches').doc(matchId)
      .update({
        winner,
        winnerId: winner,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    
    console.log(`Simulation mode: Random winner selected: ${winner}`);
  }

  if (!winner) {
    console.warn(`No winner determined for match ${matchId}`);
    return;
  }

  // Check if we need to progress to next round
  await progressToNextRound(tournamentId, matchData, winner);
}

/**
 * Progress to next round if all matches in current round are complete
 */
async function progressToNextRound(tournamentId: string, completedMatch: any, winner: string) {
  const currentRound = completedMatch.round;
  
  // Get all matches in current round
  const currentRoundMatches = await db.collection('tournaments').doc(tournamentId)
    .collection('matches')
    .where('round', '==', currentRound)
    .get();

  // Check if all matches in current round are completed
  const allCompleted = currentRoundMatches.docs.every(doc => doc.data().status === 'completed');
  
  if (!allCompleted) {
    console.log(`Round ${currentRound} not yet complete, waiting for other matches`);
    return;
  }

  console.log(`Round ${currentRound} complete! Progressing to next round...`);

  // Get all winners from current round
  const winners = currentRoundMatches.docs
    .map(doc => doc.data().winner)
    .filter(winner => winner);

  // Create next round matches
  const nextRound = currentRound + 1;
  await createNextRoundMatches(tournamentId, winners, nextRound);

  // Update tournament status
  await updateTournamentProgress(tournamentId, nextRound, winners.length);

  console.log(`Created Round ${nextRound} with ${winners.length} players`);
}

/**
 * Create matches for the next round
 */
async function createNextRoundMatches(tournamentId: string, winners: string[], nextRound: number) {
  // Shuffle winners for random seeding
  const shuffledWinners = [...winners].sort(() => Math.random() - 0.5);

  // Create matches in pairs
  for (let i = 0; i < shuffledWinners.length; i += 2) {
    if (i + 1 < shuffledWinners.length) {
      const playerA = shuffledWinners[i];
      const playerB = shuffledWinners[i + 1];

      await db.collection('tournaments').doc(tournamentId)
        .collection('matches')
        .add({
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
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          streamLink: null
        });

      console.log(`Created match: ${playerA} vs ${playerB} (Round ${nextRound})`);
    }
  }
}

/**
 * Update tournament progress and status
 */
async function updateTournamentProgress(tournamentId: string, currentRound: number, remainingPlayers: number) {
  const tournamentRef = db.collection('tournaments').doc(tournamentId);
  
  const updateData: any = {
    currentRound,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  // Check if tournament is complete (only 1 player left)
  if (remainingPlayers === 1) {
    updateData.status = 'completed';
    updateData.champion = 'TBD'; // Will be set when final match completes
    console.log('Tournament completed!');
  } else if (currentRound > 1) {
    updateData.status = 'live';
    console.log(`Tournament now live with ${remainingPlayers} players remaining`);
  }

  await tournamentRef.update(updateData);
}


