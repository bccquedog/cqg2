# Wrap Report System

The Wrap Report system generates comprehensive tournament and league completion reports, capturing final results, statistics, and champion information.

## Overview

Wrap reports provide a complete summary of competition results including:
- **Champion identification** from final round winners
- **Match statistics** with scores and outcomes
- **Player performance** with wins, losses, and total points
- **Competition summary** with completion metrics
- **Bracket snapshot** for historical reference

## Files

### Core Implementation
- **`wrapReport.ts`** - Main wrap report generation logic
- **`scripts/testWrapReport.ts`** - Test script for wrap report functionality
- **`scripts/sanityWrapReports.ts`** - Sanity check for all wrap reports

## Functions

### `generateWrapReport(competitionId: string)`

Generates a comprehensive wrap report for a tournament or league.

**Parameters:**
- `competitionId` - The ID of the tournament or league

**Returns:**
```typescript
{
  competitionId: string;
  completedAt: string;
  champion: string | null;
  totalMatches: number;
  totalRounds: number;
  bracketSnapshot: any;
  matches: Array<{
    matchId: string;
    players: string[];
    scores: Record<string, number>;
    winner: string | null;
    status: string;
    roundNumber: number;
  }>;
  stats: Record<string, {
    wins: number;
    losses: number;
    totalPoints: number;
  }>;
  summary: {
    totalPlayers: number;
    completedMatches: number;
    averagePointsPerPlayer: number;
  };
}
```

**Features:**
- ✅ **Champion Detection**: Identifies winner from final round
- ✅ **Match Processing**: Processes all rounds and matches
- ✅ **Statistics Generation**: Calculates player performance metrics
- ✅ **Data Validation**: Validates bracket structure and data
- ✅ **Error Handling**: Comprehensive error handling and logging
- ✅ **Firestore Storage**: Saves report to `reports/final` document

### `getWrapReport(competitionId: string)`

Retrieves an existing wrap report from Firestore.

**Parameters:**
- `competitionId` - The ID of the tournament or league

**Returns:**
- Wrap report data or throws error if not found

### `hasWrapReport(competitionId: string): Promise<boolean>`

Checks if a wrap report exists for a competition.

**Parameters:**
- `competitionId` - The ID of the tournament or league

**Returns:**
- `true` if wrap report exists, `false` otherwise

## Firestore Structure

### Wrap Report Document
**Path:** `tournaments/{competitionId}/reports/final` or `leagues/{competitionId}/reports/final`

```typescript
{
  competitionId: string;
  completedAt: string; // ISO timestamp
  champion: string | null;
  totalMatches: number;
  totalRounds: number;
  bracketSnapshot: any; // Complete bracket data
  matches: Array<{
    matchId: string;
    players: string[];
    scores: Record<string, number>;
    winner: string | null;
    status: string;
    roundNumber: number;
  }>;
  stats: Record<string, {
    wins: number;
    losses: number;
    totalPoints: number;
  }>;
  summary: {
    totalPlayers: number;
    completedMatches: number;
    averagePointsPerPlayer: number;
  };
}
```

## Usage Examples

### Generate Wrap Report
```typescript
import { generateWrapReport } from './wrapReport';

// Generate wrap report for tournament
const report = await generateWrapReport('soloCupS1');
console.log(`Champion: ${report.champion}`);
console.log(`Total Matches: ${report.totalMatches}`);
```

### Check if Report Exists
```typescript
import { hasWrapReport } from './wrapReport';

const exists = await hasWrapReport('soloCupS1');
if (exists) {
  console.log('Wrap report already exists');
}
```

### Retrieve Existing Report
```typescript
import { getWrapReport } from './wrapReport';

const report = await getWrapReport('soloCupS1');
console.log(`Champion: ${report.champion}`);
```

## Testing

### Test Script
```bash
# Test wrap report functionality
pnpm test:wrapReport
```

**Test Coverage:**
- ✅ **Existence Check**: Verifies if wrap report exists
- ✅ **Generation**: Tests wrap report generation
- ✅ **Retrieval**: Tests wrap report retrieval
- ✅ **Statistics**: Displays player statistics
- ✅ **Match Summary**: Shows match results

### Sanity Check
```bash
# Check all wrap reports
pnpm sanity:wrapReports
```

**Validation Checks:**
- ✅ **Report Existence**: Checks if reports exist for competitions
- ✅ **Champion Validation**: Validates champion identification
- ✅ **Match Completion**: Checks match completion status
- ✅ **Data Integrity**: Validates report data structure
- ✅ **Statistics Accuracy**: Verifies player statistics

## Integration

### Cloud Functions Integration
```typescript
// In Cloud Functions
import { generateWrapReport } from './wrapReport';

export const generateTournamentWrapReport = functions.https.onCall(async (data, context) => {
  const { competitionId } = data;
  return await generateWrapReport(competitionId);
});
```

### Admin Panel Integration
```typescript
// In React components
const handleGenerateWrapReport = async (competitionId: string) => {
  try {
    const report = await generateWrapReport(competitionId);
    setWrapReport(report);
    toast.success('Wrap report generated successfully');
  } catch (error) {
    toast.error('Failed to generate wrap report');
  }
};
```

## Error Handling

### Common Errors
- **🚫 Bracket not found**: Competition bracket doesn't exist
- **🚫 Bracket data not found**: Bracket document exists but has no data
- **🚫 Bracket rounds not found**: Bracket structure is invalid
- **🚫 Wrap report not found**: Report doesn't exist when retrieving

### Error Recovery
- **Graceful Degradation**: Continues processing with available data
- **Detailed Logging**: Logs all errors with context
- **Validation**: Validates data before processing
- **Fallback Values**: Uses default values for missing data

## Performance Considerations

### Optimization
- **Lazy Loading**: Only loads data when needed
- **Batch Processing**: Processes matches in batches
- **Memory Management**: Efficient memory usage for large brackets
- **Caching**: Can be cached for frequently accessed reports

### Scalability
- **Large Brackets**: Handles tournaments with many participants
- **Multiple Competitions**: Processes multiple competitions efficiently
- **Concurrent Access**: Safe for concurrent report generation
- **Resource Management**: Efficient resource usage

## Monitoring

### Logging
- **Generation Logs**: Logs wrap report generation process
- **Error Logs**: Logs all errors with context
- **Performance Logs**: Logs execution time and metrics
- **Statistics Logs**: Logs generated statistics

### Metrics
- **Report Count**: Number of generated reports
- **Generation Time**: Time to generate reports
- **Error Rate**: Rate of generation failures
- **Data Quality**: Quality of generated reports

## Best Practices

### Report Generation
- **Generate After Completion**: Generate reports after competition ends
- **Validate Data**: Validate bracket data before processing
- **Handle Edge Cases**: Handle incomplete or invalid brackets
- **Store Snapshots**: Store complete bracket snapshots

### Data Management
- **Immutable Reports**: Don't modify existing reports
- **Version Control**: Consider versioning for report updates
- **Backup**: Backup important reports
- **Cleanup**: Clean up old or invalid reports

### Performance
- **Batch Processing**: Process multiple competitions in batches
- **Async Processing**: Use async processing for large reports
- **Resource Limits**: Set appropriate resource limits
- **Monitoring**: Monitor report generation performance

## Troubleshooting

### Common Issues

1. **No Champion Found**
   - Check if final round has completed matches
   - Verify bracket structure is correct
   - Ensure matches have winners

2. **Missing Statistics**
   - Check if matches have score data
   - Verify player data is complete
   - Ensure bracket structure is valid

3. **Generation Failures**
   - Check bracket data integrity
   - Verify Firestore permissions
   - Check for data validation errors

### Debug Commands
```bash
# Test specific competition
pnpm test:wrapReport

# Check all reports
pnpm sanity:wrapReports

# View Firestore data
firebase firestore:get tournaments/soloCupS1/bracket/bracketDoc
```

## Future Enhancements

### Planned Features
- **Export Formats**: PDF, CSV, JSON export options
- **Custom Templates**: Customizable report templates
- **Analytics**: Advanced analytics and insights
- **Notifications**: Automatic report generation notifications
- **API Integration**: REST API for report access
- **Real-time Updates**: Real-time report updates
- **Historical Tracking**: Track report generation history
- **Performance Metrics**: Advanced performance metrics

### Integration Opportunities
- **Discord Bot**: Automatic Discord notifications
- **Email System**: Email report delivery
- **Webhook Support**: Webhook notifications
- **Mobile App**: Mobile app integration
- **Analytics Dashboard**: Analytics dashboard integration

The Wrap Report system provides a comprehensive solution for generating and managing competition completion reports with robust error handling, validation, and monitoring capabilities.


