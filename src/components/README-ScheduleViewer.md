# ScheduleViewer Component

A React component for displaying tournament and league schedules in real-time with comprehensive filtering and status tracking.

## Features

- **Real-time Updates**: Uses Firestore `onSnapshot` for live schedule updates
- **Dual Support**: Handles both tournament (days) and league (weeks) schedules
- **Event Filtering**: Filter by status (all, upcoming, live, completed)
- **Status Indicators**: Visual status badges and icons for events
- **Time Tracking**: Shows time until upcoming events
- **Stream Integration**: Direct links to stream events
- **Responsive Design**: Mobile-friendly layout
- **TypeScript Support**: Fully typed with proper interfaces

## Usage

```tsx
import ScheduleViewer from "@/components/ScheduleViewer";

function CompetitionPage() {
  return (
    <div>
      <ScheduleViewer competitionId="soloCupS1" competitionType="tournament" />
      <ScheduleViewer competitionId="soloLeagueS1" competitionType="league" />
    </div>
  );
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `competitionId` | `string` | The tournament/league ID to display the schedule for |
| `competitionType` | `"tournament" \| "league"` | The type of competition |

## Schedule Data Structure

### Tournament Schedule
```typescript
interface TournamentSchedule {
  id: string;
  tournamentId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  timezone: string;
  days: ScheduleDay[];
  totalEvents: number;
  completedEvents: number;
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
}
```

### League Schedule
```typescript
interface LeagueSchedule {
  id: string;
  leagueId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  timezone: string;
  weeks: ScheduleWeek[];
  currentWeek: number;
  totalEvents: number;
  completedEvents: number;
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
}
```

### Event Structure
```typescript
interface ScheduleEvent {
  id: string;
  title: string;
  type: "match" | "round" | "ceremony" | "break" | "stream";
  startTime: string;
  endTime: string;
  status: "scheduled" | "live" | "completed" | "cancelled";
  streamLink?: string;
  participants?: string[];
  metadata?: Record<string, any>;
}
```

## Firestore Paths

The component reads schedule data from:
- **Tournaments**: `/tournaments/{competitionId}/schedule/schedule`
- **Leagues**: `/leagues/{competitionId}/schedule/schedule`

## States

### Loading State
- Shows a spinner with "Loading schedule..." message
- Appears while fetching initial data

### Error State
- Shows error message if schedule cannot be loaded
- Displays "Schedule Not Available" with error details

### Empty State
- Shows "No Schedule Found" if no schedule exists
- Displays helpful message for users

### Success State
- Displays the full schedule with all events
- Shows real-time updates as events progress

## Visual Elements

### Header Section
- Schedule name with calendar icon
- Competition type and ID
- Date range and timezone
- Event statistics (total, completed, days/weeks)

### Filter Controls
- Filter buttons: All, Upcoming, Live, Completed
- Next event countdown display
- Active filter highlighting

### Event Display
- **Tournament**: Organized by days with events listed chronologically
- **League**: Organized by weeks with current week highlighting
- Event cards with type badges and status indicators
- Time information and countdown timers
- Stream links for applicable events

### Event Types
- **🎮 Match**: Competitive matches with participants
- **👥 Round**: Round start/end events
- **🏆 Ceremony**: Awards and ceremonies
- **⏸️ Break**: Scheduled breaks
- **▶️ Stream**: Streaming events

### Status Indicators
- **🟢 Scheduled**: Blue badge with clock icon
- **🔴 Live**: Red badge with pulsing animation
- **✅ Completed**: Green badge with check icon
- **❌ Cancelled**: Gray badge with X icon

## Filtering

### Available Filters
- **All**: Shows all events regardless of status
- **Upcoming**: Shows only future scheduled events
- **Live**: Shows only currently live events
- **Completed**: Shows only completed events

### Filter Logic
- Events are filtered based on current time and status
- Upcoming events show countdown timers
- Live events are highlighted with animations

## Time Display

### Time Formatting
- Uses browser's locale for time display
- Respects schedule timezone settings
- Shows start and end times for each event

### Countdown Timers
- Shows time until upcoming events
- Updates in real-time
- Formats as days/hours/minutes as appropriate

## Stream Integration

### Stream Links
- Direct links to stream events
- Opens in new tab with proper security
- Only shown for events with stream links
- Uses external link icon for clarity

## Responsive Design

- **Mobile-First**: Optimized for mobile devices
- **Flexible Layout**: Adapts to different screen sizes
- **Touch-Friendly**: Large touch targets for mobile users
- **Horizontal Scrolling**: For long event lists

## Dependencies

- React (useState, useEffect)
- Firebase/Firestore (onSnapshot)
- Lucide React (icons)
- Tailwind CSS (styling)
- Shadcn UI components (Card, Badge, Button)

## Example Pages

- `/schedule/tournament/soloCupS1` - Solo tournament schedule
- `/schedule/league/soloLeagueS1` - Solo league schedule
- `/test-schedule` - Test page with multiple schedule examples

## Testing

To test the component:

1. Run the seeder to create sample schedule data:
   ```bash
   pnpm seed
   ```

2. Test the schedule data:
   ```bash
   pnpm test:schedule
   ```

3. Visit the test page:
   ```
   http://localhost:3000/test-schedule
   ```

4. Or view specific schedules:
   ```
   http://localhost:3000/schedule/tournament/soloCupS1
   http://localhost:3000/schedule/league/soloLeagueS1
   ```

## Real-time Updates

The component automatically updates when:
- Event status changes (scheduled → live → completed)
- New events are added to the schedule
- Event times are modified
- Schedule metadata is updated

## Accessibility

- Proper semantic HTML structure
- ARIA labels for screen readers
- Keyboard navigation support
- High contrast colors for visibility
- Responsive text sizing

## Performance

- Efficient Firestore queries
- Minimal re-renders with proper state management
- Lazy loading of schedule data
- Optimized for large schedules with many events

## Integration with Reminders

The component works seamlessly with the reminders system:
- Shows upcoming events that may trigger reminders
- Displays live events that are currently active
- Tracks completed events for reminder cleanup


