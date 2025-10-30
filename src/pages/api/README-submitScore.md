# Submit Score API Endpoint

A secure API endpoint for submitting match scores with ticket validation and bracket management.

## Overview

The `/api/submitScore` endpoint provides a secure way for players to submit their match scores. It includes comprehensive validation, ticket verification, and automatic bracket progression.

## Endpoint

```
POST /api/submitScore
```

## Request

### Headers
```
Content-Type: application/json
```

### Body
```typescript
{
  userId: string;        // User ID submitting the score
  competitionId: string; // Competition ID (tournament/league)
  matchId: string;       // Match ID within the competition
  score: number;         // Score to submit (≥ 0)
  code: string;          // Ticket code for validation
}
```

### Example Request
```json
{
  "userId": "user1",
  "competitionId": "soloCupS1",
  "matchId": "match1",
  "score": 85,
  "code": "TICKET123"
}
```

## Response

### Success Response (200)
```typescript
{
  success: true;
  message: string;
  result: {
    matchId: string;
    scores: Record<string, number>;
    winner?: string;
    status: "live" | "completed";
  }
}
```

### Example Success Response
```json
{
  "success": true,
  "message": "Score submitted successfully",
  "result": {
    "matchId": "match1",
    "scores": {
      "user1": 85,
      "user2": 92
    },
    "winner": "user2",
    "status": "completed"
  }
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Missing required fields. Please provide userId, competitionId, matchId, score, and code."
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid or expired ticket code. Please check your ticket and try again."
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": "Match or competition not found. Please verify the match ID and competition ID."
}
```

#### 409 Conflict
```json
{
  "success": false,
  "error": "Score has already been submitted for this match."
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "An unexpected error occurred while submitting the score. Please try again."
}
```

## Validation Rules

### Required Fields
- `userId` - Must be a non-empty string
- `competitionId` - Must be a non-empty string
- `matchId` - Must be a non-empty string
- `score` - Must be a number ≥ 0
- `code` - Must be a non-empty string

### Score Validation
- Must be a valid number
- Cannot be negative
- Can be decimal or integer (depending on competition settings)

### Ticket Validation
- Must be 6-20 characters long
- Must be valid and not expired
- Must be associated with the correct competition
- Cannot be used multiple times

### Match Validation
- Match must exist in the competition
- User must be a participant in the match
- Score cannot be submitted twice for the same match

## Business Logic

### Score Submission Process

1. **Ticket Validation**
   - Verify ticket code exists and is valid
   - Check ticket is not expired
   - Ensure ticket is associated with correct competition

2. **Match Location**
   - Find the match in the competition bracket
   - Verify user is a participant in the match
   - Check if score has already been submitted

3. **Score Recording**
   - Record the score for the user
   - Update match status to "live" or "completed"

4. **Winner Determination**
   - If both players have submitted scores:
     - Determine winner based on higher score
     - Update match status to "completed"
     - Advance winner to next round (if applicable)

5. **Bracket Progression**
   - Find next available slot in next round
   - Add winner to next match
   - Carry ticket reference for next match

### Match States

- **"live"** - Match is active, waiting for scores
- **"completed"** - Both scores submitted, winner determined

### Bracket Management

- Automatic winner advancement to next round
- Ticket code inheritance for next match
- Support for single elimination and round robin formats

## Security Features

### Ticket-Based Authentication
- Secure ticket codes for match access
- Time-limited ticket validity
- One-time use tickets

### Input Validation
- Comprehensive server-side validation
- SQL injection prevention
- XSS protection

### Error Handling
- Detailed error messages for debugging
- No sensitive information in error responses
- Proper HTTP status codes

## Usage Examples

### JavaScript/TypeScript
```typescript
const submitScore = async (userId: string, competitionId: string, matchId: string, score: number, ticketCode: string) => {
  try {
    const response = await fetch('/api/submitScore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        competitionId,
        matchId,
        score,
        code: ticketCode
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('Score submitted successfully:', data.result);
      return data.result;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Error submitting score:', error);
    throw error;
  }
};

// Usage
submitScore('user1', 'soloCupS1', 'match1', 85, 'TICKET123')
  .then(result => {
    console.log('Match result:', result);
  })
  .catch(error => {
    console.error('Submission failed:', error);
  });
```

### React Component Integration
```tsx
import { useState } from 'react';

function ScoreSubmissionForm({ userId, competitionId, matchId }) {
  const [score, setScore] = useState('');
  const [ticketCode, setTicketCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/submitScore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          competitionId,
          matchId,
          score: parseInt(score),
          code: ticketCode
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="number"
        value={score}
        onChange={(e) => setScore(e.target.value)}
        placeholder="Enter score"
        required
      />
      <input
        type="text"
        value={ticketCode}
        onChange={(e) => setTicketCode(e.target.value)}
        placeholder="Enter ticket code"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Score'}
      </button>
      {result && (
        <div className={result.success ? 'success' : 'error'}>
          {result.success ? result.message : result.error}
        </div>
      )}
    </form>
  );
}
```

### cURL Example
```bash
curl -X POST http://localhost:3000/api/submitScore \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user1",
    "competitionId": "soloCupS1",
    "matchId": "match1",
    "score": 85,
    "code": "TICKET123"
  }'
```

## Error Handling

### Common Error Scenarios

1. **Invalid Ticket**
   - Ticket code doesn't exist
   - Ticket has expired
   - Ticket is for wrong competition

2. **Match Not Found**
   - Competition doesn't exist
   - Match ID is invalid
   - User not in match

3. **Duplicate Submission**
   - Score already submitted for this match
   - User trying to submit twice

4. **Validation Errors**
   - Missing required fields
   - Invalid score format
   - Score out of range

### Error Response Format
All errors follow the same format:
```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

## Rate Limiting

Consider implementing rate limiting to prevent abuse:
- Maximum submissions per user per minute
- Maximum submissions per IP per hour
- Temporary bans for repeated failures

## Monitoring and Logging

### Logged Events
- Successful score submissions
- Failed validation attempts
- Ticket validation failures
- Bracket progression events

### Metrics to Track
- Submission success rate
- Average response time
- Error frequency by type
- Ticket usage patterns

## Testing

### Test Scenarios

1. **Valid Submission**
   - Correct ticket code
   - Valid score
   - First submission

2. **Invalid Ticket**
   - Expired ticket
   - Wrong competition ticket
   - Non-existent ticket

3. **Duplicate Submission**
   - Same user, same match
   - Different score attempt

4. **Edge Cases**
   - Zero score
   - Maximum score
   - Decimal scores

### Test Data
```json
{
  "validSubmission": {
    "userId": "user1",
    "competitionId": "soloCupS1",
    "matchId": "match1",
    "score": 85,
    "code": "TICKET123"
  },
  "invalidTicket": {
    "userId": "user1",
    "competitionId": "soloCupS1",
    "matchId": "match1",
    "score": 85,
    "code": "INVALID"
  },
  "duplicateSubmission": {
    "userId": "user1",
    "competitionId": "soloCupS1",
    "matchId": "match1",
    "score": 90,
    "code": "TICKET123"
  }
}
```

## Dependencies

### Required Services
- Firestore database
- Ticket validation system
- Bracket management system

### Required Collections
- `tournaments/{competitionId}/bracket/bracketDoc`
- `tickets` (for validation)

## Performance Considerations

### Optimization Strategies
- Efficient Firestore queries
- Minimal data transfer
- Caching for frequently accessed data
- Batch operations where possible

### Scalability
- Horizontal scaling support
- Database connection pooling
- Async processing for heavy operations

## Security Considerations

### Authentication
- Ticket-based access control
- User verification
- Competition membership validation

### Data Protection
- Input sanitization
- Output encoding
- Secure error messages

### Audit Trail
- Score submission logging
- Ticket usage tracking
- Bracket change history

## Future Enhancements

### Planned Features
- Real-time score updates
- Score verification system
- Dispute resolution
- Analytics and reporting

### Integration Opportunities
- Live streaming integration
- Social media sharing
- Mobile app support
- Webhook notifications

The Submit Score API provides a robust, secure foundation for match score submission with comprehensive validation and automatic bracket management.


