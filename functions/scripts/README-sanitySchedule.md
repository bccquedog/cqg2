# Schedule Sanity Check Script

A comprehensive audit script for validating tournament and league schedules in Firestore.

## Overview

The `sanitySchedule.ts` script performs thorough validation of all schedule documents in the system, checking for data integrity, consistency, and completeness.

## Features

- **Comprehensive Validation**: Checks all schedule documents across tournaments and leagues
- **Data Integrity**: Validates event timing, check-in windows, and round durations
- **Orphan Detection**: Identifies schedules without parent competitions
- **Missing Schedule Detection**: Finds competitions without schedules
- **Event Validation**: Validates individual events within schedules
- **Warning System**: Categorizes issues by severity (critical vs warnings)

## Usage

```bash
pnpm sanity:schedule
```

## Validation Checks

### Schedule Document Validation

#### Required Fields
- ✅ **Name**: Schedule name/title
- ✅ **Start Date**: Competition start date
- ✅ **End Date**: Competition end date
- ✅ **Timezone**: Timezone for event times
- ✅ **Total Events**: Count of total events
- ✅ **Completed Events**: Count of completed events

#### Main Schedule Format (New)
- ✅ **Start Time**: Competition start time
- ✅ **Check-in Opens**: Check-in window start
- ✅ **Check-in Closes**: Check-in window end
- ✅ **Round Durations**: Duration for each round
- ✅ **Reminders**: Reminder settings

#### Timing Validation
- ✅ **Check-in Logic**: Check-in opens before closes
- ✅ **Check-in vs Start**: Check-in closes before competition starts
- ✅ **Past Events**: Warns about past start times
- ✅ **Round Durations**: Validates positive durations

### Event Validation

#### Required Event Fields
- ✅ **ID**: Unique event identifier
- ✅ **Title**: Event name/title
- ✅ **Start Time**: Event start time
- ✅ **End Time**: Event end time

#### Event Timing
- ✅ **Start vs End**: Start time before end time
- ✅ **Event Types**: Validates event types (match, round, ceremony, etc.)
- ✅ **Status**: Validates event status (scheduled, live, completed, cancelled)

### Orphan Detection

#### Schedule Orphans
- ✅ **Parent Validation**: Checks if parent competition exists
- ✅ **Path Parsing**: Correctly identifies tournament vs league schedules
- ✅ **Collection Validation**: Ensures schedules belong to existing competitions

### Missing Schedule Detection

#### Competition Coverage
- ✅ **Tournament Schedules**: Finds tournaments without schedules
- ✅ **League Schedules**: Finds leagues without schedules
- ✅ **Document Existence**: Checks for schedule document presence

## Output Format

### Schedule Documents Section
```
📅 SCHEDULE DOCUMENTS
==================================================
📋 Found X schedule documents:

📅 Tournament Schedule: soloCupS1
   Path: tournaments/soloCupS1/schedule/schedule
   Name: Solo Cup S1 Schedule
   Status: published
   Start Date: 2025-09-06
   End Date: 2025-09-07
   Timezone: America/New_York
   Total Events: 6
   Completed Events: 0
   📅 Days: 2
     Day 1: 2025-09-06 (3 events)
     Day 2: 2025-09-07 (3 events)
```

### Validation Results
```
   ❌ Check-in open time must be before close time
   ❌ Check-in must close before competition start
   ⚠️ Competition start time is in the past
   ⚠️ Warning: Missing schedule name
   ⚠️ Warning: Missing total events count
```

### Summary Section
```
📌 SCHEDULE SANITY SUMMARY
==================================================
📊 Total Schedules: 5
📅 Total Events: 11
❌ Issues Found: 0
⚠️ Warnings: 19
🔍 Orphaned Schedules: 0
📋 Competitions Without Schedules: 8
```

## Issue Categories

### Critical Issues (❌)
- **Timing Violations**: Check-in windows, event timing
- **Invalid Durations**: Negative or zero round durations
- **Missing Required Fields**: Essential event data missing
- **Data Inconsistencies**: Conflicting time information

### Warnings (⚠️)
- **Missing Optional Fields**: Non-critical missing data
- **Past Events**: Events scheduled in the past
- **Orphaned Schedules**: Schedules without parent competitions
- **Missing Schedules**: Competitions without schedules

## Schedule Types Supported

### Tournament Schedules
- **Day-based**: Events organized by days
- **Event Types**: Matches, rounds, ceremonies, breaks, streams
- **Timing**: Start/end times with timezone support
- **Status Tracking**: Scheduled, live, completed, cancelled

### League Schedules
- **Week-based**: Events organized by weeks
- **Current Week**: Tracks active week
- **Event Types**: Matches, rounds, ceremonies, breaks, streams
- **Timing**: Start/end times with timezone support

### Main Schedule Format
- **Check-in Windows**: Configurable check-in periods
- **Round Durations**: Per-round time allocations
- **Reminder Settings**: Pre-check-in, pre-match, late warnings
- **Start Times**: Competition start timing

## Integration

### With Seeder
- Validates seeded schedule data
- Ensures data consistency after seeding
- Identifies seeding issues

### With ScheduleViewer
- Validates data structure for UI components
- Ensures proper event formatting
- Checks for missing display data

### With Reminders System
- Validates reminder settings
- Checks timing for reminder triggers
- Ensures proper event scheduling

## Error Handling

### Graceful Degradation
- Continues validation despite individual errors
- Provides detailed error context
- Categorizes issues by severity

### Comprehensive Coverage
- Validates all schedule documents
- Checks all events within schedules
- Validates parent-child relationships

## Performance

### Efficient Queries
- Uses collection group queries for schedules
- Batches validation operations
- Minimizes Firestore reads

### Scalable Design
- Handles large numbers of schedules
- Processes events in batches
- Memory-efficient validation

## Maintenance

### Regular Execution
- Run after seeding operations
- Execute before deployments
- Monitor for data quality issues

### Issue Resolution
- Address critical issues immediately
- Review warnings for data quality
- Clean up orphaned schedules
- Add missing schedules as needed

## Example Output

```
⏰ Running Schedule Sanity Check...

📅 SCHEDULE DOCUMENTS
==================================================
📋 Found 5 schedule documents:

📅 Tournament Schedule: soloCupS1
   Path: tournaments/soloCupS1/schedule/schedule
   Name: Solo Cup S1 Schedule
   Status: published
   Start Date: 2025-09-06
   End Date: 2025-09-07
   Timezone: America/New_York
   Total Events: 6
   Completed Events: 0
   📅 Days: 2
     Day 1: 2025-09-06 (3 events)
     Day 2: 2025-09-07 (3 events)

🔍 ORPHANED SCHEDULE CHECK
==================================================

📋 MISSING SCHEDULE CHECK
==================================================
⚠️ Tournament clanTournament1 has no schedule
⚠️ Tournament soloTournament1 has no schedule

📌 SCHEDULE SANITY SUMMARY
==================================================
📊 Total Schedules: 5
📅 Total Events: 11
❌ Issues Found: 0
⚠️ Warnings: 19
🔍 Orphaned Schedules: 0
📋 Competitions Without Schedules: 8

✅ Schedule sanity check complete
```

This script is essential for maintaining data quality and ensuring the schedule system functions correctly across all competitions.


