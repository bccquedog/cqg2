# Reports Sanity Check System

The Reports Sanity Check system provides comprehensive validation and auditing of all tournament and league reports across the CQG platform.

## Overview

The sanity check system validates:
- **Report Structure** - Ensures all required fields are present
- **Data Integrity** - Validates data consistency and completeness
- **Champion Identification** - Checks for proper champion identification
- **Match History** - Validates match data and statistics
- **Player Statistics** - Verifies player performance data
- **Completion Status** - Checks report completion metrics

## Files

### Core Implementation
- **`scripts/sanityReports.ts`** - Main sanity check script for all reports
- **`scripts/sanityWrapReports.ts`** - Specific sanity check for wrap reports
- **`scripts/sanityReports.ts`** - General reports validation (this file)

## Function

### `sanityReports()`

Performs comprehensive validation of all reports across tournaments and leagues.

**Features:**
- ✅ **Collection Group Query** - Uses `collectionGroup("reports")` to find all reports
- ✅ **Comprehensive Validation** - Validates all report fields and structure
- ✅ **Statistics Analysis** - Analyzes player statistics and performance
- ✅ **Issue Detection** - Identifies missing or invalid data
- ✅ **Summary Reporting** - Provides detailed summary and insights
- ✅ **Error Handling** - Robust error handling and logging

## Validation Checks

### Required Fields
- **Champion** - Must have a champion identified
- **Completion Timestamp** - Must have `completedAt` field
- **Match History** - Must have matches array with data
- **Total Matches** - Must have valid total match count
- **Summary Data** - Must have summary object with metrics
- **Player Statistics** - Must have stats object with player data
- **Bracket Snapshot** - Must have bracket snapshot preserved
- **Competition ID** - Must have competition identifier

### Data Quality Checks
- **Match Completion** - Warns if no matches are completed
- **Player Count** - Validates player count consistency
- **Statistics Accuracy** - Verifies statistics calculations
- **Data Consistency** - Checks for data consistency across fields

### Performance Metrics
- **Average Matches** - Calculates average matches per report
- **Average Players** - Calculates average players per report
- **Completion Rate** - Calculates champion completion rate
- **Issue Rate** - Tracks validation issues and trends

## Usage

### Command Line
```bash
# Run reports sanity check
pnpm sanity:reports
```

### Programmatic Usage
```typescript
import { sanityReports } from './scripts/sanityReports';

// Run sanity check
await sanityReports();
```

## Output Format

### Report Details
For each report, displays:
- **Report Path** - Firestore document path
- **Champion** - Champion identification
- **Completion Time** - When report was completed
- **Match Count** - Total number of matches
- **Player Count** - Total number of players
- **Completion Status** - Match completion status

### Validation Results
- **✅ Valid** - Report passes all validation checks
- **❌ Missing** - Required field is missing
- **⚠️ Warning** - Potential issue or inconsistency

### Statistics Display
- **Top Performers** - Shows top 3 players by wins
- **Player Stats** - Win/loss record and total points
- **Performance Metrics** - Detailed performance data

### Summary Report
- **Total Reports** - Number of reports found
- **Champion Status** - Reports with/without champions
- **Statistics Status** - Reports with/without stats
- **Total Matches** - Aggregate match count
- **Total Players** - Aggregate player count
- **Issues Found** - Total validation issues

## Example Output

```
📑 Running Report Sanity Check...

Found 5 reports across all collections

📋 Report: tournaments/soloCupS1/reports/final
   Champion: No champion
   Completed At: 2025-09-05T17:21:47.464Z
   Total Matches: 2
   Total Players: 4
   Completed Matches: 0
   ❌ Missing champion
   ⚠️ Warning: No matches completed despite having matches
   📊 Player Stats: 4 players
   🏆 Top Performers:
      user1: 0W-0L, 0 points
      user2: 0W-0L, 0 points
      user3: 0W-0L, 0 points
   ✅ Bracket snapshot preserved

📊 Report Sanity Summary:
   Total Reports: 5
   Reports with Champions: 0
   Reports without Champions: 5
   Reports with Stats: 1
   Reports without Stats: 4
   Total Matches: 2
   Total Players: 4
   Issues Found: 34

⚠️ 34 issues found in reports

📈 Report Insights:
   Average Matches per Report: 0.4
   Average Players per Report: 0.8
   Champion Completion Rate: 0.0%
```

## Integration

### Cloud Functions Integration
```typescript
// In Cloud Functions
import { sanityReports } from './scripts/sanityReports';

export const runReportsSanityCheck = functions.https.onCall(async (data, context) => {
  return await sanityReports();
});
```

### Admin Panel Integration
```typescript
// In React components
const handleRunSanityCheck = async () => {
  try {
    const results = await sanityReports();
    setSanityResults(results);
    toast.success('Sanity check completed');
  } catch (error) {
    toast.error('Sanity check failed');
  }
};
```

### Scheduled Execution
```typescript
// In scheduled functions
export const scheduledReportsSanity = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async (context) => {
    console.log("Running daily reports sanity check...");
    await sanityReports();
  });
```

## Error Handling

### Common Errors
- **Collection Group Errors** - Issues with Firestore collection group queries
- **Data Access Errors** - Problems accessing report data
- **Validation Errors** - Issues with data validation logic
- **Permission Errors** - Firestore permission issues

### Error Recovery
- **Graceful Degradation** - Continues processing with available data
- **Detailed Logging** - Logs all errors with context
- **Error Reporting** - Reports errors in summary
- **Exit Codes** - Proper exit codes for automation

## Performance Considerations

### Optimization
- **Batch Processing** - Processes reports in batches
- **Efficient Queries** - Uses collection group queries
- **Memory Management** - Efficient memory usage
- **Error Handling** - Prevents memory leaks

### Scalability
- **Large Datasets** - Handles large numbers of reports
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
- **Report Count** - Number of reports processed
- **Issue Count** - Number of issues found
- **Validation Time** - Time to complete validation
- **Error Rate** - Rate of validation errors

## Best Practices

### Validation
- **Comprehensive Checks** - Check all required fields
- **Data Consistency** - Validate data consistency
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

1. **No Reports Found**
   - Check if reports exist in Firestore
   - Verify collection group query permissions
   - Check Firestore rules and access

2. **Missing Data**
   - Check if reports are properly generated
   - Verify data structure and fields
   - Check for data corruption

3. **Validation Errors**
   - Check data validation logic
   - Verify field requirements
   - Check for data type mismatches

### Debug Commands
```bash
# Run sanity check with verbose output
pnpm sanity:reports

# Check specific report
firebase firestore:get tournaments/soloCupS1/reports/final

# Check all reports in collection
firebase firestore:get tournaments/soloCupS1/reports
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

The Reports Sanity Check system provides comprehensive validation and monitoring capabilities for all tournament and league reports, ensuring data integrity and quality across the CQG platform.


