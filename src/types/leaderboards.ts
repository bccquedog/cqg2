export interface LeaderboardEntry {
  userId: string;
  username: string;
  rank: number;
  score: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPoints: number;
  averagePoints: number;
  gamesPlayed: number;
  lastPlayed: string;
  streak: {
    current: number;
    type: 'win' | 'loss' | 'none';
  };
  achievements: string[];
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master' | 'Grandmaster';
  badge: string;
}

export interface GlobalLeaderboard {
  id: 'global';
  type: 'global';
  title: 'Global Leaderboard';
  description: 'Overall performance across all games and competitions';
  lastUpdated: string;
  totalPlayers: number;
  entries: LeaderboardEntry[];
  metadata: {
    season: string;
    period: 'all-time' | 'monthly' | 'weekly' | 'daily';
    gameCount: number;
    competitionCount: number;
  };
}

export interface GameLeaderboard {
  id: string;
  type: 'game';
  gameId: string;
  gameName: string;
  title: string;
  description: string;
  lastUpdated: string;
  totalPlayers: number;
  entries: LeaderboardEntry[];
  metadata: {
    season: string;
    period: 'all-time' | 'monthly' | 'weekly' | 'daily';
    competitionCount: number;
    averageScore: number;
    topScore: number;
  };
}

export interface LeagueLeaderboard {
  id: string;
  type: 'league';
  leagueId: string;
  leagueName: string;
  title: string;
  description: string;
  lastUpdated: string;
  totalPlayers: number;
  entries: LeaderboardEntry[];
  metadata: {
    season: string;
    period: 'all-time' | 'monthly' | 'weekly' | 'daily';
    totalMatches: number;
    averageScore: number;
    topScore: number;
    leagueStatus: 'active' | 'completed' | 'upcoming';
  };
}

export type Leaderboard = GlobalLeaderboard | GameLeaderboard | LeagueLeaderboard;

export interface LeaderboardFilters {
  period?: 'all-time' | 'monthly' | 'weekly' | 'daily';
  tier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master' | 'Grandmaster';
  minGames?: number;
  maxRank?: number;
  gameId?: string;
  leagueId?: string;
}

export interface LeaderboardStats {
  totalPlayers: number;
  averageScore: number;
  topScore: number;
  averageWinRate: number;
  totalGames: number;
  tierDistribution: Record<string, number>;
  periodStats: {
    allTime: number;
    monthly: number;
    weekly: number;
    daily: number;
  };
}

export interface PlayerLeaderboardHistory {
  userId: string;
  username: string;
  history: Array<{
    date: string;
    rank: number;
    score: number;
    tier: string;
    gamesPlayed: number;
    winRate: number;
  }>;
  bestRank: number;
  bestScore: number;
  currentStreak: number;
  longestStreak: number;
  achievements: string[];
}


