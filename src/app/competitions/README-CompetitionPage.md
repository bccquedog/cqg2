# Competition Page

A comprehensive public-facing page for viewing competition details, brackets, schedules, and leaderboards.

## Overview

The Competition Page provides a complete view of any competition (tournament or league) with multiple tabs for different aspects of the competition. It's designed for public consumption by players, spectators, and anyone interested in following the competition.

## Features

### 🎯 Multi-Tab Interface
- **Overview Tab** - Competition details, participants, and general information
- **Bracket Tab** - Tournament bracket visualization and match results
- **Schedule Tab** - Competition schedule and event timeline
- **Leaderboard Tab** - Competition-specific rankings and player statistics

### 📊 Competition Information
- **Basic Details** - Name, game, type, season, status
- **Participant Management** - List of participants and capacity
- **Entry Requirements** - Buy-in fees and membership requirements
- **Timeline** - Start and end dates
- **Status Tracking** - Current competition status

### 🔄 Real-time Updates
- **Live Data** - Real-time updates from Firestore
- **Dynamic Content** - Content updates based on competition type
- **Error Handling** - Graceful handling of missing competitions
- **Loading States** - Visual feedback during data loading

### 🎨 Visual Design
- **Clean Layout** - Card-based design with clear hierarchy
- **Status Badges** - Color-coded status indicators
- **Icon Integration** - Lucide React icons for better UX
- **Responsive Design** - Works on all screen sizes

## URL Structure

### Route Pattern
```
/competitions/[id]
```

### Examples
- `/competitions/soloCupS1` - Solo Cup Season 1
- `/competitions/clanLeagueS1` - Clan League Season 1
- `/competitions/tournament123` - Custom tournament

## Data Sources

### Firestore Collections
The page automatically checks both collections to find the competition:

```typescript
// Check tournaments collection
const tournamentDoc = await db.collection("tournaments").doc(id).get();

// Check leagues collection  
const leagueDoc = await db.collection("leagues").doc(id).get();
```

### Competition Data Structure
```typescript
interface Competition {
  id: string;
  name: string;
  game: string;
  type: "solo" | "clan";
  status: "upcoming" | "active" | "completed" | "cancelled";
  season: string;
  description?: string;
  maxParticipants?: number;
  participants: string[];
  createdAt: string;
  startDate?: string;
  endDate?: string;
  buyIn?: {
    enabled: boolean;
    amount: number;
    currency: string;
  };
  membershipRules?: {
    requiredFeatures: string[];
    hostRequired: string[];
  };
  createdBy?: string;
}
```

## Tab Content

### Overview Tab
- **Competition Details** - Name, description, game, type, season
- **Status Information** - Current status with color-coded badges
- **Timeline** - Start and end dates
- **Entry Requirements** - Buy-in fees and membership requirements
- **Participant List** - All registered participants

### Bracket Tab
- **Bracket Visualization** - Tournament bracket using BracketViewer
- **Match Results** - Current match results and progress
- **Winner Tracking** - Champion determination

### Schedule Tab
- **Event Timeline** - Competition schedule using ScheduleViewer
- **Match Times** - Specific match times and dates
- **Event Status** - Current event status and progress

### Leaderboard Tab
- **Competition Rankings** - Competition-specific leaderboard
- **Player Statistics** - Individual player performance
- **Real-time Updates** - Live ranking updates

## Visual Elements

### Status Badges
- **Upcoming** - Blue badge for future competitions
- **Active** - Green badge for ongoing competitions
- **Completed** - Gray badge for finished competitions
- **Cancelled** - Red badge for cancelled competitions

### Icons
- **Trophy** - Competition and leaderboard
- **Target** - Solo competitions and brackets
- **Users** - Clan competitions and participants
- **Gamepad2** - Game information
- **Crown** - Season and leaderboard
- **Calendar** - Schedule and dates
- **DollarSign** - Entry fees

### Layout Components
- **Header Section** - Competition title and key information
- **Navigation Tabs** - Tab switching interface
- **Content Cards** - Organized content sections
- **Responsive Grid** - Adaptive layout for different screen sizes

## Error Handling

### Competition Not Found
- **404 State** - Clear error message when competition doesn't exist
- **Navigation** - Back button to return to previous page
- **User Feedback** - Helpful error messages

### Loading States
- **Loading Spinner** - Visual feedback during data loading
- **Skeleton UI** - Placeholder content while loading
- **Error Recovery** - Retry mechanisms for failed requests

### Data Validation
- **Type Safety** - TypeScript interfaces for data validation
- **Null Checks** - Safe handling of missing data
- **Fallback Values** - Default values for missing fields

## Responsive Design

### Breakpoints
- **Mobile** - Single column layout with stacked tabs
- **Tablet** - Optimized spacing and sizing
- **Desktop** - Full layout with all features

### Mobile Optimizations
- **Touch-friendly** - Large touch targets for tabs
- **Readable Text** - Appropriate font sizes
- **Compact Layout** - Efficient use of space
- **Swipe Navigation** - Easy tab switching

## Performance

### Optimization Features
- **Efficient Queries** - Single query per competition
- **Lazy Loading** - Load content only when needed
- **Caching** - Client-side data caching
- **Minimal Re-renders** - Optimized React rendering

### Data Loading
```typescript
// Efficient data loading
useEffect(() => {
  const checkCompetition = async () => {
    // Try tournaments first, then leagues
    const tournamentDoc = await db.collection("tournaments").doc(id).get();
    if (tournamentDoc.exists) {
      setCompetition(tournamentDoc.data());
      return;
    }
    
    const leagueDoc = await db.collection("leagues").doc(id).get();
    if (leagueDoc.exists) {
      setCompetition(leagueDoc.data());
      return;
    }
    
    setError("Competition not found");
  };
  
  checkCompetition();
}, [id]);
```

## Accessibility

### Features
- **Keyboard Navigation** - Full keyboard support for tabs
- **Screen Reader Support** - Proper ARIA labels
- **High Contrast** - Accessible color schemes
- **Focus Management** - Clear focus indicators

### ARIA Labels
- **Tab Navigation** - Clear tab labels and descriptions
- **Status Information** - Descriptive status announcements
- **Content Sections** - Proper heading hierarchy

## Integration

### Component Dependencies
- **BracketViewer** - Tournament bracket visualization
- **ScheduleViewer** - Competition schedule display
- **LeaderboardViewer** - Competition rankings
- **Shadcn UI** - Card, Badge, Button components

### Navigation
```tsx
// Link to competition page
<Link href={`/competitions/${competitionId}`}>
  View Competition
</Link>

// Programmatic navigation
router.push(`/competitions/${competitionId}`);
```

## Testing

### Test Page
Access the test page at `/test-competition` to see different competition configurations.

### Test Scenarios
- **Valid Competitions** - Test with existing competition IDs
- **Invalid Competitions** - Test error handling for missing competitions
- **Different Types** - Test tournaments vs leagues
- **Various Statuses** - Test different competition statuses

### Sample Competitions
- `soloCupS1` - Solo Cup Season 1 (Tournament)
- `clanCupS1` - Clan Cup Season 1 (Tournament)
- `soloLeagueS1` - Solo League Season 1 (League)
- `clanLeagueS1` - Clan League Season 1 (League)

## Usage Examples

### Basic Implementation
```tsx
// Competition page is automatically generated for any ID
// Access via: /competitions/[id]
```

### Navigation from Other Pages
```tsx
import Link from 'next/link';

export default function CompetitionList() {
  return (
    <div>
      <Link href="/competitions/soloCupS1">
        View Solo Cup Season 1
      </Link>
    </div>
  );
}
```

### Programmatic Navigation
```tsx
import { useRouter } from 'next/navigation';

export default function CompetitionCard({ competitionId }) {
  const router = useRouter();
  
  const viewCompetition = () => {
    router.push(`/competitions/${competitionId}`);
  };
  
  return (
    <button onClick={viewCompetition}>
      View Competition
    </button>
  );
}
```

## Customization

### Styling
```tsx
// Custom styling can be applied via CSS classes
// The page uses Tailwind CSS for styling
```

### Content Customization
- **Tab Order** - Modify tab order in the component
- **Additional Tabs** - Add new tabs for custom content
- **Layout Changes** - Modify the layout structure
- **Component Integration** - Add new components to tabs

## Dependencies

### Required Packages
- **React** - Core framework
- **Next.js** - App router and navigation
- **Firebase** - Database and real-time updates
- **Lucide React** - Icon library
- **Tailwind CSS** - Styling framework
- **Shadcn UI** - Component library

### Firebase Services
- **Firestore** - Real-time database
- **Authentication** - Not required for public viewing

## Configuration

### Environment Variables
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Firestore Rules
Ensure proper read access for public competition viewing:
```javascript
// Allow public read access to competitions
match /tournaments/{document} {
  allow read: if true;
}

match /leagues/{document} {
  allow read: if true;
}
```

## Troubleshooting

### Common Issues

1. **Competition Not Found**
   - Check if competition ID exists in Firestore
   - Verify competition is in tournaments or leagues collection
   - Check console for errors

2. **Tabs Not Loading**
   - Verify component dependencies are installed
   - Check for JavaScript errors
   - Ensure proper data structure

3. **Real-time Updates Not Working**
   - Check Firestore rules
   - Verify network connection
   - Check for JavaScript errors

### Debug Commands
```bash
# Check competition data
firebase firestore:get tournaments/soloCupS1
firebase firestore:get leagues/soloLeagueS1

# Test page access
# Navigate to /test-competition for testing
```

## Future Enhancements

### Planned Features
- **Live Chat** - Real-time chat during competitions
- **Stream Integration** - Embedded live streams
- **Social Sharing** - Share competition results
- **Mobile App** - Native mobile app integration
- **Push Notifications** - Competition updates
- **Analytics** - Competition performance metrics

### Integration Opportunities
- **Payment Integration** - Direct entry fee payment
- **User Profiles** - Link to player profiles
- **Tournament Management** - Admin controls
- **Media Gallery** - Competition photos and videos
- **Comment System** - User comments and reactions

The Competition Page provides a comprehensive solution for viewing competition data with a focus on usability, performance, and real-time updates.


