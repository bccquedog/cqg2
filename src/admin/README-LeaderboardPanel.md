# LeaderboardPanel Component

A comprehensive admin panel for managing and viewing leaderboards across different scopes (global, game-specific, and league-specific).

## Overview

The LeaderboardPanel provides administrators with a powerful interface to:
- View leaderboards across different scopes (Global, Game, League)
- Search and filter players
- Monitor player statistics and rankings
- Track performance metrics and achievements

## Features

### 🎯 Scope Management
- **Global Leaderboard** - Overall performance across all games and competitions
- **Game Leaderboard** - Performance within specific games (e.g., NBA2K, Madden)
- **League Leaderboard** - Performance within specific leagues

### 📊 Player Statistics
- **Wins/Losses** - Match performance tracking
- **Win Rate** - Calculated percentage of wins
- **Total Points** - Accumulated points across competitions
- **Titles** - Number of championships won
- **Tier System** - Player ranking tiers (Grandmaster, Master, Diamond, etc.)
- **Badges** - Achievement indicators

### 🔍 Search & Filter
- **Player Search** - Search by player ID
- **Scope Filtering** - Filter by game or league ID
- **Real-time Updates** - Live data from Firestore

### 📈 Visual Features
- **Ranking Display** - Clear rank indicators with medals for top 3
- **Tier Badges** - Color-coded tier indicators
- **Summary Statistics** - Aggregate totals for all players
- **Responsive Design** - Works on all screen sizes

## Usage

### Basic Implementation
```tsx
import LeaderboardPanel from "@/admin/LeaderboardPanel";

export default function AdminPage() {
  return (
    <div>
      <LeaderboardPanel />
    </div>
  );
}
```

### Integration with Admin Panel
```tsx
// In admin page with tabs
case 'leaderboards':
  return <LeaderboardPanel />;
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
  rank?: number;
  tier?: string;
  badge?: string;
}
```

### Firestore Structure
```
leaderboards/
├── global/players/{userId}
├── game-{gameId}/players/{userId}
└── league-{leagueId}/players/{userId}
```

## Components Used

### UI Components
- **Card** - Container for different sections
- **Button** - Interactive elements and scope toggles
- **Input** - Search and filter inputs
- **Badge** - Tier and status indicators

### Icons (Lucide React)
- **Trophy** - Global leaderboard and titles
- **Gamepad2** - Game-specific leaderboards
- **Users** - League-specific leaderboards
- **Search** - Search functionality
- **RefreshCw** - Refresh data
- **TrendingUp** - Leaderboard trends
- **Award** - Rankings and achievements

## Styling

### Theme
- **Dark Theme** - Consistent with CQG platform design
- **Card-based Layout** - Clean, organized sections
- **Color-coded Elements** - Green for wins, red for losses, blue for points
- **Gradient Highlights** - Top 3 players get special highlighting

### Responsive Design
- **Mobile-friendly** - Adapts to different screen sizes
- **Grid Layout** - Flexible column system
- **Touch-friendly** - Large buttons and touch targets

## Real-time Features

### Firestore Integration
- **Live Updates** - Real-time data synchronization
- **Error Handling** - Graceful error handling and user feedback
- **Loading States** - Visual feedback during data loading

### Performance
- **Efficient Queries** - Optimized Firestore queries
- **Caching** - Client-side data caching
- **Debounced Search** - Optimized search performance

## Error Handling

### Connection Issues
- **Offline Support** - Graceful degradation when offline
- **Retry Logic** - Automatic retry for failed requests
- **User Feedback** - Clear error messages

### Data Validation
- **Type Safety** - TypeScript interfaces for data validation
- **Null Checks** - Safe handling of missing data
- **Fallback Values** - Default values for missing fields

## Accessibility

### Features
- **Keyboard Navigation** - Full keyboard support
- **Screen Reader Support** - Proper ARIA labels
- **High Contrast** - Accessible color schemes
- **Focus Management** - Clear focus indicators

## Testing

### Test Page
Access the test page at `/test-leaderboard` to see the component in action.

### Test Data
The component works with seeded leaderboard data from the seeder script.

## Future Enhancements

### Planned Features
- **Export Functionality** - Export leaderboard data
- **Advanced Filtering** - More filter options
- **Player Details** - Click to view detailed player stats
- **Historical Data** - View leaderboard history
- **Bulk Operations** - Mass update capabilities
- **Analytics** - Performance analytics and insights

### Integration Opportunities
- **Player Management** - Direct player management from leaderboard
- **Competition Integration** - Link to specific competitions
- **Notification System** - Alerts for rank changes
- **Social Features** - Player comparisons and sharing

## Dependencies

### Required Packages
- **React** - Core framework
- **Firebase** - Database and real-time updates
- **Lucide React** - Icon library
- **Tailwind CSS** - Styling framework
- **Shadcn UI** - Component library

### Firebase Services
- **Firestore** - Real-time database
- **Authentication** - User authentication (for admin access)

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
Ensure proper read/write permissions for leaderboard collections:
```javascript
// Allow read access to leaderboards
match /leaderboards/{document=**} {
  allow read: if true;
  allow write: if request.auth != null && request.auth.token.admin == true;
}
```

## Troubleshooting

### Common Issues

1. **No Data Displayed**
   - Check Firestore connection
   - Verify leaderboard data exists
   - Check console for errors

2. **Search Not Working**
   - Verify search input is properly connected
   - Check for case sensitivity issues
   - Ensure data is loaded

3. **Real-time Updates Not Working**
   - Check Firestore rules
   - Verify authentication
   - Check network connection

### Debug Commands
```bash
# Check leaderboard data
pnpm sanity:leaderboards

# Test Firestore connection
# Check browser console for errors
```

## Performance Considerations

### Optimization
- **Efficient Queries** - Use specific field queries
- **Pagination** - Implement for large datasets
- **Caching** - Cache frequently accessed data
- **Lazy Loading** - Load data as needed

### Monitoring
- **Query Performance** - Monitor Firestore query performance
- **Memory Usage** - Track component memory usage
- **Network Requests** - Monitor API calls
- **User Experience** - Track loading times

The LeaderboardPanel provides a comprehensive solution for managing and viewing leaderboard data with a focus on usability, performance, and real-time updates.


