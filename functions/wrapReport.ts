import * as admin from "firebase-admin";

// Lazy initialization to prevent duplicate Firebase app errors
function getDb() {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return admin.firestore();
}

export async function generateWrapReport(competitionId: string) {
  const db = getDb();
  
  try {
    // Get bracket data
    const bracketRef = db.collection("tournaments").doc(competitionId).collection("bracket").doc("bracketDoc");
    const bracketSnap = await bracketRef.get();
    if (!bracketSnap.exists) {
      throw new Error("🚫 Bracket not found");
    }

    const bracket = bracketSnap.data();
    if (!bracket) {
      throw new Error("🚫 Bracket data not found");
    }

    const rounds = bracket.rounds || [];

    let champion = null;
    let matches: any[] = [];
    let stats: Record<string, { wins: number; losses: number; totalPoints: number }> = {};

    // Loop through all rounds and matches
    rounds.forEach((round: any) => {
      if (!round.matches || !Array.isArray(round.matches)) {
        return; // Skip invalid rounds
      }

      round.matches.forEach((m: any) => {
        if (!m.matchId) {
          return; // Skip invalid matches
        }

        matches.push({
          matchId: m.matchId,
          players: m.players || [],
          scores: m.scores || {},
          winner: m.winner || null,
          status: m.status || "unknown",
          roundNumber: round.roundNumber || 0,
        });

        // Build player statistics
        if (m.players && Array.isArray(m.players)) {
          m.players.forEach((p: string) => {
            if (!p) return;
            
            if (!stats[p]) {
              stats[p] = { wins: 0, losses: 0, totalPoints: 0 };
            }

            const score = m.scores?.[p] ?? 0;
            stats[p].totalPoints += score;

            if (m.winner === p) {
              stats[p].wins++;
            } else if (m.winner && m.winner !== p) {
              stats[p].losses++;
            }
          });
        }

        // Find champion (final round winner)
        if (round.roundNumber === rounds.length && m.winner) {
          champion = m.winner;
        }
      });
    });

    // Generate comprehensive report
    const report = {
      competitionId,
      completedAt: new Date().toISOString(),
      champion,
      totalMatches: matches.length,
      totalRounds: rounds.length,
      bracketSnapshot: bracket,
      matches,
      stats,
      summary: {
        totalPlayers: Object.keys(stats).length,
        completedMatches: matches.filter(m => m.status === "completed").length,
        averagePointsPerPlayer: Object.keys(stats).length > 0 
          ? Object.values(stats).reduce((sum, s) => sum + s.totalPoints, 0) / Object.keys(stats).length 
          : 0,
      }
    };

    // Save report to Firestore
    await db.collection("tournaments").doc(competitionId).collection("reports").doc("final").set(report);

    console.log(`🏆 Wrap report generated for ${competitionId}:`);
    console.log(`   Champion: ${champion || "No champion determined"}`);
    console.log(`   Total Matches: ${matches.length}`);
    console.log(`   Total Players: ${Object.keys(stats).length}`);
    console.log(`   Completed Matches: ${report.summary.completedMatches}`);

    // Update tournament status to completed
    await db.collection("tournaments").doc(competitionId).update({ status: "completed" });
    console.log(`✅ Tournament ${competitionId} marked as completed`);

    // Update leaderboards with the new report data
    try {
      // Get tournament data to determine game and league
      const tournamentDoc = await db.collection("tournaments").doc(competitionId).get();
      const tournamentData = tournamentDoc.data();
      
      if (tournamentData) {
        const gameId = tournamentData.game || 'unknown';
        const leagueId = tournamentData.leagueId; // May be undefined for tournaments
        
        await updateLeaderboards(report, gameId, leagueId);
      }
    } catch (leaderboardError) {
      console.error(`⚠️ Warning: Failed to update leaderboards for ${competitionId}:`, leaderboardError);
      // Don't throw here - wrap report generation should still succeed
    }

    // Example: Update leaderboards with specific game and league context
    // await updateLeaderboards(report, "cod", "league1");
    
    return report;

  } catch (error) {
    console.error(`❌ Error generating wrap report for ${competitionId}:`, error);
    throw error;
  }
}

// Helper function to get wrap report
export async function getWrapReport(competitionId: string) {
  const db = getDb();
  
  try {
    const reportRef = db.collection("tournaments").doc(competitionId).collection("reports").doc("final");
    const reportSnap = await reportRef.get();
    
    if (!reportSnap.exists) {
      throw new Error("🚫 Wrap report not found");
    }
    
    return reportSnap.data();
  } catch (error) {
    console.error(`❌ Error getting wrap report for ${competitionId}:`, error);
    throw error;
  }
}

// Helper function to check if wrap report exists
export async function hasWrapReport(competitionId: string): Promise<boolean> {
  const db = getDb();
  
  try {
    const reportRef = db.collection("tournaments").doc(competitionId).collection("reports").doc("final");
    const reportSnap = await reportRef.get();
    return reportSnap.exists;
  } catch (error) {
    console.error(`❌ Error checking wrap report for ${competitionId}:`, error);
    return false;
  }
}

/**
 * Update leaderboards based on wrap report data
 */
export async function updateLeaderboards(report: any, gameId: string, leagueId?: string) {
  const db = getDb();
  
  try {
    const collections = ["global", gameId];
    if (leagueId) collections.push(leagueId);

    console.log(`📊 Updating leaderboards for collections: ${collections.join(', ')}`);

    for (const col of collections) {
      const ref = db.collection("leaderboards").doc(col).collection("players");

      for (const [userId, stats] of Object.entries(report.stats)) {
        const docRef = ref.doc(userId);
        await db.runTransaction(async (t) => {
          const snap = await t.get(docRef);
          const existingData = snap.exists ? snap.data() : null;
          const existing = existingData || { 
            wins: 0, 
            losses: 0, 
            totalPoints: 0, 
            titles: 0,
            gamesPlayed: 0,
            lastUpdated: new Date().toISOString()
          };

          const updatedStats = {
            wins: (existing.wins || 0) + (stats as any).wins,
            losses: (existing.losses || 0) + (stats as any).losses,
            totalPoints: (existing.totalPoints || 0) + (stats as any).totalPoints,
            titles: (existing.titles || 0) + (report.champion === userId ? 1 : 0),
            gamesPlayed: (existing.gamesPlayed || 0) + ((stats as any).wins + (stats as any).losses),
            lastUpdated: new Date().toISOString(),
          };

          t.set(docRef, updatedStats);
        });

        console.log(`   ✅ Updated stats for ${userId} in ${col} leaderboard`);
      }
    }

    console.log(`📊 Leaderboards updated for game: ${gameId}${leagueId ? `, league: ${leagueId}` : ""}`);
  } catch (error) {
    console.error(`❌ Error updating leaderboards:`, error);
    throw error;
  }
}
