import * as admin from "firebase-admin";
import { LeaderboardEntry, GlobalLeaderboard, GameLeaderboard, LeagueLeaderboard, LeaderboardStats } from "../src/types/leaderboards";

// Lazy initialization to prevent duplicate Firebase app errors
function getDb() {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return admin.firestore();
}

export interface PlayerStats {
  userId: string;
  username: string;
  wins: number;
  losses: number;
  totalPoints: number;
  gamesPlayed: number;
  lastPlayed: string;
  streak: {
    current: number;
    type: 'win' | 'loss' | 'none';
  };
  achievements: string[];
  gameStats: Record<string, {
    wins: number;
    losses: number;
    totalPoints: number;
    gamesPlayed: number;
  }>;
  leagueStats: Record<string, {
    wins: number;
    losses: number;
    totalPoints: number;
    gamesPlayed: number;
  }>;
}

export class LeaderboardCalculator {
  private db: admin.firestore.Firestore;

  constructor() {
    this.db = getDb();
  }

  /**
   * Calculate tier based on score and win rate
   */
  private calculateTier(score: number, winRate: number): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master' | 'Grandmaster' {
    if (score >= 3000 && winRate >= 0.8) return 'Grandmaster';
    if (score >= 2500 && winRate >= 0.75) return 'Master';
    if (score >= 2000 && winRate >= 0.7) return 'Diamond';
    if (score >= 1500 && winRate >= 0.65) return 'Platinum';
    if (score >= 1000 && winRate >= 0.6) return 'Gold';
    if (score >= 500 && winRate >= 0.5) return 'Silver';
    return 'Bronze';
  }

  /**
   * Calculate badge based on achievements and performance
   */
  private calculateBadge(achievements: string[], winRate: number, gamesPlayed: number): string {
    if (achievements.includes('champion')) return '🏆';
    if (achievements.includes('undefeated')) return '⚡';
    if (winRate >= 0.8) return '🔥';
    if (gamesPlayed >= 100) return '🎯';
    if (achievements.includes('comeback')) return '💪';
    return '⭐';
  }

  /**
   * Calculate score based on wins, losses, and points
   */
  private calculateScore(wins: number, losses: number, totalPoints: number): number {
    const winRate = wins + losses > 0 ? wins / (wins + losses) : 0;
    const baseScore = wins * 100 + totalPoints * 0.1;
    const winRateBonus = winRate * 500;
    return Math.round(baseScore + winRateBonus);
  }

  /**
   * Get all player statistics from matches and competitions
   */
  private async getPlayerStats(): Promise<PlayerStats[]> {
    const players = new Map<string, PlayerStats>();

    // Get all matches
    const matchesSnapshot = await this.db.collection('matches').get();
    
    for (const matchDoc of matchesSnapshot.docs) {
      const match = matchDoc.data();
      if (!match.teams || !Array.isArray(match.teams)) continue;

      for (const team of match.teams) {
        if (!team.players || !Array.isArray(team.players)) continue;

        for (const playerId of team.players) {
          if (!players.has(playerId)) {
            // Get user data
            const userDoc = await this.db.collection('users').doc(playerId).get();
            const userData = userDoc.data();
            
            players.set(playerId, {
              userId: playerId,
              username: userData?.username || `User ${playerId}`,
              wins: 0,
              losses: 0,
              totalPoints: 0,
              gamesPlayed: 0,
              lastPlayed: match.createdAt || new Date().toISOString(),
              streak: { current: 0, type: 'none' },
              achievements: [],
              gameStats: {},
              leagueStats: {}
            });
          }

          const player = players.get(playerId)!;
          player.gamesPlayed++;
          player.totalPoints += team.score || 0;
          player.lastPlayed = match.createdAt || new Date().toISOString();

          // Determine win/loss
          const isWinner = match.winnerTeamId === team.teamId;
          if (isWinner) {
            player.wins++;
          } else {
            player.losses++;
          }

          // Update game stats
          const gameId = match.game || 'unknown';
          if (!player.gameStats[gameId]) {
            player.gameStats[gameId] = { wins: 0, losses: 0, totalPoints: 0, gamesPlayed: 0 };
          }
          player.gameStats[gameId].gamesPlayed++;
          player.gameStats[gameId].totalPoints += team.score || 0;
          if (isWinner) {
            player.gameStats[gameId].wins++;
          } else {
            player.gameStats[gameId].losses++;
          }

          // Update league stats if applicable
          if (match.leagueId) {
            if (!player.leagueStats[match.leagueId]) {
              player.leagueStats[match.leagueId] = { wins: 0, losses: 0, totalPoints: 0, gamesPlayed: 0 };
            }
            player.leagueStats[match.leagueId].gamesPlayed++;
            player.leagueStats[match.leagueId].totalPoints += team.score || 0;
            if (isWinner) {
              player.leagueStats[match.leagueId].wins++;
            } else {
              player.leagueStats[match.leagueId].losses++;
            }
          }
        }
      }
    }

    return Array.from(players.values());
  }

  /**
   * Calculate streak for a player
   */
  private calculateStreak(player: PlayerStats): { current: number; type: 'win' | 'loss' | 'none' } {
    // This is a simplified streak calculation
    // In a real implementation, you'd need to track match history chronologically
    const winRate = player.gamesPlayed > 0 ? player.wins / player.gamesPlayed : 0;
    
    if (winRate >= 0.6) {
      return { current: Math.min(player.wins, 10), type: 'win' };
    } else if (winRate <= 0.4) {
      return { current: Math.min(player.losses, 10), type: 'loss' };
    }
    
    return { current: 0, type: 'none' };
  }

  /**
   * Generate global leaderboard
   */
  async generateGlobalLeaderboard(): Promise<GlobalLeaderboard> {
    const playerStats = await this.getPlayerStats();
    
    const entries: LeaderboardEntry[] = playerStats
      .filter(player => player.gamesPlayed > 0)
      .map(player => {
        const score = this.calculateScore(player.wins, player.losses, player.totalPoints);
        const winRate = player.gamesPlayed > 0 ? player.wins / player.gamesPlayed : 0;
        const tier = this.calculateTier(score, winRate);
        const badge = this.calculateBadge(player.achievements, winRate, player.gamesPlayed);
        const streak = this.calculateStreak(player);

        return {
          userId: player.userId,
          username: player.username,
          rank: 0, // Will be set after sorting
          score,
          wins: player.wins,
          losses: player.losses,
          winRate,
          totalPoints: player.totalPoints,
          averagePoints: player.gamesPlayed > 0 ? player.totalPoints / player.gamesPlayed : 0,
          gamesPlayed: player.gamesPlayed,
          lastPlayed: player.lastPlayed,
          streak,
          achievements: player.achievements,
          tier,
          badge
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    // Get game and competition counts
    const gamesSnapshot = await this.db.collection('games').get();
    const tournamentsSnapshot = await this.db.collection('tournaments').get();
    const leaguesSnapshot = await this.db.collection('leagues').get();

    return {
      id: 'global',
      type: 'global',
      title: 'Global Leaderboard',
      description: 'Overall performance across all games and competitions',
      lastUpdated: new Date().toISOString(),
      totalPlayers: entries.length,
      entries: entries.slice(0, 100), // Top 100 players
      metadata: {
        season: 'S1',
        period: 'all-time',
        gameCount: gamesSnapshot.size,
        competitionCount: tournamentsSnapshot.size + leaguesSnapshot.size
      }
    };
  }

  /**
   * Generate game-specific leaderboard
   */
  async generateGameLeaderboard(gameId: string): Promise<GameLeaderboard> {
    const playerStats = await this.getPlayerStats();
    
    // Get game data
    const gameDoc = await this.db.collection('games').doc(gameId).get();
    const gameData = gameDoc.data();
    
    const entries: LeaderboardEntry[] = playerStats
      .filter(player => player.gameStats[gameId] && player.gameStats[gameId].gamesPlayed > 0)
      .map(player => {
        const gameStats = player.gameStats[gameId];
        const score = this.calculateScore(gameStats.wins, gameStats.losses, gameStats.totalPoints);
        const winRate = gameStats.gamesPlayed > 0 ? gameStats.wins / gameStats.gamesPlayed : 0;
        const tier = this.calculateTier(score, winRate);
        const badge = this.calculateBadge(player.achievements, winRate, gameStats.gamesPlayed);
        const streak = this.calculateStreak(player);

        return {
          userId: player.userId,
          username: player.username,
          rank: 0, // Will be set after sorting
          score,
          wins: gameStats.wins,
          losses: gameStats.losses,
          winRate,
          totalPoints: gameStats.totalPoints,
          averagePoints: gameStats.gamesPlayed > 0 ? gameStats.totalPoints / gameStats.gamesPlayed : 0,
          gamesPlayed: gameStats.gamesPlayed,
          lastPlayed: player.lastPlayed,
          streak,
          achievements: player.achievements,
          tier,
          badge
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    // Get competition count for this game
    // const gameMatchesSnapshot = await this.db.collection('matches').where('game', '==', gameId).get();
    const gameTournamentsSnapshot = await this.db.collection('tournaments').where('game', '==', gameId).get();
    const gameLeaguesSnapshot = await this.db.collection('leagues').where('game', '==', gameId).get();

    const averageScore = entries.length > 0 ? entries.reduce((sum, entry) => sum + entry.score, 0) / entries.length : 0;
    const topScore = entries.length > 0 ? entries[0].score : 0;

    return {
      id: `game-${gameId}`,
      type: 'game',
      gameId,
      gameName: gameData?.name || gameId,
      title: `${gameData?.name || gameId} Leaderboard`,
      description: `Performance rankings for ${gameData?.name || gameId}`,
      lastUpdated: new Date().toISOString(),
      totalPlayers: entries.length,
      entries: entries.slice(0, 50), // Top 50 players
      metadata: {
        season: 'S1',
        period: 'all-time',
        competitionCount: gameTournamentsSnapshot.size + gameLeaguesSnapshot.size,
        averageScore,
        topScore
      }
    };
  }

  /**
   * Generate league-specific leaderboard
   */
  async generateLeagueLeaderboard(leagueId: string): Promise<LeagueLeaderboard> {
    const playerStats = await this.getPlayerStats();
    
    // Get league data
    const leagueDoc = await this.db.collection('leagues').doc(leagueId).get();
    const leagueData = leagueDoc.data();
    
    const entries: LeaderboardEntry[] = playerStats
      .filter(player => player.leagueStats[leagueId] && player.leagueStats[leagueId].gamesPlayed > 0)
      .map(player => {
        const leagueStats = player.leagueStats[leagueId];
        const score = this.calculateScore(leagueStats.wins, leagueStats.losses, leagueStats.totalPoints);
        const winRate = leagueStats.gamesPlayed > 0 ? leagueStats.wins / leagueStats.gamesPlayed : 0;
        const tier = this.calculateTier(score, winRate);
        const badge = this.calculateBadge(player.achievements, winRate, leagueStats.gamesPlayed);
        const streak = this.calculateStreak(player);

        return {
          userId: player.userId,
          username: player.username,
          rank: 0, // Will be set after sorting
          score,
          wins: leagueStats.wins,
          losses: leagueStats.losses,
          winRate,
          totalPoints: leagueStats.totalPoints,
          averagePoints: leagueStats.gamesPlayed > 0 ? leagueStats.totalPoints / leagueStats.gamesPlayed : 0,
          gamesPlayed: leagueStats.gamesPlayed,
          lastPlayed: player.lastPlayed,
          streak,
          achievements: player.achievements,
          tier,
          badge
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    // Get match count for this league
    const leagueMatchesSnapshot = await this.db.collection('matches').where('leagueId', '==', leagueId).get();

    const averageScore = entries.length > 0 ? entries.reduce((sum, entry) => sum + entry.score, 0) / entries.length : 0;
    const topScore = entries.length > 0 ? entries[0].score : 0;

    return {
      id: `league-${leagueId}`,
      type: 'league',
      leagueId,
      leagueName: leagueData?.name || leagueId,
      title: `${leagueData?.name || leagueId} Leaderboard`,
      description: `Performance rankings for ${leagueData?.name || leagueId}`,
      lastUpdated: new Date().toISOString(),
      totalPlayers: entries.length,
      entries: entries.slice(0, 25), // Top 25 players
      metadata: {
        season: leagueData?.season || 'S1',
        period: 'all-time',
        totalMatches: leagueMatchesSnapshot.size,
        averageScore,
        topScore,
        leagueStatus: leagueData?.status || 'active'
      }
    };
  }

  /**
   * Calculate leaderboard statistics
   */
  async calculateLeaderboardStats(leaderboard: GlobalLeaderboard | GameLeaderboard | LeagueLeaderboard): Promise<LeaderboardStats> {
    const entries = leaderboard.entries;
    const totalPlayers = entries.length;
    const averageScore = totalPlayers > 0 ? entries.reduce((sum, entry) => sum + entry.score, 0) / totalPlayers : 0;
    const topScore = totalPlayers > 0 ? entries[0].score : 0;
    const averageWinRate = totalPlayers > 0 ? entries.reduce((sum, entry) => sum + entry.winRate, 0) / totalPlayers : 0;
    const totalGames = entries.reduce((sum, entry) => sum + entry.gamesPlayed, 0);

    // Calculate tier distribution
    const tierDistribution: Record<string, number> = {};
    entries.forEach(entry => {
      tierDistribution[entry.tier] = (tierDistribution[entry.tier] || 0) + 1;
    });

    return {
      totalPlayers,
      averageScore,
      topScore,
      averageWinRate,
      totalGames,
      tierDistribution,
      periodStats: {
        allTime: totalPlayers,
        monthly: Math.floor(totalPlayers * 0.8), // Placeholder
        weekly: Math.floor(totalPlayers * 0.6), // Placeholder
        daily: Math.floor(totalPlayers * 0.4) // Placeholder
      }
    };
  }
}


