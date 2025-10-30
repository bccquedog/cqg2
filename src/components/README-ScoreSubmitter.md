# ScoreSubmitter Component

A comprehensive component for players to submit their match scores with ticket validation and real-time feedback.

## Overview

The ScoreSubmitter provides a secure, user-friendly interface for players to submit their match scores. It includes ticket validation, score range validation, and comprehensive error handling to ensure data integrity and user experience.

## Features

### 🎯 Score Input
- **Configurable Range** - Set minimum and maximum score limits
- **Decimal Support** - Optional decimal score support
- **Real-time Validation** - Immediate feedback on invalid scores
- **Input Formatting** - Automatic number formatting and validation

### 🎫 Ticket Validation
- **Match Ticket Code** - Secure ticket-based score submission
- **Automatic Formatting** - Uppercase conversion and trimming
- **Length Validation** - 6-20 character length requirements
- **Required Field** - Mandatory ticket code for submission

### ✅ Submission Process
- **API Integration** - Secure submission via /api/submitScore endpoint
- **Loading States** - Visual feedback during submission
- **Status Messages** - Clear success/error feedback
- **Auto-clear Form** - Form resets after successful submission

### 🎨 User Experience
- **Clean Design** - Card-based layout with clear hierarchy
- **Responsive Layout** - Works on all screen sizes
- **Visual Feedback** - Color-coded status messages
- **Helpful Instructions** - Clear guidance and tips

## Props

### ScoreSubmitterProps
```typescript
interface ScoreSubmitterProps {
  competitionId: string;        // Competition identifier
  matchId: string;             // Match identifier
  userId: string;              // User identifier
  maxScore?: number;           // Maximum allowed score (default: 100)
  minScore?: number;           // Minimum allowed score (default: 0)
  allowDecimal?: boolean;      // Allow decimal scores (default: false)
  className?: string;          // Additional CSS classes
}
```

## Usage Examples

### Basic Usage
```tsx
import ScoreSubmitter from "@/components/ScoreSubmitter";

export default function MatchPage() {
  return (
    <ScoreSubmitter
      competitionId="soloCupS1"
      matchId="match1"
      userId="user1"
    />
  );
}
```

### With Custom Score Range
```tsx
<ScoreSubmitter
  competitionId="clanLeagueS1"
  matchId="match2"
  userId="user2"
  maxScore={50}
  minScore={0}
  allowDecimal={true}
/>
```

### With Custom Styling
```tsx
<ScoreSubmitter
  competitionId="tournament123"
  matchId="final"
  userId="player456"
  className="max-w-md mx-auto"
/>
```

## Validation Rules

### Score Validation
- **Range Check** - Score must be between minScore and maxScore
- **Type Check** - Must be a valid number
- **Decimal Check** - If allowDecimal is false, must be a whole number
- **Required Field** - Score cannot be empty

### Ticket Validation
- **Required Field** - Ticket code cannot be empty
- **Length Check** - Must be 6-20 characters
- **Format Check** - Automatically converted to uppercase and trimmed
- **Security** - Used for match verification

## API Integration

### Endpoint
```
POST /api/submitScore
```

### Request Body
```typescript
{
  userId: string;
  competitionId: string;
  matchId: string;
  score: number;
  code: string;  // Ticket code
}
```

### Response
```typescript
// Success (200)
{
  success: true;
  message: string;
}

// Error (400/500)
{
  error: string;
  message: string;
}
```

## Visual Elements

### Icons
- **Trophy** - Component title and success states
- **Shield** - Ticket code security indicator
- **Send** - Submit button
- **RefreshCw** - Loading state
- **CheckCircle** - Success state
- **XCircle** - Error state
- **AlertCircle** - Warning state

### Status Colors
- **Green** - Success messages and states
- **Red** - Error messages and states
- **Yellow** - Warning messages and states
- **Blue** - Info messages and states

### Layout Components
- **Card** - Main container with header and content
- **Input Fields** - Score and ticket inputs with labels
- **Button** - Submit button with loading states
- **Status Panel** - Dynamic status message display

## State Management

### Component State
```typescript
const [score, setScore] = useState<number | "">("");
const [ticket, setTicket] = useState("");
const [status, setStatus] = useState<SubmissionStatus | null>(null);
const [loading, setLoading] = useState(false);
const [submitted, setSubmitted] = useState(false);
```

### Status Types
```typescript
interface SubmissionStatus {
  type: "success" | "error" | "warning" | "info";
  message: string;
  details?: string;
}
```

## Error Handling

### Validation Errors
- **Score Range** - Clear messages for out-of-range scores
- **Decimal Validation** - Specific error for decimal scores when not allowed
- **Empty Fields** - Helpful messages for missing required fields
- **Ticket Format** - Clear guidance on ticket code requirements

### API Errors
- **Network Errors** - Graceful handling of connection issues
- **Server Errors** - Clear error messages from server responses
- **Timeout Handling** - Proper timeout and retry logic
- **User Feedback** - Actionable error messages

### Recovery Options
- **Retry Submission** - Users can retry failed submissions
- **Form Reset** - Clear form for new attempts
- **Support Contact** - Guidance for persistent issues

## Accessibility

### Features
- **Keyboard Navigation** - Full keyboard support
- **Screen Reader Support** - Proper ARIA labels and descriptions
- **High Contrast** - Accessible color schemes
- **Focus Management** - Clear focus indicators

### ARIA Labels
- **Form Labels** - Descriptive labels for all inputs
- **Status Announcements** - Screen reader announcements for status changes
- **Button States** - Clear button state descriptions
- **Error Messages** - Accessible error and success messages

## Responsive Design

### Breakpoints
- **Mobile** - Single column layout with stacked elements
- **Tablet** - Optimized spacing and sizing
- **Desktop** - Full layout with all features

### Mobile Optimizations
- **Touch-friendly** - Large touch targets for inputs and buttons
- **Readable Text** - Appropriate font sizes for mobile
- **Compact Layout** - Efficient use of screen space
- **Easy Input** - Mobile-optimized input fields

## Performance

### Optimization Features
- **Efficient Validation** - Real-time validation without excessive re-renders
- **Debounced Input** - Optimized input handling
- **Minimal Re-renders** - Optimized state updates
- **Lazy Loading** - Component loads only when needed

### Memory Management
- **State Cleanup** - Proper cleanup of component state
- **Event Listeners** - Proper cleanup of event listeners
- **API Calls** - Cancellation of pending requests
- **Timeout Management** - Proper cleanup of timeouts

## Security

### Features
- **Ticket Validation** - Secure ticket-based submission
- **Input Sanitization** - Proper input validation and sanitization
- **API Security** - Secure API communication
- **Error Handling** - No sensitive information in error messages

### Best Practices
- **Client-side Validation** - Immediate feedback without server round-trips
- **Server-side Validation** - Final validation on the server
- **Secure Communication** - HTTPS for all API calls
- **Input Limits** - Reasonable limits on input values

## Testing

### Test Page
Access the test page at `/test-score-submitter` to see different configurations.

### Test Scenarios
- **Valid Submissions** - Test with valid scores and tickets
- **Invalid Scores** - Test score range validation
- **Invalid Tickets** - Test ticket format validation
- **API Errors** - Test error handling scenarios
- **Loading States** - Test loading and success states

### Test Data
- **Sample Competitions** - Pre-configured competition IDs
- **Sample Matches** - Various match scenarios
- **Sample Users** - Different user configurations
- **Score Ranges** - Various min/max score configurations

## Integration

### Component Dependencies
- **Shadcn UI** - Card, Button, Input, Badge components
- **Lucide React** - Icon library
- **Tailwind CSS** - Styling framework
- **React** - Core framework

### API Dependencies
- **Fetch API** - HTTP requests
- **JSON** - Request/response formatting
- **Error Handling** - Proper error management

## Customization

### Styling
```tsx
// Custom styling via className prop
<ScoreSubmitter
  competitionId="comp1"
  matchId="match1"
  userId="user1"
  className="my-custom-class"
/>

// CSS customization
.my-custom-class {
  border: 2px solid #custom-color;
  border-radius: 12px;
}
```

### Configuration
- **Score Ranges** - Customize min/max scores per game type
- **Decimal Support** - Enable/disable decimal scores
- **Validation Rules** - Customize validation messages
- **UI Elements** - Modify layout and styling

## Troubleshooting

### Common Issues

1. **Score Not Submitting**
   - Check score is within valid range
   - Verify ticket code is correct
   - Check network connection
   - Verify API endpoint is accessible

2. **Validation Errors**
   - Check score format (whole number vs decimal)
   - Verify ticket code length (6-20 characters)
   - Ensure all required fields are filled

3. **API Errors**
   - Check server logs for detailed error information
   - Verify API endpoint configuration
   - Check authentication and permissions

### Debug Commands
```bash
# Check API endpoint
curl -X POST /api/submitScore \
  -H "Content-Type: application/json" \
  -d '{"userId":"user1","competitionId":"comp1","matchId":"match1","score":85,"code":"TICKET123"}'

# Check component props
console.log(competitionId, matchId, userId);
```

## Future Enhancements

### Planned Features
- **Score History** - View previous score submissions
- **Draft Saving** - Save draft scores before submission
- **Bulk Submission** - Submit multiple scores at once
- **Score Verification** - Additional verification steps
- **Offline Support** - Submit scores when offline
- **Push Notifications** - Notifications for submission status

### Integration Opportunities
- **Match Integration** - Direct integration with match pages
- **Tournament Integration** - Tournament-specific features
- **User Profiles** - Integration with user profile systems
- **Analytics** - Score submission analytics and insights

The ScoreSubmitter provides a comprehensive solution for secure score submission with a focus on user experience, validation, and error handling.


