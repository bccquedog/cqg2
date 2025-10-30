# SpectatorOverlay Component

A comprehensive spectator overlay component for live competition viewing with real-time alerts, player spotlights, live chat, and spectator statistics.

## Overview

The SpectatorOverlay provides an immersive viewing experience for spectators watching live competitions. It includes real-time alerts, player spotlights, live chat integration, and spectator statistics to enhance the viewing experience.

## Features

### 🎯 Live Alerts System
- **Real-time Notifications** - Instant alerts for scores, winners, milestones
- **Priority Levels** - Critical, high, medium, low priority alerts
- **Alert Types** - Score updates, winner announcements, highlights, system messages
- **Auto-refresh** - Configurable refresh intervals for live updates

### 🌟 Player Spotlight
- **Featured Players** - Weekly, live, featured, and rising star spotlights
- **Performance Stats** - Wins, losses, win rate, current streak
- **Achievements** - Recent achievements and milestones
- **Dynamic Content** - Rotating spotlight content

### 📊 Live Statistics
- **Viewer Count** - Real-time spectator count
- **Peak Viewers** - Maximum concurrent viewers
- **Engagement Metrics** - Chat messages, reactions, shares
- **Live Updates** - Real-time statistics updates

### 💬 Live Chat Integration
- **Real-time Messages** - Live chat message stream
- **User & System Messages** - Different message types
- **Timestamp Tracking** - Message timing and history
- **Scrollable History** - View recent chat activity

### 🎮 Interactive Controls
- **Mute/Unmute** - Audio control for alerts
- **Expand/Collapse** - Show more or fewer items
- **Quick Actions** - React, share, follow buttons
- **Auto-refresh Toggle** - Enable/disable automatic updates

## Props

### SpectatorOverlayProps
```typescript
interface SpectatorOverlayProps {
  competitionId: string;        // Competition identifier
  className?: string;           // Additional CSS classes
  showStats?: boolean;         // Show spectator statistics (default: true)
  showChat?: boolean;          // Show live chat (default: true)
  showSpotlight?: boolean;     // Show player spotlight (default: true)
  showAlerts?: boolean;        // Show live alerts (default: true)
  autoRefresh?: boolean;       // Enable auto-refresh (default: true)
  refreshInterval?: number;    // Refresh interval in ms (default: 5000)
}
```

## Usage Examples

### Basic Usage
```tsx
import SpectatorOverlay from "@/components/SpectatorOverlay";

export default function CompetitionPage() {
  return (
    <SpectatorOverlay
      competitionId="soloCupS1"
    />
  );
}
```

### With Custom Configuration
```tsx
<SpectatorOverlay
  competitionId="clanLeagueS1"
  showStats={true}
  showChat={false}
  showSpotlight={true}
  showAlerts={true}
  autoRefresh={true}
  refreshInterval={10000}
  className="max-w-4xl"
/>
```

### Minimal Configuration
```tsx
<SpectatorOverlay
  competitionId="tournament123"
  showStats={false}
  showChat={false}
  showSpotlight={false}
  showAlerts={true}
  autoRefresh={false}
/>
```

## Data Structure

### Firestore Collections

#### Alerts Collection
```
tournaments/{competitionId}/alerts/{alertId}
```
```typescript
{
  message: string;
  type: "score" | "winner" | "milestone" | "highlight" | "system";
  timestamp: Timestamp;
  playerId?: string;
  matchId?: string;
  priority: "low" | "medium" | "high" | "critical";
}
```

#### Spotlight Document
```
tournaments/{competitionId}/spotlights/current
```
```typescript
{
  playerId: string;
  title: string;
  description: string;
  type: "weekly" | "live" | "featured" | "rising";
  stats?: {
    wins: number;
    losses: number;
    winRate: number;
    currentStreak: number;
  };
  achievements?: string[];
  startTime?: Timestamp;
  endTime?: Timestamp;
}
```

#### Spectator Stats
```
tournaments/{competitionId}/spectatorStats/live
```
```typescript
{
  totalViewers: number;
  peakViewers: number;
  chatMessages: number;
  reactions: number;
  shares: number;
}
```

#### Chat Messages
```
tournaments/{competitionId}/chat/{messageId}
```
```typescript
{
  user: string;
  message: string;
  timestamp: Timestamp;
  type: "user" | "system";
}
```

## Visual Design

### Color Coding
- **Critical Alerts** - Red background with red border
- **High Priority** - Orange background with orange border
- **Medium Priority** - Yellow background with yellow border
- **Low Priority** - Blue background with blue border
- **System Messages** - Gray background with gray border

### Spotlight Types
- **Weekly** - Purple theme
- **Live** - Green theme
- **Featured** - Gold theme
- **Rising** - Blue theme

### Gradient Backgrounds
- **Stats Card** - Blue to purple gradient
- **Alerts Card** - Yellow to orange gradient
- **Spotlight Card** - Purple to pink gradient
- **Chat Card** - Green to blue gradient

## State Management

### Component State
```typescript
const [alerts, setAlerts] = useState<Alert[]>([]);
const [spotlight, setSpotlight] = useState<Spotlight | null>(null);
const [stats, setStats] = useState<SpectatorStats | null>(null);
const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
const [isMuted, setIsMuted] = useState(false);
const [isExpanded, setIsExpanded] = useState(false);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

### Real-time Subscriptions
- **Alerts** - Live alerts feed with 10 most recent alerts
- **Spotlight** - Current player spotlight document
- **Stats** - Live spectator statistics
- **Chat** - Recent chat messages (20 most recent)

## Error Handling

### Error States
- **Loading State** - Shows loading spinner while fetching data
- **Error State** - Displays error message with retry button
- **Empty State** - Graceful handling when no data is available
- **Network Errors** - Proper error handling for connection issues

### Error Recovery
- **Retry Button** - Manual refresh option
- **Auto-retry** - Automatic retry on network errors
- **Graceful Degradation** - Component works even if some features fail

## Performance Optimization

### Efficient Queries
- **Limited Results** - Only fetch necessary data (10 alerts, 20 chat messages)
- **Ordered Queries** - Use Firestore ordering for efficient data retrieval
- **Real-time Updates** - Use onSnapshot for live updates without polling

### Memory Management
- **Cleanup Subscriptions** - Proper cleanup of Firestore listeners
- **State Optimization** - Efficient state updates and re-renders
- **Conditional Rendering** - Only render features when enabled

## Accessibility

### Features
- **Keyboard Navigation** - Full keyboard support for all controls
- **Screen Reader Support** - Proper ARIA labels and descriptions
- **High Contrast** - Accessible color schemes
- **Focus Management** - Clear focus indicators

### ARIA Labels
- **Alert Messages** - Descriptive labels for different alert types
- **Control Buttons** - Clear button descriptions
- **Live Updates** - Screen reader announcements for updates
- **Error Messages** - Accessible error notifications

## Responsive Design

### Breakpoints
- **Mobile** - Single column layout with stacked elements
- **Tablet** - Optimized spacing and sizing
- **Desktop** - Full layout with all features

### Mobile Optimizations
- **Touch-friendly** - Large touch targets for controls
- **Readable Text** - Appropriate font sizes for mobile
- **Compact Layout** - Efficient use of screen space
- **Swipe Gestures** - Support for touch interactions

## Customization

### Styling
```tsx
// Custom styling via className prop
<SpectatorOverlay
  competitionId="comp1"
  className="my-custom-class"
/>

// CSS customization
.my-custom-class {
  border: 2px solid #custom-color;
  border-radius: 12px;
}
```

### Configuration
- **Feature Toggles** - Enable/disable specific features
- **Refresh Intervals** - Customize update frequency
- **Display Limits** - Control number of items shown
- **Color Themes** - Customize color schemes

## Integration

### Component Dependencies
- **Shadcn UI** - Card, Button, Badge components
- **Lucide React** - Icon library
- **Tailwind CSS** - Styling framework
- **React** - Core framework

### Firestore Dependencies
- **Real-time Listeners** - onSnapshot for live updates
- **Collection Queries** - Efficient data fetching
- **Document References** - Direct document access
- **Error Handling** - Proper error management

## Testing

### Test Scenarios
- **Data Loading** - Test with various data states
- **Error Handling** - Test error scenarios and recovery
- **Real-time Updates** - Test live data updates
- **Configuration** - Test different prop combinations
- **Responsive Design** - Test on different screen sizes

### Test Data
```typescript
const sampleAlerts = [
  {
    id: "alert1",
    message: "Player1 scored 85 points!",
    type: "score",
    priority: "medium",
    timestamp: new Date()
  },
  {
    id: "alert2",
    message: "Player2 wins the match!",
    type: "winner",
    priority: "high",
    timestamp: new Date()
  }
];

const sampleSpotlight = {
  id: "spotlight1",
  playerId: "player1",
  title: "Rising Star",
  description: "Amazing performance this week",
  type: "rising",
  stats: {
    wins: 15,
    losses: 3,
    winRate: 83,
    currentStreak: 5
  }
};
```

## Troubleshooting

### Common Issues

1. **No Data Loading**
   - Check Firestore security rules
   - Verify collection paths
   - Check network connectivity
   - Verify competition ID

2. **Real-time Updates Not Working**
   - Check Firestore listeners
   - Verify onSnapshot usage
   - Check for subscription cleanup
   - Verify data structure

3. **Performance Issues**
   - Reduce refresh interval
   - Limit number of items
   - Check for memory leaks
   - Optimize queries

### Debug Commands
```bash
# Check Firestore data
firebase firestore:get tournaments/soloCupS1/alerts

# Check component props
console.log(competitionId, showStats, showChat);

# Check real-time updates
console.log('Alerts:', alerts);
console.log('Spotlight:', spotlight);
```

## Future Enhancements

### Planned Features
- **Sound Effects** - Audio alerts for different events
- **Animations** - Smooth transitions and effects
- **Themes** - Multiple color themes
- **Customization** - User preference settings
- **Analytics** - Usage tracking and insights

### Integration Opportunities
- **Streaming Integration** - Twitch/YouTube integration
- **Social Features** - Share and follow functionality
- **Mobile App** - Native mobile app support
- **Webhook Support** - External system integration

## Best Practices

### Performance
- Use efficient Firestore queries
- Implement proper cleanup
- Optimize re-renders
- Use conditional rendering

### User Experience
- Provide clear feedback
- Handle loading states
- Implement error recovery
- Use consistent styling

### Security
- Validate all inputs
- Use proper Firestore rules
- Handle sensitive data carefully
- Implement rate limiting

The SpectatorOverlay provides a comprehensive solution for enhancing the spectator experience with real-time updates, interactive features, and engaging visual design.


