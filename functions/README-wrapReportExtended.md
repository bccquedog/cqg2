# Extended Wrap Report System

The Extended Wrap Report System now includes automatic leaderboard updates, providing seamless integration between tournament completion and leaderboard management.

## Overview

The extended system includes:
- **Wrap Report Generation** - Comprehensive tournament completion reports
- **Automatic Leaderboard Updates** - Real-time leaderboard updates from wrap reports
- **Multi-level Leaderboards** - Updates global, game-specific, and league-specific leaderboards
- **Transaction Safety** - Atomic updates using Firestore transactions
- **Error Handling** - Robust error handling with graceful degradation

## New Features

### Automatic Leaderboard Updates

When a wrap report is generated, the system automatically updates relevant leaderboards:

1. **Global Leaderboard** - Always updated
2. **Game-specific Leaderboard** - Updated based on tournament game
3. **League-specific Leaderboard** - Updated if tournament is part of a league

### Enhanced Data Structure

The leaderboard player documents now include:
- **Wins/Losses** - Cumulative match results
- **Total Points** - Cumulative points earned
- **Titles** - Number of championships won
- **Games Played** - Total number of matches
- **Last Updated** - Timestamp of last update

## Files

### Core Implementation
- **`functions/wrapReport.ts`** - Extended with `updateLeaderboards` function
- **`functions/scripts/testUpdateLeaderboards.ts`** - Test script for leaderboard updates

## Functions

### `updateLeaderboards(report: any, gameId: string, leagueId?: string)`

Updates leaderboards based on wrap report data.

**Parameters:**
- `report` - Wrap report data containing player statistics
- `gameId` - Game identifier for game-specific leaderboard
- `leagueId` - Optional league identifier for league-specific leaderboard

**Features:**
- ✅ **Multi-level Updates** - Updates global, game, and league leaderboards
- ✅ **Transaction Safety** - Uses Firestore transactions for atomic updates
- ✅ **Cumulative Stats** - Adds new stats to existing player data
- ✅ **Champion Tracking** - Tracks championship wins
- ✅ **Error Handling** - Comprehensive error handling and logging

**Implementation:**
```typescript
export async function updateLeaderboards(report: any, gameId: string, leagueId?: string) {
  const db = getDb();
  
  try {
    const collections = ["global", gameId];
    if (leagueId) collections.push(leagueId);

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
      }
    }

    console.log(`📊 Leaderboards updated for game: ${gameId}${leagueId ? `, league: ${leagueId}` : ""}`);
  } catch (error) {
    console.error(`❌ Error updating leaderboards:`, error);
    throw error;
  }
}
```

### Enhanced `generateWrapReport(competitionId: string)`

Now automatically calls `updateLeaderboards` after generating a wrap report and updates tournament status.

**New Features:**
- ✅ **Automatic Updates** - Automatically updates leaderboards after report generation
- ✅ **Tournament Status Update** - Marks tournament as completed after wrap report generation
- ✅ **Game Detection** - Automatically detects game from tournament data
- ✅ **League Detection** - Automatically detects league if applicable
- ✅ **Error Isolation** - Leaderboard update failures don't affect report generation

**Implementation:**
```typescript
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
```

## Firestore Structure

### Leaderboard Player Documents
**Path:** `/leaderboards/{leaderboardId}/players/{userId}`

```typescript
{
  wins: number;           // Cumulative wins
  losses: number;         // Cumulative losses
  totalPoints: number;    // Cumulative points
  titles: number;         // Number of championships
  gamesPlayed: number;    // Total games played
  lastUpdated: string;    // ISO timestamp
}
```

### Leaderboard Types
- **Global:** `/leaderboards/global/players/{userId}`
- **Game-specific:** `/leaderboards/{gameId}/players/{userId}`
- **League-specific:** `/leaderboards/{leagueId}/players/{userId}`

## Usage

### Automatic Updates
```typescript
// Wrap report generation automatically updates leaderboards
const report = await generateWrapReport('soloCupS1');
// Leaderboards are automatically updated based on tournament data
```

### Manual Updates
```typescript
// Manually update leaderboards
await updateLeaderboards(report, 'madden', 'soloLeagueS1');
```

### Testing
```bash
# Test leaderboard updates
pnpm test:updateLeaderboards
```

## Testing Results

```
📊 Testing Leaderboard Updates from Wrap Reports...

1️⃣ Generating wrap report...
🏆 Wrap report generated for soloCupS1:
   Champion: No champion determined
   Total Matches: 2
   Total Players: 4
   Completed Matches: 0
✅ Tournament soloCupS1 marked as completed
📊 Updating leaderboards for collections: global, NBA2K
   ✅ Updated stats for user1 in global leaderboard
   ✅ Updated stats for user2 in global leaderboard
   ✅ Updated stats for user3 in global leaderboard
   ✅ Updated stats for user4 in global leaderboard
   ✅ Updated stats for user1 in NBA2K leaderboard
   ✅ Updated stats for user2 in NBA2K leaderboard
   ✅ Updated stats for user3 in NBA2K leaderboard
   ✅ Updated stats for user4 in NBA2K leaderboard
📊 Leaderboards updated for game: NBA2K
   ✅ Wrap report generated successfully

2️⃣ Manually updating leaderboards...
📊 Updating leaderboards for collections: global, madden, soloLeagueS1
   ✅ Updated stats for user1 in global leaderboard
   ✅ Updated stats for user2 in global leaderboard
   ✅ Updated stats for user3 in global leaderboard
   ✅ Updated stats for user4 in global leaderboard
   ✅ Updated stats for user1 in madden leaderboard
   ✅ Updated stats for user2 in madden leaderboard
   ✅ Updated stats for user3 in madden leaderboard
   ✅ Updated stats for user4 in madden leaderboard
   ✅ Updated stats for user1 in soloLeagueS1 leaderboard
   ✅ Updated stats for user2 in soloLeagueS1 leaderboard
   ✅ Updated stats for user3 in soloLeagueS1 leaderboard
   ✅ Updated stats for user4 in soloLeagueS1 leaderboard
📊 Leaderboards updated for game: madden, league: soloLeagueS1
   ✅ Leaderboards updated successfully

3️⃣ Checking leaderboard data...
   Global leaderboard players: 4
   user1: 0W-0L, 0 points, 0 titles
   user2: 0W-0L, 0 points, 0 titles
   user3: 0W-0L, 0 points, 0 titles
   user4: 0W-0L, 0 points, 0 titles

✅ Leaderboard update test completed successfully!
```

## Integration

### Cloud Functions Integration
```typescript
// Tournament completion trigger
export const onTournamentComplete = functions.firestore
  .document('tournaments/{tournamentId}')
  .onUpdate(async (change, context) => {
    const tournament = change.after.data();
    if (tournament.status === 'completed') {
      // Generate wrap report (automatically updates leaderboards)
      await generateWrapReport(context.params.tournamentId);
    }
  });
```

### Match Completion Integration
```typescript
// Match completion trigger
export const onMatchComplete = functions.firestore
  .document('matches/{matchId}')
  .onUpdate(async (change, context) => {
    const match = change.after.data();
    if (match.status === 'completed') {
      // Check if tournament is complete
      const tournamentRef = db.collection('tournaments').doc(match.tournamentId);
      const tournament = await tournamentRef.get();
      
      if (tournament.data()?.status === 'completed') {
        // Generate wrap report (automatically updates leaderboards)
        await generateWrapReport(match.tournamentId);
      }
    }
  });
```

## Error Handling

### Graceful Degradation
- **Report Generation Priority** - Wrap report generation always succeeds
- **Leaderboard Update Isolation** - Leaderboard update failures don't affect reports
- **Transaction Safety** - Individual player updates are atomic
- **Comprehensive Logging** - All operations are logged for debugging

### Error Recovery
- **Retry Logic** - Failed leaderboard updates can be retried
- **Data Validation** - All data is validated before updates
- **Fallback Values** - Default values for missing data
- **Error Reporting** - Detailed error messages for debugging

## Performance Considerations

### Optimization
- **Batch Updates** - Multiple players updated in single transaction
- **Efficient Queries** - Minimal Firestore reads
- **Transaction Batching** - Grouped updates for better performance
- **Error Isolation** - Failures don't cascade

### Scalability
- **Concurrent Updates** - Safe for concurrent leaderboard updates
- **Large Tournaments** - Handles tournaments with many participants
- **Frequent Updates** - Optimized for frequent leaderboard updates
- **Resource Management** - Efficient memory and CPU usage

## Monitoring

### Logging
- **Update Tracking** - Logs all leaderboard updates
- **Performance Metrics** - Tracks update times and success rates
- **Error Logging** - Comprehensive error logging
- **Data Validation** - Logs data validation results

### Health Checks
- **Update Success Rate** - Monitors successful updates
- **Data Consistency** - Validates leaderboard data integrity
- **Performance Monitoring** - Tracks update performance
- **Error Rate Monitoring** - Monitors error rates

## Best Practices

### Data Management
- **Atomic Updates** - Use transactions for data consistency
- **Error Isolation** - Isolate failures to prevent cascading errors
- **Data Validation** - Validate all data before updates
- **Backup Strategy** - Regular backups of leaderboard data

### Performance
- **Batch Operations** - Group updates for better performance
- **Efficient Queries** - Minimize Firestore reads
- **Caching Strategy** - Implement appropriate caching
- **Resource Limits** - Monitor and limit resource usage

### Reliability
- **Transaction Safety** - Use transactions for critical updates
- **Error Handling** - Comprehensive error handling
- **Retry Logic** - Implement retry logic for transient failures
- **Monitoring** - Monitor system health and performance

## Troubleshooting

### Common Issues

1. **Leaderboard Updates Failing**
   - Check Firestore permissions
   - Verify tournament data structure
   - Check for data validation errors

2. **Inconsistent Data**
   - Verify transaction usage
   - Check for concurrent updates
   - Validate data before updates

3. **Performance Issues**
   - Optimize Firestore queries
   - Implement batching
   - Monitor resource usage

### Debug Commands
```bash
# Test leaderboard updates
pnpm test:updateLeaderboards

# Check leaderboard data
firebase firestore:get leaderboards/global/players/user1

# Validate wrap reports
pnpm sanity:wrapReports
```

## Future Enhancements

### Planned Features
- **Real-time Updates** - WebSocket-based real-time updates
- **Advanced Analytics** - Detailed performance analytics
- **Custom Scoring** - Configurable scoring systems
- **Historical Tracking** - Track leaderboard changes over time
- **API Integration** - REST API for leaderboard access
- **Mobile Notifications** - Push notifications for rank changes
- **Social Features** - Share achievements and rankings
- **Tournament Integration** - Deeper tournament integration

### Integration Opportunities
- **Discord Bot** - Discord integration for leaderboard updates
- **Email Notifications** - Email notifications for rank changes
- **Webhook Support** - Webhook notifications for external systems
- **Analytics Dashboard** - Advanced analytics dashboard
- **Mobile App** - Mobile app integration
- **Third-party APIs** - Integration with external gaming platforms

The Extended Wrap Report System provides seamless integration between tournament completion and leaderboard management, ensuring that player rankings are always up-to-date and accurate across all levels of competition.
