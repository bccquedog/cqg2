# Competition Reminders System

A comprehensive automated reminder system for tournaments and leagues that handles check-in notifications, match start alerts, and late warnings.

## Overview

The reminders system automatically monitors all competitions and sends timely notifications to participants and administrators based on configured schedules and timing rules.

## Features

- **Multi-Format Support**: Handles both tournament (day-based) and league (week-based) schedules
- **Main Schedule Integration**: Supports the new main schedule format with check-in windows
- **Automated Timing**: Sends reminders at configurable intervals before events
- **Duplicate Prevention**: Tracks sent reminders to avoid spam
- **Comprehensive Logging**: Records all sent reminders for audit and tracking
- **Real-time Processing**: Uses Firestore real-time updates for immediate processing

## Reminder Types

### Tournament Reminders
- **Check-in Reminders**: Sent 30 minutes before match events
- **Match Start Reminders**: Sent 5 minutes before match events
- **Round Start Reminders**: Sent 15 minutes before round events

### League Reminders
- **Check-in Reminders**: Sent 30 minutes before match events
- **Match Start Reminders**: Sent 5 minutes before match events

### Main Schedule Reminders
- **Pre-check-in**: Sent when check-in window opens
- **Pre-match**: Sent 5 minutes before competition start
- **Match Start**: Sent when competition starts
- **Late Warning**: Sent 30 minutes after start for late players

## Usage

### Running Reminders
```bash
pnpm test:reminders
```

### Checking Reminder Status
```bash
pnpm sanity:reminders
```

## Schedule Data Structure

### Tournament Schedule (Days)
```typescript
{
  days: [
    {
      date: "2025-09-06",
      events: [
        {
          id: "round1_match1",
          title: "Round 1 - Match 1",
          type: "match",
          startTime: "2025-09-06T18:15:00.000Z",
          endTime: "2025-09-06T19:15:00.000Z",
          status: "scheduled",
          participants: ["user1", "user2"],
          streamLink: "https://twitch.tv/tournament"
        }
      ]
    }
  ]
}
```

### League Schedule (Weeks)
```typescript
{
  weeks: [
    {
      weekNumber: 1,
      events: [
        {
          id: "week1_match1",
          title: "Week 1 - Match 1",
          type: "match",
          startTime: "2025-09-09T19:00:00.000Z",
          endTime: "2025-09-09T20:00:00.000Z",
          status: "scheduled",
          participants: ["user1", "user2"]
        }
      ]
    }
  ]
}
```

### Main Schedule Format
```typescript
{
  startTime: "2025-09-01T20:00:00Z",
  checkInOpens: "2025-09-01T19:30:00Z",
  checkInCloses: "2025-09-01T19:55:00Z",
  roundDurations: {
    R1: 30,
    R2: 45,
    Finals: 60
  },
  reminders: {
    preCheckIn: true,
    preMatch: true,
    lateWarning: true
  }
}
```

## Reminder Logic

### Tournament Events
```typescript
// Check-in reminder (30 minutes before)
if (event.type === "match" && minutesUntilEvent <= 30 && minutesUntilEvent > 0) {
  // Send check-in reminder
}

// Match start reminder (5 minutes before)
if (event.type === "match" && minutesUntilEvent <= 5 && minutesUntilEvent > 0) {
  // Send match start reminder
}

// Round start reminder (15 minutes before)
if (event.type === "round" && minutesUntilEvent <= 15 && minutesUntilEvent > 0) {
  // Send round start reminder
}
```

### League Events
```typescript
// Check-in reminder (30 minutes before)
if (event.type === "match" && minutesUntilEvent <= 30 && minutesUntilEvent > 0) {
  // Send check-in reminder
}

// Match start reminder (5 minutes before)
if (event.type === "match" && minutesUntilEvent <= 5 && minutesUntilEvent > 0) {
  // Send match start reminder
}
```

### Main Schedule Events
```typescript
// Pre-check-in reminder
if (now >= checkInOpens && now < checkInCloses) {
  // Send check-in open reminder
}

// Pre-match reminder (5 minutes before)
if (now >= fiveMinutesBefore && now < start) {
  // Send pre-match reminder
}

// Match start reminder
if (now >= start && now < start + 5 minutes) {
  // Send match start reminder
}

// Late warning (30 minutes after start)
if (now > start && now < start + 30 minutes) {
  // Send late warning
}
```

## Reminder Tracking

### Firestore Structure
```typescript
// reminderLogs collection
{
  competitionId: "soloCupS1",
  competitionType: "tournament",
  eventId: "round1_match1",
  eventTitle: "Round 1 - Match 1",
  reminderType: "checkin",
  sentAt: "2025-09-05T17:14:25.949Z",
  participants: ["user1", "user2"],
  streamLink: "https://twitch.tv/tournament"
}

// Event reminder tracking
{
  remindersSent: ["checkin", "start", "round"]
}
```

### Duplicate Prevention
- Tracks sent reminders in event documents
- Prevents duplicate notifications
- Maintains reminder history
- Supports reminder retry logic

## Integration Points

### Ready for Integration
- **Discord Bot**: TODO comments for Discord integration
- **Push Notifications**: Ready for mobile push notifications
- **Email System**: Ready for email reminder integration
- **SMS Notifications**: Ready for SMS integration
- **Webhook Support**: Ready for external webhook integration

### Scheduled Execution
- **Cron Jobs**: Ready for scheduled execution (every 5-15 minutes)
- **Cloud Functions**: Ready for Firebase Cloud Functions deployment
- **Background Processing**: Optimized for background execution

## Functions

### Main Functions
- `sendCompetitionReminders()`: Main reminder checking function
- `checkTournamentReminders()`: Tournament-specific reminder logic
- `checkLeagueReminders()`: League-specific reminder logic
- `checkMainScheduleReminders()`: Main schedule reminder logic

### Reminder Handlers
- `sendCheckInReminder()`: Check-in reminder handler
- `sendMatchStartReminder()`: Match start reminder handler
- `sendRoundStartReminder()`: Round start reminder handler
- `sendMainScheduleReminder()`: Main schedule reminder handler

### Utility Functions
- `markReminderSent()`: Tracks sent reminders
- `getDb()`: Lazy Firestore initialization

## Configuration

### Reminder Settings
```typescript
reminders: {
  preCheckIn: true,    // Send check-in open reminders
  preMatch: true,      // Send pre-match reminders
  lateWarning: true    // Send late player warnings
}
```

### Timing Configuration
- **Check-in Window**: 30 minutes before events
- **Pre-match**: 5 minutes before start
- **Late Warning**: 30 minutes after start
- **Round Reminders**: 15 minutes before rounds

## Monitoring and Logging

### Reminder Logs
- All sent reminders logged to Firestore
- Includes participant information
- Tracks stream links and metadata
- Provides audit trail for compliance

### Status Tracking
- Real-time reminder status
- Duplicate prevention tracking
- Error handling and logging
- Performance monitoring

## Error Handling

### Graceful Degradation
- Continues processing despite individual errors
- Logs errors for debugging
- Provides detailed error context
- Maintains system stability

### Validation
- Validates schedule data before processing
- Checks for required fields
- Handles missing or malformed data
- Provides helpful error messages

## Performance

### Efficient Processing
- Uses collection group queries
- Batches reminder operations
- Minimizes Firestore reads
- Optimized for large competitions

### Scalability
- Handles multiple competitions simultaneously
- Processes events in batches
- Memory-efficient processing
- Background execution ready

## Testing

### Test Commands
```bash
# Test reminder system
pnpm test:reminders

# Check reminder status
pnpm sanity:reminders

# Test schedule data
pnpm test:schedule

# Check schedule integrity
pnpm sanity:schedule
```

### Test Data
- Sample tournaments and leagues
- Various event types and timings
- Different reminder configurations
- Edge cases and error conditions

## Deployment

### Cloud Functions
- Ready for Firebase Cloud Functions
- Scheduled execution support
- Environment variable configuration
- Error monitoring and alerting

### Local Development
- Local testing support
- Development environment setup
- Debug logging and monitoring
- Hot reload support

## Future Enhancements

### Planned Features
- **Custom Reminder Times**: User-configurable reminder intervals
- **Reminder Preferences**: User-specific notification preferences
- **Multi-language Support**: Localized reminder messages
- **Advanced Scheduling**: Complex scheduling rules and conditions

### Integration Roadmap
- **Discord Integration**: Real-time Discord notifications
- **Email Templates**: Rich HTML email reminders
- **Push Notifications**: Mobile app notifications
- **SMS Integration**: Text message reminders
- **Webhook Support**: External system integration

## Troubleshooting

### Common Issues
- **Missing Schedules**: Ensure schedules are properly seeded
- **Timing Issues**: Check timezone configurations
- **Duplicate Reminders**: Verify reminder tracking logic
- **Performance Issues**: Monitor Firestore usage

### Debug Commands
```bash
# Check schedule data
pnpm sanity:schedule

# Check reminder logs
pnpm sanity:reminders

# Test reminder system
pnpm test:reminders
```

This reminders system provides a robust foundation for automated competition notifications with comprehensive tracking and monitoring capabilities.


