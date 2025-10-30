# LeaderboardViewer Component

A public-facing component for displaying leaderboards to players and spectators with real-time updates and customizable features.

## Overview

The LeaderboardViewer provides a clean, user-friendly interface for displaying leaderboard data across different scopes (global, game-specific, and league-specific). It's designed for public consumption by players and spectators.

## Features

### 🎯 Multi-Scope Support
- **Global Leaderboard** - Overall performance across all games and competitions
- **Game Leaderboard** - Performance within specific games (e.g., NBA2K, Madden)
- **League Leaderboard** - Performance within specific leagues

### 📊 Player Statistics
- **Wins/Losses** - Match performance with color coding
- **Win Rate** - Calculated percentage with proper formatting
- **Total Points** - Accumulated points across competitions
- **Titles** - Number of championships won
- **Tier System** - Optional tier badges (Grandmaster, Master, Diamond, etc.)
- **Ranking** - Automatic ranking with special icons for top 3

### 🔄 Real-time Features
- **Live Updates** - Real-time data synchronization with Firestore
- **Auto-refresh** - Automatic data updates
- **Manual Refresh** - Optional refresh button
- **Loading States** - Visual feedback during data loading
- **Error Handling** - Graceful error handling with retry options

### 🎨 Visual Design
- **Clean Layout** - Card-based design with clear hierarchy
- **Color Coding** - Green for wins, red for losses, blue for points
- **Top 3 Highlighting** - Special styling for top performers
- **Responsive Design** - Works on all screen sizes
- **Icon Integration** - Lucide React icons for better UX

## Props

### LeaderboardViewerProps
```typescript
interface LeaderboardViewerProps {
  scope?: "global" | "game" | "league";  // Default: "global"
  filterId?: string;                     // Game or league ID
  limit?: number;                        // Number of players to show (default: 20)
  showTiers?: boolean;                   // Show tier badges (default: true)
  showRefresh?: boolean;                 // Show refresh button (default: true)
  className?: string;                    // Additional CSS classes
}
```

## Usage Examples

### Basic Global Leaderboard
```tsx
import LeaderboardViewer from "@/components/LeaderboardViewer";

export default function HomePage() {
  return (
    <div>
      <LeaderboardViewer />
    </div>
  );
}
```

### Game-Specific Leaderboard
```tsx
<LeaderboardViewer 
  scope="game" 
  filterId="madden" 
  limit={15}
  showTiers={true}
/>
```

### League-Specific Leaderboard
```tsx
<LeaderboardViewer 
  scope="league" 
  filterId="soloLeagueS1" 
  limit={10}
  showRefresh={false}
/>
```

### Compact Version
```tsx
<LeaderboardViewer 
  scope="global" 
  limit={5}
  showTiers={false}
  showRefresh={false}
  className="max-w-md"
/>
```

## Data Structure

### LeaderboardPlayer Interface
```typescript
interface LeaderboardPlayer {
  id: string;
  wins: number;
  losses: number;
  totalPoints: number;
  titles: number;
  gamesPlayed: number;
  lastUpdated?: string;
  tier?: string;
  badge?: string;
  rank?: number;
}
```

### Firestore Structure
```
leaderboards/
├── global/players/{userId}
├── game-{gameId}/players/{userId}
└── league-{leagueId}/players/{userId}
```

## Visual Elements

### Icons and Badges
- **Crown** - 1st place
- **Medal** - 2nd and 3rd place
- **Trophy** - Titles and global leaderboard
- **Gamepad2** - Game-specific leaderboards
- **Users** - League-specific leaderboards
- **Tier Badges** - Color-coded tier indicators

### Color Scheme
- **Green** - Wins and positive metrics
- **Red** - Losses and negative metrics
- **Blue** - Points and neutral metrics
- **Yellow** - Titles and achievements
- **Purple** - Grandmaster tier
- **Gold** - Gold tier and top performers

## Responsive Design

### Breakpoints
- **Mobile** - Single column layout with compact stats
- **Tablet** - Optimized spacing and sizing
- **Desktop** - Full layout with all features

### Mobile Optimizations
- **Touch-friendly** - Large touch targets
- **Readable Text** - Appropriate font sizes
- **Compact Layout** - Efficient use of space
- **Swipe-friendly** - Easy navigation

## Error Handling

### Connection Issues
- **Offline Support** - Graceful degradation when offline
- **Retry Logic** - Manual retry button for failed requests
- **User Feedback** - Clear error messages

### Data Validation
- **Type Safety** - TypeScript interfaces for data validation
- **Null Checks** - Safe handling of missing data
- **Fallback Values** - Default values for missing fields

## Performance

### Optimization Features
- **Efficient Queries** - Optimized Firestore queries with limits
- **Real-time Updates** - Minimal data transfer with onSnapshot
- **Caching** - Client-side data caching
- **Lazy Loading** - Load data as needed

### Query Optimization
```typescript
// Optimized Firestore query
db.collection(path)
  .orderBy("totalPoints", "desc")
  .orderBy("wins", "desc")
  .limit(limit)
  .onSnapshot(callback)
```

## Accessibility

### Features
- **Keyboard Navigation** - Full keyboard support
- **Screen Reader Support** - Proper ARIA labels
- **High Contrast** - Accessible color schemes
- **Focus Management** - Clear focus indicators

### ARIA Labels
- **Ranking** - Clear rank announcements
- **Statistics** - Descriptive labels for all metrics
- **Actions** - Clear button labels and descriptions

## Testing

### Test Page
Access the test page at `/test-leaderboard-viewer` to see different configurations.

### Test Scenarios
- **Global Leaderboard** - Default configuration
- **Game Leaderboard** - NBA2K specific
- **League Leaderboard** - Solo League S1 specific
- **Compact Version** - Minimal features
- **Full Version** - All features enabled

## Integration Examples

### Tournament Page
```tsx
export default function TournamentPage({ tournamentId }) {
  return (
    <div>
      <h1>Tournament Leaderboard</h1>
      <LeaderboardViewer 
        scope="league" 
        filterId={tournamentId}
        limit={10}
      />
    </div>
  );
}
```

### Game Hub
```tsx
export default function GameHub({ gameId }) {
  return (
    <div>
      <h1>Game Leaderboard</h1>
      <LeaderboardViewer 
        scope="game" 
        filterId={gameId}
        limit={20}
        showTiers={true}
      />
    </div>
  );
}
```

### Home Page
```tsx
export default function HomePage() {
  return (
    <div>
      <h1>Top Players</h1>
      <LeaderboardViewer 
        scope="global" 
        limit={10}
        showTiers={true}
        showRefresh={true}
      />
    </div>
  );
}
```

## Customization

### Styling
```tsx
// Custom styling
<LeaderboardViewer 
  className="my-custom-class"
  scope="global"
/>

// CSS
.my-custom-class {
  border: 2px solid #custom-color;
  border-radius: 12px;
}
```

### Theme Integration
The component automatically adapts to your theme using Tailwind CSS classes and Shadcn UI components.

## Dependencies

### Required Packages
- **React** - Core framework
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
Ensure proper read access for public leaderboard viewing:
```javascript
// Allow public read access to leaderboards
match /leaderboards/{document=**} {
  allow read: if true;
}
```

## Troubleshooting

### Common Issues

1. **No Data Displayed**
   - Check Firestore connection
   - Verify leaderboard data exists
   - Check console for errors
   - Verify scope and filterId parameters

2. **Real-time Updates Not Working**
   - Check Firestore rules
   - Verify network connection
   - Check for JavaScript errors

3. **Styling Issues**
   - Verify Tailwind CSS is properly configured
   - Check Shadcn UI components are installed
   - Ensure proper CSS imports

### Debug Commands
```bash
# Check leaderboard data
pnpm sanity:leaderboards

# Test Firestore connection
# Check browser console for errors
```

## Performance Considerations

### Optimization Tips
- **Limit Results** - Use appropriate limit values
- **Efficient Queries** - Use specific field queries
- **Caching** - Leverage browser caching
- **Lazy Loading** - Load components as needed

### Monitoring
- **Query Performance** - Monitor Firestore query performance
- **Memory Usage** - Track component memory usage
- **Network Requests** - Monitor API calls
- **User Experience** - Track loading times

## Future Enhancements

### Planned Features
- **Player Details** - Click to view detailed player stats
- **Historical Data** - View leaderboard history
- **Export Functionality** - Export leaderboard data
- **Advanced Filtering** - More filter options
- **Social Features** - Player comparisons and sharing
- **Animations** - Smooth transitions and updates

### Integration Opportunities
- **Player Profiles** - Link to player profile pages
- **Competition Integration** - Link to specific competitions
- **Notification System** - Alerts for rank changes
- **Analytics** - Performance analytics and insights

The LeaderboardViewer provides a comprehensive solution for displaying leaderboard data to players and spectators with a focus on usability, performance, and real-time updates.


