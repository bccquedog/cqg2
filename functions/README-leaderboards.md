# Leaderboard System

The Leaderboard System provides comprehensive ranking and performance tracking across all games, leagues, and global competitions in the CQG platform.

## Overview

The leaderboard system includes:
- **Global Leaderboards** - Overall performance across all games and competitions
- **Game-specific Leaderboards** - Rankings for individual games (Madden, 2K, etc.)
- **League-specific Leaderboards** - Rankings within specific leagues
- **Real-time Updates** - Automatic recalculation based on match results
- **Tier System** - Bronze to Grandmaster ranking tiers
- **Achievement System** - Badges and achievements for top performers

## Firestore Structure

### Global Leaderboard
**Path:** `/leaderboards/global`

```typescript
{
  id: "global",
  type: "global",
  title: "Global Leaderboard",
  description: "Overall performance across all games and competitions",
  lastUpdated: "2025-09-05T17:37:55.280Z",
  totalPlayers: 20,
  entries: [
    {
      userId: "user1",
      username: "Hans.Turner",
      rank: 1,
      score: 2850,
      wins: 45,
      losses: 5,
      winRate: 0.9,
      totalPoints: 12500,
      averagePoints: 250,
      gamesPlayed: 50,
      lastPlayed: "2025-09-05T17:37:55.280Z",
      streak: { current: 8, type: "win" },
      achievements: ["champion", "undefeated"],
      tier: "Grandmaster",
      badge: "🏆"
    }
  ],
  metadata: {
    season: "S1",
    period: "all-time",
    gameCount: 3,
    competitionCount: 8
  }
}
```

### Game-specific Leaderboard
**Path:** `/leaderboards/game-{gameId}`

```typescript
{
  id: "game-madden",
  type: "game",
  gameId: "madden",
  gameName: "Madden NFL 24",
  title: "Madden NFL 24 Leaderboard",
  description: "Performance rankings for Madden NFL 24",
  lastUpdated: "2025-09-05T17:37:55.376Z",
  totalPlayers: 15,
  entries: [...],
  metadata: {
    season: "S1",
    period: "all-time",
    competitionCount: 4,
    averageScore: 1800,
    topScore: 2200
  }
}
```

### League-specific Leaderboard
**Path:** `/leaderboards/league-{leagueId}`

```typescript
{
  id: "league-soloLeagueS1",
  type: "league",
  leagueId: "soloLeagueS1",
  leagueName: "Solo League S1",
  title: "Solo League S1 Leaderboard",
  description: "Performance rankings for Solo League S1",
  lastUpdated: "2025-09-05T17:37:55.556Z",
  totalPlayers: 8,
  entries: [...],
  metadata: {
    season: "S1",
    period: "all-time",
    totalMatches: 20,
    averageScore: 1400,
    topScore: 1800,
    leagueStatus: "active"
  }
}
```

## Files

### Core Implementation
- **`src/types/leaderboards.ts`** - TypeScript interfaces and types
- **`functions/leaderboardCalculator.ts`** - Leaderboard calculation logic
- **`src/lib/firestoreLeaderboards.ts`** - Firestore CRUD operations
- **`src/components/LeaderboardViewer.tsx`** - React component for displaying leaderboards
- **`src/admin/LeaderboardPanel.tsx`** - Admin panel for managing leaderboards

### Scripts and Utilities
- **`functions/scripts/sanityLeaderboards.ts`** - Sanity check script
- **`functions/scripts/seeder.ts`** - Seeder with leaderboard data

### Pages
- **`src/app/leaderboards/page.tsx`** - Global leaderboard page
- **`src/app/leaderboards/game/[gameId]/page.tsx`** - Game-specific leaderboard page
- **`src/app/leaderboards/league/[leagueId]/page.tsx`** - League-specific leaderboard page

## Features

### Leaderboard Types

#### Global Leaderboard
- **Scope**: All games and competitions
- **Ranking**: Overall performance across platform
- **Top Players**: Top 100 players globally
- **Metrics**: Combined stats from all games

#### Game-specific Leaderboards
- **Scope**: Individual games (Madden, 2K, etc.)
- **Ranking**: Performance within specific game
- **Top Players**: Top 50 players per game
- **Metrics**: Game-specific statistics

#### League-specific Leaderboards
- **Scope**: Individual leagues
- **Ranking**: Performance within specific league
- **Top Players**: Top 25 players per league
- **Metrics**: League-specific statistics

### Scoring System

#### Score Calculation
```typescript
score = (wins * 100) + (totalPoints * 0.1) + (winRate * 500)
```

#### Tier System
- **Grandmaster**: 3000+ points, 80%+ win rate
- **Master**: 2500+ points, 75%+ win rate
- **Diamond**: 2000+ points, 70%+ win rate
- **Platinum**: 1500+ points, 65%+ win rate
- **Gold**: 1000+ points, 60%+ win rate
- **Silver**: 500+ points, 50%+ win rate
- **Bronze**: <500 points or <50% win rate

#### Badge System
- **🏆 Champion**: Tournament/league winner
- **⚡ Undefeated**: Perfect win record
- **🔥 Hot Streak**: 80%+ win rate
- **🎯 Veteran**: 100+ games played
- **💪 Comeback**: Multiple comeback victories
- **⭐ Rising**: New player with potential

### Player Statistics

#### Core Metrics
- **Score**: Calculated performance score
- **Wins/Losses**: Match win/loss record
- **Win Rate**: Percentage of matches won
- **Total Points**: Cumulative points earned
- **Average Points**: Points per game
- **Games Played**: Total number of matches
- **Last Played**: Most recent match date

#### Advanced Metrics
- **Streak**: Current win/loss streak
- **Achievements**: Unlocked achievements
- **Tier**: Current ranking tier
- **Badge**: Performance badge

## Usage

### Frontend Components

#### LeaderboardViewer Component
```typescript
import LeaderboardViewer from '../components/LeaderboardViewer';

// Global leaderboard
<LeaderboardViewer initialType="global" />

// Game-specific leaderboard
<LeaderboardViewer initialType="game" gameId="madden" />

// League-specific leaderboard
<LeaderboardViewer initialType="league" leagueId="soloLeagueS1" />
```

#### Admin Panel
```typescript
import LeaderboardPanel from '../admin/LeaderboardPanel';

// Admin leaderboard management
<LeaderboardPanel />
```

### Backend Functions

#### Get Leaderboards
```typescript
import { getGlobalLeaderboard, getGameLeaderboard, getLeagueLeaderboard } from '../lib/firestoreLeaderboards';

// Get global leaderboard
const global = await getGlobalLeaderboard();

// Get game leaderboard
const game = await getGameLeaderboard('madden');

// Get league leaderboard
const league = await getLeagueLeaderboard('soloLeagueS1');
```

#### Calculate Leaderboards
```typescript
import { LeaderboardCalculator } from '../functions/leaderboardCalculator';

const calculator = new LeaderboardCalculator();

// Generate global leaderboard
const global = await calculator.generateGlobalLeaderboard();

// Generate game leaderboard
const game = await calculator.generateGameLeaderboard('madden');

// Generate league leaderboard
const league = await calculator.generateLeagueLeaderboard('soloLeagueS1');
```

## API Endpoints

### Pages
- **`/leaderboards`** - Global leaderboard
- **`/leaderboards/game/{gameId}`** - Game-specific leaderboard
- **`/leaderboards/league/{leagueId}`** - League-specific leaderboard

### Admin
- **`/admin/leaderboards`** - Leaderboard management panel

## Testing

### Sanity Check
```bash
# Run leaderboard sanity check
pnpm sanity:leaderboards
```

### Seeding
```bash
# Seed leaderboard data
pnpm seed:clans
```

### Build
```bash
# Build TypeScript
pnpm build
```

## Sanity Check Results

```
🏆 Sanity Check: Leaderboards

Found 5 leaderboards

📊 Leaderboard: Global Leaderboard (global)
   Type: global
   Total Players: 20
   Entries Count: 3
   🏆 Top 3 Players:
      1. Hans.Turner (user1) - 2850 points, Grandmaster 🏆
      2. Leila71 (user2) - 2650 points, Master 🔥
      3. Eveline75 (user3) - 2400 points, Diamond 💪

📊 Leaderboard Sanity Summary:
   Total Leaderboards: 5
   Global Leaderboards: 1
   Game Leaderboards: 2
   League Leaderboards: 2
   Total Players: 61
   Total Entries: 11
   Errors: 0
   Warnings: 0

✅ All leaderboards are valid!
```

## Features

### Real-time Updates
- **Automatic Recalculation**: Leaderboards update when matches complete
- **Live Rankings**: Real-time rank changes
- **Streak Tracking**: Current win/loss streaks
- **Achievement Unlocking**: Automatic achievement detection

### Filtering and Search
- **Player Search**: Search by username or user ID
- **Tier Filtering**: Filter by ranking tier
- **Game Filtering**: Filter by minimum games played
- **Rank Filtering**: Filter by maximum rank

### Performance Optimization
- **Caching**: In-memory caching for frequently accessed data
- **Pagination**: Efficient data loading for large leaderboards
- **Lazy Loading**: Load data only when needed
- **Batch Updates**: Efficient bulk updates

### Admin Features
- **Regeneration**: Manually regenerate leaderboards
- **Deletion**: Remove outdated leaderboards
- **Statistics**: View leaderboard statistics
- **Monitoring**: Track leaderboard health

## Integration

### Cloud Functions
```typescript
// Scheduled leaderboard updates
export const updateLeaderboards = functions.pubsub
  .schedule("every 1 hours")
  .onRun(async (context) => {
    const calculator = new LeaderboardCalculator();
    await calculator.generateGlobalLeaderboard();
    await calculator.generateGameLeaderboard('madden');
    await calculator.generateLeagueLeaderboard('soloLeagueS1');
  });
```

### Match Completion Triggers
```typescript
// Update leaderboards when match completes
export const onMatchComplete = functions.firestore
  .document('matches/{matchId}')
  .onUpdate(async (change, context) => {
    const match = change.after.data();
    if (match.status === 'completed') {
      // Update relevant leaderboards
      await updateLeaderboards(match.game, match.leagueId);
    }
  });
```

## Monitoring

### Health Checks
- **Data Integrity**: Validate leaderboard data structure
- **Ranking Consistency**: Check for ranking errors
- **Score Accuracy**: Verify score calculations
- **Update Frequency**: Monitor update timestamps

### Performance Metrics
- **Calculation Time**: Time to generate leaderboards
- **Update Frequency**: How often leaderboards update
- **Error Rate**: Rate of calculation errors
- **Cache Hit Rate**: Cache performance metrics

## Best Practices

### Data Management
- **Regular Updates**: Update leaderboards frequently
- **Data Validation**: Validate all leaderboard data
- **Backup**: Backup leaderboard data regularly
- **Cleanup**: Remove outdated leaderboards

### Performance
- **Efficient Queries**: Use optimized Firestore queries
- **Caching**: Implement appropriate caching strategies
- **Batch Operations**: Use batch operations for updates
- **Indexing**: Create proper Firestore indexes

### User Experience
- **Fast Loading**: Optimize for quick loading times
- **Real-time Updates**: Provide live updates
- **Clear Rankings**: Make rankings easy to understand
- **Mobile Friendly**: Ensure mobile compatibility

## Troubleshooting

### Common Issues

1. **Leaderboard Not Updating**
   - Check match completion triggers
   - Verify calculation functions
   - Check Firestore permissions

2. **Incorrect Rankings**
   - Validate score calculations
   - Check match data integrity
   - Verify ranking logic

3. **Performance Issues**
   - Optimize Firestore queries
   - Implement caching
   - Use batch operations

### Debug Commands
```bash
# Check leaderboard data
firebase firestore:get leaderboards/global

# Validate calculations
pnpm sanity:leaderboards

# Test regeneration
# (Use admin panel or Cloud Function)
```

The Leaderboard System provides a comprehensive ranking and performance tracking solution with real-time updates, multiple leaderboard types, and robust admin management capabilities.


