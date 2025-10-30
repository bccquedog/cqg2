# BracketViewer Component

A React component for displaying tournament brackets in real-time with a clean, responsive design.

## Features

- **Real-time Updates**: Uses Firestore `onSnapshot` for live bracket updates
- **Responsive Design**: Horizontal scrolling for mobile devices
- **Status Indicators**: Visual status badges and icons for match states
- **Progress Tracking**: Shows overall bracket progress and completion
- **Error Handling**: Graceful error states and loading indicators
- **TypeScript Support**: Fully typed with proper interfaces

## Usage

```tsx
import BracketViewer from "@/components/BracketViewer";

function TournamentPage() {
  return (
    <div>
      <BracketViewer competitionId="soloCupS1" />
    </div>
  );
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `competitionId` | `string` | The tournament/league ID to display the bracket for |

## Bracket Data Structure

The component expects bracket data in the following format:

```typescript
interface BracketData {
  rounds: BracketRound[];
  currentRound: number;
  bracketType: "singleElim" | "doubleElim" | "roundRobin";
  createdAt: string;
}

interface BracketRound {
  roundNumber: number;
  matches: BracketMatch[];
}

interface BracketMatch {
  matchId: string;
  players: string[];
  status: "pending" | "live" | "completed";
  winner: string | null;
  scores: Record<string, number | null>;
  ticketCodes?: Record<string, string>;
}
```

## Firestore Path

The component reads bracket data from:
```
/tournaments/{competitionId}/bracket/bracketDoc
```

## States

### Loading State
- Shows a spinner with "Loading bracket..." message
- Appears while fetching initial data

### Error State
- Shows error message if bracket cannot be loaded
- Displays "Bracket Not Available" with error details

### Empty State
- Shows "No Bracket Found" if no bracket exists
- Displays helpful message for users

### Success State
- Displays the full bracket with all rounds and matches
- Shows real-time updates as matches progress

## Visual Elements

### Header Section
- Tournament title with trophy icon
- Bracket type and competition ID
- Match statistics (total, completed, live)

### Progress Bar
- Shows overall bracket completion percentage
- Current round indicator
- Visual progress representation

### Round Columns
- Each round displayed in a separate column
- Horizontal scrolling for mobile devices
- Round number and match count

### Match Cards
- Player names and scores
- Status badges (Pending, Live, Completed)
- Winner highlighting
- Status icons with animations

### Footer
- Creation date
- Last updated timestamp

## Styling

- Uses Tailwind CSS for styling
- Responsive design with mobile-first approach
- Consistent color scheme with status-based colors
- Smooth transitions and hover effects
- Gradient backgrounds for visual appeal

## Dependencies

- React (useState, useEffect)
- Firebase/Firestore (onSnapshot)
- Lucide React (icons)
- Tailwind CSS (styling)
- Shadcn UI components (Card, Badge)

## Example Pages

- `/bracket/[id]` - Dynamic bracket page for any tournament
- `/test-bracket` - Test page with multiple bracket examples

## Testing

To test the component:

1. Run the seeder to create sample bracket data:
   ```bash
   pnpm seed
   ```

2. Visit the test page:
   ```
   http://localhost:3000/test-bracket
   ```

3. Or view specific brackets:
   ```
   http://localhost:3000/bracket/soloCupS1
   http://localhost:3000/bracket/clanCupS1
   ```

## Real-time Updates

The component automatically updates when:
- Match status changes (pending → live → completed)
- Scores are updated
- Winners are determined
- New rounds are added

## Accessibility

- Proper semantic HTML structure
- ARIA labels for screen readers
- Keyboard navigation support
- High contrast colors for visibility
- Responsive text sizing

## Performance

- Efficient Firestore queries
- Minimal re-renders with proper state management
- Lazy loading of bracket data
- Optimized for large tournaments with many matches


