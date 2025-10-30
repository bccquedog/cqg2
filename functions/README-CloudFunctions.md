# Cloud Functions Setup

This document describes the Firebase Cloud Functions setup for the CQG platform, including scheduled reminders and HTTP endpoints.

## Overview

The Cloud Functions provide:
- **Scheduled Reminders**: Automated competition reminders every 5 minutes
- **HTTP Endpoints**: REST API for accessing user, tournament, and match data
- **Real-time Processing**: Handles competition notifications and updates

## Functions

### 1. Scheduled Reminders (`scheduledReminders`)

**Trigger**: Pub/Sub schedule every 5 minutes  
**Purpose**: Automatically sends competition reminders  
**Implementation**: Uses the `sendCompetitionReminders()` function

```typescript
export const scheduledReminders = functions.pubsub
  .schedule("every 5 minutes")
  .onRun(async (context: any) => {
    console.log("⏰ Running scheduled reminders...", context.timestamp);
    try {
      await sendCompetitionReminders();
      console.log("✅ Scheduled reminders completed successfully");
    } catch (error) {
      console.error("❌ Error in scheduled reminders:", error);
      throw error;
    }
  });
```

**Features**:
- Runs every 5 minutes automatically
- Processes all tournaments and leagues
- Sends check-in, match start, and late warnings
- Logs all reminder activity
- Handles errors gracefully

### 2. HTTP Endpoints

#### Hello World (`helloWorld`)
- **URL**: `https://your-region-your-project.cloudfunctions.net/helloWorld`
- **Method**: GET
- **Response**: `{ message: 'Hello CQG from Firebase Functions!' }`

#### Status (`status`)
- **URL**: `https://your-region-your-project.cloudfunctions.net/status`
- **Method**: GET
- **Response**: `{ ok: true, timestamp: 1234567890 }`

#### Users (`users`)
- **URL**: `https://your-region-your-project.cloudfunctions.net/users/{userId}`
- **Method**: GET
- **Response**: User data from Firestore
- **Example**: `/users/user123`

#### Tournaments (`tournaments`)
- **URL**: `https://your-region-your-project.cloudfunctions.net/tournaments/{tournamentId}`
- **Method**: GET
- **Response**: Tournament data from Firestore
- **Example**: `/tournaments/soloCupS1`

#### Matches (`matches`)
- **URL**: `https://your-region-your-project.cloudfunctions.net/matches/{matchId}`
- **Method**: GET
- **Response**: Match data from Firestore
- **Example**: `/matches/match123`

## Configuration

### Firebase Configuration (`firebase.json`)

```json
{
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "firebase-debug.*.log",
        "*.local"
      ],
      "predeploy": [
        "npm --prefix \"$RESOURCE_DIR\" run lint",
        "npm --prefix \"$RESOURCE_DIR\" run build"
      ]
    }
  ]
}
```

### Package Configuration

**Dependencies**:
- `firebase-functions`: ^6.0.1
- `firebase-admin`: ^12.7.0
- `cors`: For CORS handling

**Scripts**:
- `build`: TypeScript compilation
- `deploy`: Deploy to Firebase
- `serve`: Local emulator
- `logs`: View function logs

## Deployment

### Prerequisites

1. **Firebase CLI**: Install and authenticate
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Project Setup**: Initialize Firebase project
   ```bash
   firebase init functions
   ```

3. **Blaze Plan**: Required for scheduled functions
   - Upgrade to Blaze (pay-as-you-go) pricing plan
   - Enable Cloud Scheduler and Pub/Sub APIs

### Deploy Commands

```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:scheduledReminders

# Deploy with build
pnpm build && firebase deploy --only functions
```

### Local Development

```bash
# Start emulator
firebase emulators:start --only functions

# Test locally
pnpm serve

# View logs
firebase functions:log
```

## Scheduled Functions

### Configuration

**Schedule Syntax**: Uses Unix Crontab format
- `every 5 minutes`: Every 5 minutes
- `0 9 * * *`: Daily at 9:00 AM
- `0 */6 * * *`: Every 6 hours

**Time Zones**: Specify with `.timeZone('America/New_York')`

### Monitoring

**Cloud Console**: Monitor in Google Cloud Console
- Cloud Scheduler: View scheduled jobs
- Cloud Functions: View function executions
- Pub/Sub: Monitor message delivery

**Logs**: View in Firebase Console or CLI
```bash
firebase functions:log --only scheduledReminders
```

## Error Handling

### Function Errors
- **Timeout**: Default 60 seconds, configurable
- **Memory**: Default 256MB, configurable
- **Retries**: Automatic retry for failed executions
- **Dead Letter**: Failed messages sent to dead letter queue

### Monitoring
- **Cloud Monitoring**: Automatic metrics and alerts
- **Error Reporting**: Automatic error tracking
- **Logging**: Structured logging with context

## Security

### CORS Configuration
```typescript
const corsHandler = cors({ origin: true });
```

### Authentication
- **Admin SDK**: Uses service account for Firestore access
- **HTTP Functions**: No authentication by default
- **Scheduled Functions**: Automatic authentication

### Network Security
- **VPC**: Can be configured for VPC access
- **Private**: Can be made private to VPC only
- **HTTPS**: All HTTP functions use HTTPS

## Performance

### Optimization
- **Cold Starts**: Minimize with connection pooling
- **Memory**: Configure based on usage
- **Timeout**: Set appropriate timeouts
- **Concurrency**: Configure concurrent executions

### Scaling
- **Automatic**: Scales based on demand
- **Concurrency**: Default 1000 concurrent executions
- **Rate Limiting**: Configurable rate limits

## Testing

### Local Testing
```bash
# Test reminders
pnpm test:reminders

# Test schedule
pnpm test:schedule

# Test sanity checks
pnpm sanity:reminders
pnpm sanity:schedule
```

### Integration Testing
```bash
# Test HTTP endpoints
curl https://your-region-your-project.cloudfunctions.net/helloWorld

# Test scheduled function
firebase functions:shell
> scheduledReminders()
```

## Troubleshooting

### Common Issues

1. **Build Errors**: Check TypeScript compilation
   ```bash
   pnpm build
   ```

2. **Deployment Errors**: Check Firebase CLI and authentication
   ```bash
   firebase login
   firebase use your-project-id
   ```

3. **Scheduled Function Not Running**: Check Blaze plan and APIs
   - Verify Blaze plan is active
   - Enable Cloud Scheduler API
   - Enable Pub/Sub API

4. **Permission Errors**: Check service account permissions
   - Firestore access
   - Cloud Scheduler access
   - Pub/Sub access

### Debug Commands
```bash
# View function logs
firebase functions:log

# Test locally
firebase emulators:start --only functions

# Check deployment status
firebase functions:list
```

## Cost Optimization

### Scheduled Functions
- **Frequency**: Adjust schedule frequency based on needs
- **Execution Time**: Optimize function execution time
- **Memory**: Use appropriate memory allocation

### HTTP Functions
- **Caching**: Implement caching where appropriate
- **Response Size**: Minimize response payload
- **Timeout**: Set appropriate timeouts

## Monitoring and Alerting

### Cloud Monitoring
- **Metrics**: Execution count, duration, errors
- **Alerts**: Set up alerts for failures
- **Dashboards**: Create monitoring dashboards

### Logging
- **Structured Logs**: Use structured logging
- **Log Levels**: Appropriate log levels
- **Context**: Include relevant context

This Cloud Functions setup provides a robust foundation for automated competition management with comprehensive monitoring and error handling capabilities.


