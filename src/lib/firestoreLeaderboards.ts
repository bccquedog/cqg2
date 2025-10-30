import { db } from './firebase';
import { 
  Leaderboard, 
  GlobalLeaderboard, 
  GameLeaderboard, 
  LeagueLeaderboard, 
  LeaderboardFilters,
  LeaderboardStats,
  PlayerLeaderboardHistory
} from '../types/leaderboards';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

/**
 * Get global leaderboard
 */
export async function getGlobalLeaderboard(): Promise<GlobalLeaderboard | null> {
  try {
    const leaderboardRef = doc(db, 'leaderboards', 'global');
    const leaderboardSnap = await getDoc(leaderboardRef);
    
    if (!leaderboardSnap.exists()) {
      return null;
    }
    
    return leaderboardSnap.data() as GlobalLeaderboard;
  } catch (error) {
    console.error('Error getting global leaderboard:', error);
    throw error;
  }
}

/**
 * Get game-specific leaderboard
 */
export async function getGameLeaderboard(gameId: string): Promise<GameLeaderboard | null> {
  try {
    const leaderboardRef = doc(db, 'leaderboards', `game-${gameId}`);
    const leaderboardSnap = await getDoc(leaderboardRef);
    
    if (!leaderboardSnap.exists()) {
      return null;
    }
    
    return leaderboardSnap.data() as GameLeaderboard;
  } catch (error) {
    console.error(`Error getting game leaderboard for ${gameId}:`, error);
    throw error;
  }
}

/**
 * Get league-specific leaderboard
 */
export async function getLeagueLeaderboard(leagueId: string): Promise<LeagueLeaderboard | null> {
  try {
    const leaderboardRef = doc(db, 'leaderboards', `league-${leagueId}`);
    const leaderboardSnap = await getDoc(leaderboardRef);
    
    if (!leaderboardSnap.exists()) {
      return null;
    }
    
    return leaderboardSnap.data() as LeagueLeaderboard;
  } catch (error) {
    console.error(`Error getting league leaderboard for ${leagueId}:`, error);
    throw error;
  }
}

/**
 * Get all leaderboards
 */
export async function getAllLeaderboards(): Promise<Leaderboard[]> {
  try {
    const leaderboardsRef = collection(db, 'leaderboards');
    const leaderboardsSnap = await getDocs(leaderboardsRef);
    
    const leaderboards: Leaderboard[] = [];
    leaderboardsSnap.forEach((doc) => {
      leaderboards.push(doc.data() as Leaderboard);
    });
    
    return leaderboards;
  } catch (error) {
    console.error('Error getting all leaderboards:', error);
    throw error;
  }
}

/**
 * Get leaderboards by type
 */
export async function getLeaderboardsByType(type: 'global' | 'game' | 'league'): Promise<Leaderboard[]> {
  try {
    const leaderboardsRef = collection(db, 'leaderboards');
    const q = query(leaderboardsRef, where('type', '==', type));
    const leaderboardsSnap = await getDocs(q);
    
    const leaderboards: Leaderboard[] = [];
    leaderboardsSnap.forEach((doc) => {
      leaderboards.push(doc.data() as Leaderboard);
    });
    
    return leaderboards;
  } catch (error) {
    console.error(`Error getting leaderboards by type ${type}:`, error);
    throw error;
  }
}

/**
 * Save global leaderboard
 */
export async function saveGlobalLeaderboard(leaderboard: GlobalLeaderboard): Promise<void> {
  try {
    const leaderboardRef = doc(db, 'leaderboards', 'global');
    await setDoc(leaderboardRef, {
      ...leaderboard,
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error('Error saving global leaderboard:', error);
    throw error;
  }
}

/**
 * Save game leaderboard
 */
export async function saveGameLeaderboard(leaderboard: GameLeaderboard): Promise<void> {
  try {
    const leaderboardRef = doc(db, 'leaderboards', `game-${leaderboard.gameId}`);
    await setDoc(leaderboardRef, {
      ...leaderboard,
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error saving game leaderboard for ${leaderboard.gameId}:`, error);
    throw error;
  }
}

/**
 * Save league leaderboard
 */
export async function saveLeagueLeaderboard(leaderboard: LeagueLeaderboard): Promise<void> {
  try {
    const leaderboardRef = doc(db, 'leaderboards', `league-${leaderboard.leagueId}`);
    await setDoc(leaderboardRef, {
      ...leaderboard,
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error saving league leaderboard for ${leaderboard.leagueId}:`, error);
    throw error;
  }
}

/**
 * Update leaderboard
 */
export async function updateLeaderboard(leaderboardId: string, updates: Partial<Leaderboard>): Promise<void> {
  try {
    const leaderboardRef = doc(db, 'leaderboards', leaderboardId);
    await updateDoc(leaderboardRef, {
      ...updates,
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error updating leaderboard ${leaderboardId}:`, error);
    throw error;
  }
}

/**
 * Delete leaderboard
 */
export async function deleteLeaderboard(leaderboardId: string): Promise<void> {
  try {
    const leaderboardRef = doc(db, 'leaderboards', leaderboardId);
    await deleteDoc(leaderboardRef);
  } catch (error) {
    console.error(`Error deleting leaderboard ${leaderboardId}:`, error);
    throw error;
  }
}

/**
 * Get leaderboard statistics
 */
export async function getLeaderboardStats(leaderboardId: string): Promise<LeaderboardStats | null> {
  try {
    const statsRef = doc(db, 'leaderboards', leaderboardId, 'stats', 'current');
    const statsSnap = await getDoc(statsRef);
    
    if (!statsSnap.exists()) {
      return null;
    }
    
    return statsSnap.data() as LeaderboardStats;
  } catch (error) {
    console.error(`Error getting leaderboard stats for ${leaderboardId}:`, error);
    throw error;
  }
}

/**
 * Save leaderboard statistics
 */
export async function saveLeaderboardStats(leaderboardId: string, stats: LeaderboardStats): Promise<void> {
  try {
    const statsRef = doc(db, 'leaderboards', leaderboardId, 'stats', 'current');
    await setDoc(statsRef, {
      ...stats,
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error saving leaderboard stats for ${leaderboardId}:`, error);
    throw error;
  }
}

/**
 * Get player leaderboard history
 */
export async function getPlayerLeaderboardHistory(userId: string): Promise<PlayerLeaderboardHistory | null> {
  try {
    const historyRef = doc(db, 'users', userId, 'leaderboardHistory', 'current');
    const historySnap = await getDoc(historyRef);
    
    if (!historySnap.exists()) {
      return null;
    }
    
    return historySnap.data() as PlayerLeaderboardHistory;
  } catch (error) {
    console.error(`Error getting player leaderboard history for ${userId}:`, error);
    throw error;
  }
}

/**
 * Save player leaderboard history
 */
export async function savePlayerLeaderboardHistory(userId: string, history: PlayerLeaderboardHistory): Promise<void> {
  try {
    const historyRef = doc(db, 'users', userId, 'leaderboardHistory', 'current');
    await setDoc(historyRef, {
      ...history,
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error saving player leaderboard history for ${userId}:`, error);
    throw error;
  }
}

/**
 * Get top players from leaderboard
 */
export async function getTopPlayers(leaderboardId: string, limitCount: number = 10): Promise<any[]> {
  try {
    const leaderboardRef = doc(db, 'leaderboards', leaderboardId);
    const leaderboardSnap = await getDoc(leaderboardRef);
    
    if (!leaderboardSnap.exists()) {
      return [];
    }
    
    const leaderboard = leaderboardSnap.data() as Leaderboard;
    return leaderboard.entries.slice(0, limitCount);
  } catch (error) {
    console.error(`Error getting top players from ${leaderboardId}:`, error);
    throw error;
  }
}

/**
 * Search players in leaderboard
 */
export async function searchPlayersInLeaderboard(
  leaderboardId: string, 
  searchTerm: string, 
  filters?: LeaderboardFilters
): Promise<any[]> {
  try {
    const leaderboardRef = doc(db, 'leaderboards', leaderboardId);
    const leaderboardSnap = await getDoc(leaderboardRef);
    
    if (!leaderboardSnap.exists()) {
      return [];
    }
    
    const leaderboard = leaderboardSnap.data() as Leaderboard;
    let filteredEntries = leaderboard.entries;
    
    // Apply search filter
    if (searchTerm) {
      filteredEntries = filteredEntries.filter(entry => 
        entry.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.userId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply additional filters
    if (filters) {
      if (filters.tier) {
        filteredEntries = filteredEntries.filter(entry => entry.tier === filters.tier);
      }
      
      if (filters.minGames) {
        filteredEntries = filteredEntries.filter(entry => entry.gamesPlayed >= filters.minGames!);
      }
      
      if (filters.maxRank) {
        filteredEntries = filteredEntries.filter(entry => entry.rank <= filters.maxRank!);
      }
    }
    
    return filteredEntries;
  } catch (error) {
    console.error(`Error searching players in ${leaderboardId}:`, error);
    throw error;
  }
}

/**
 * Get leaderboard by ID
 */
export async function getLeaderboardById(leaderboardId: string): Promise<Leaderboard | null> {
  try {
    const leaderboardRef = doc(db, 'leaderboards', leaderboardId);
    const leaderboardSnap = await getDoc(leaderboardRef);
    
    if (!leaderboardSnap.exists()) {
      return null;
    }
    
    return leaderboardSnap.data() as Leaderboard;
  } catch (error) {
    console.error(`Error getting leaderboard ${leaderboardId}:`, error);
    throw error;
  }
}

/**
 * Check if leaderboard exists
 */
export async function leaderboardExists(leaderboardId: string): Promise<boolean> {
  try {
    const leaderboardRef = doc(db, 'leaderboards', leaderboardId);
    const leaderboardSnap = await getDoc(leaderboardRef);
    return leaderboardSnap.exists();
  } catch (error) {
    console.error(`Error checking if leaderboard ${leaderboardId} exists:`, error);
    return false;
  }
}


