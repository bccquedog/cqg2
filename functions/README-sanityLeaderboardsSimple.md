# Simple Leaderboard Sanity Check

A streamlined sanity check script for validating leaderboard data integrity and player statistics.

## Overview

This script provides a focused validation of leaderboard data, checking for:
- **Player Statistics** - Validates wins, losses, and points data
- **Data Integrity** - Ensures no negative values or missing data
- **Match Records** - Warns about players with no recorded matches
- **Summary Statistics** - Provides overview of leaderboard health

## Files

### Core Implementation
- **`scripts/sanityLeaderboards.ts`** - Simple leaderboard validation script

## Function

### `sanityLeaderboards()`

Performs focused validation of leaderboard data.

**Features:**
- ✅ **Collection Iteration** - Checks all leaderboard collections
- ✅ **Player Validation** - Validates individual player statistics
- ✅ **Data Integrity** - Checks for negative values and missing data
- ✅ **Match Validation** - Warns about players with no matches
- ✅ **Summary Reporting** - Provides clear summary of issues

## Validation Checks

### Basic Validation
- **No Matches** - Warns if player has 0 wins and 0 losses
- **Negative Points** - Errors if player has negative total points
- **Data Display** - Shows wins, losses, and points for each player

### Error Types
- **❌ Errors** - Critical issues that need immediate attention
- **⚠️ Warnings** - Potential issues that should be investigated

## Usage

### Command Line
```bash
# Run leaderboard sanity check
pnpm sanity:leaderboards
```

### Programmatic Usage
```typescript
import { sanityLeaderboards } from './scripts/sanityLeaderboards';

// Run sanity check
await sanityLeaderboards();
```

## Output Format

### Leaderboard Information
For each leaderboard, displays:
- **Leaderboard ID** - Collection identifier
- **Player Count** - Number of players in collection
- **Player Stats** - Individual player statistics

### Validation Results
- **✅ Valid** - Player data passes all checks
- **⚠️ Warning** - Player has no matches recorded
- **❌ Error** - Player has negative points

### Summary Report
- **Total Leaderboards** - Number of leaderboard collections
- **Total Players** - Aggregate player count
- **Errors** - Number of critical issues
- **Warnings** - Number of potential issues

## Example Output

```
📊 Running Leaderboard Sanity Check...

Found 5 leaderboards

📊 Leaderboard: global
   Players = 4
   ⚠️ user1 has no matches recorded
   📈 user1: 0W-0L, 0 points
   ⚠️ user2 has no matches recorded
   📈 user2: 0W-0L, 0 points
   ⚠️ user3 has no matches recorded
   📈 user3: 0W-0L, 0 points
   ⚠️ user4 has no matches recorded
   📈 user4: 0W-0L, 0 points

📊 Leaderboard: game-madden
   Players = 0

📊 Leaderboard: league-soloLeagueS1
   Players = 0

📊 Leaderboard Sanity Summary:
   Total Leaderboards: 5
   Total Players: 4
   Errors: 0
   Warnings: 4

⚠️ 4 warnings found in leaderboards
```

## Integration

### Package Scripts
```json
{
  "scripts": {
    "sanity:leaderboards": "ts-node --transpile-only scripts/sanityLeaderboards.ts"
  }
}
```

### Cloud Functions Integration
```typescript
// In Cloud Functions
import { sanityLeaderboards } from './scripts/sanityLeaderboards';

export const runLeaderboardSanityCheck = functions.https.onCall(async (data, context) => {
  return await sanityLeaderboards();
});
```

### Scheduled Execution
```typescript
// In scheduled functions
export const scheduledLeaderboardSanity = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async (context) => {
    console.log("Running daily leaderboard sanity check...");
    await sanityLeaderboards();
  });
```

## Error Handling

### Common Errors
- **Collection Access Errors** - Issues accessing leaderboard collections
- **Player Data Errors** - Problems with individual player data
- **Firestore Errors** - Database connection or permission issues

### Error Recovery
- **Graceful Degradation** - Continues processing with available data
- **Detailed Logging** - Logs all errors with context
- **Error Reporting** - Reports errors in summary
- **Exit Codes** - Proper exit codes for automation

## Performance Considerations

### Optimization
- **Efficient Queries** - Uses minimal Firestore reads
- **Batch Processing** - Processes leaderboards sequentially
- **Memory Management** - Efficient memory usage
- **Error Handling** - Prevents memory leaks

### Scalability
- **Large Datasets** - Handles large numbers of leaderboards
- **Concurrent Access** - Safe for concurrent execution
- **Resource Limits** - Respects resource constraints
- **Timeout Handling** - Handles long-running operations

## Monitoring

### Logging
- **Validation Logs** - Logs all validation results
- **Error Logs** - Logs all errors with context
- **Performance Logs** - Logs execution time and metrics
- **Summary Logs** - Logs summary statistics

### Metrics
- **Leaderboard Count** - Number of leaderboards processed
- **Player Count** - Number of players validated
- **Issue Count** - Number of issues found
- **Validation Time** - Time to complete validation

## Best Practices

### Validation
- **Focused Checks** - Check only essential data integrity
- **Clear Output** - Provide clear, actionable feedback
- **Error Reporting** - Report all issues found
- **Performance Monitoring** - Monitor validation performance

### Reporting
- **Clear Output** - Provide clear, readable output
- **Detailed Information** - Include detailed validation results
- **Summary Statistics** - Provide summary statistics
- **Actionable Insights** - Provide actionable insights

### Maintenance
- **Regular Execution** - Run sanity checks regularly
- **Issue Tracking** - Track and resolve issues
- **Performance Monitoring** - Monitor performance trends
- **Documentation Updates** - Keep documentation updated

## Troubleshooting

### Common Issues

1. **No Leaderboards Found**
   - Check if leaderboards exist in Firestore
   - Verify collection structure
   - Check Firestore rules and access

2. **No Players Found**
   - Check if players exist in leaderboard collections
   - Verify data structure
   - Check for data corruption

3. **Validation Errors**
   - Check data validation logic
   - Verify field requirements
   - Check for data type mismatches

### Debug Commands
```bash
# Run sanity check with verbose output
pnpm sanity:leaderboards

# Check specific leaderboard
firebase firestore:get leaderboards/global/players/user1

# Check all players in leaderboard
firebase firestore:get leaderboards/global/players
```

## Future Enhancements

### Planned Features
- **Export Functionality** - Export validation results
- **Historical Tracking** - Track validation trends over time
- **Automated Fixes** - Automatically fix common issues
- **Advanced Analytics** - Advanced analytics and insights
- **Real-time Monitoring** - Real-time validation monitoring
- **Custom Validation Rules** - Customizable validation rules
- **Integration APIs** - API endpoints for validation
- **Dashboard Integration** - Dashboard integration for results

### Integration Opportunities
- **Admin Panel** - Admin panel integration
- **Monitoring Systems** - Integration with monitoring systems
- **Alert Systems** - Integration with alert systems
- **Reporting Systems** - Integration with reporting systems
- **Analytics Platforms** - Integration with analytics platforms

The Simple Leaderboard Sanity Check provides focused validation of leaderboard data integrity with clear reporting and actionable insights for maintaining data quality across the CQG platform.


