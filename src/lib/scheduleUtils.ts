import { 
  TournamentScheduleOptions, 
  LeagueScheduleOptions,
  ScheduleEvent,
  ScheduleDay,
  LeagueWeek,
  TournamentSchedule,
  LeagueSchedule
} from "@/types/schedule";
import { serverTimestamp, Timestamp } from "firebase/firestore";

// ========================
// TOURNAMENT SCHEDULE GENERATION
// ========================

/**
 * Generates a tournament schedule
 */
export function generateTournamentSchedule(
  tournamentId: string,
  options: TournamentScheduleOptions
): TournamentSchedule {
  const days: ScheduleDay[] = [];
  const startDate = new Date(options.startDate);
  const endDate = new Date(options.endDate);
  const currentDate = new Date(startDate);

  // Generate days
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'lowercase' });
    
    // Skip rest days
    if (options.restDays.includes(dayOfWeek)) {
      days.push({
        date: dateStr,
        events: [],
        isRestDay: true
      });
    } else {
      days.push({
        date: dateStr,
        events: []
      });
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Generate events for each round
  let eventOrder = 1;
  options.rounds.forEach(round => {
    const roundEvents = generateRoundEvents(round, options, eventOrder);
    
    // Distribute events across available days
    distributeEventsAcrossDays(days, roundEvents, options);
    
    eventOrder += roundEvents.length;
  });

  // Calculate statistics
  const allEvents = days.flatMap(day => day.events);
  const totalEvents = allEvents.length;
  const completedEvents = 0; // New schedule starts with no completed events

  return {
    id: `schedule_${tournamentId}`,
    tournamentId,
    name: `Tournament Schedule`,
    startDate: options.startDate,
    endDate: options.endDate,
    timezone: options.timezone,
    days,
    totalEvents,
    completedEvents,
    status: "draft",
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp
  };
}

/**
 * Generates events for a specific round
 */
function generateRoundEvents(
  round: { roundNumber: number; name: string; matchCount: number; estimatedDuration: number },
  options: TournamentScheduleOptions,
  startOrder: number
): ScheduleEvent[] {
  const events: ScheduleEvent[] = [];
  
  // Add round start event
  events.push({
    id: `round_${round.roundNumber}_start`,
    title: `${round.name} - Start`,
    type: "round",
    startTime: "", // Will be set when distributing
    endTime: "", // Will be set when distributing
    status: "scheduled",
    metadata: {
      roundId: `round_${round.roundNumber}`,
      roundNumber: round.roundNumber
    },
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp
  });

  // Add match events
  for (let i = 1; i <= round.matchCount; i++) {
    events.push({
      id: `round_${round.roundNumber}_match_${i}`,
      title: `${round.name} - Match ${i}`,
      type: "match",
      startTime: "", // Will be set when distributing
      endTime: "", // Will be set when distributing
      status: "scheduled",
      metadata: {
        roundId: `round_${round.roundNumber}`,
        matchId: `match_${i}`,
        roundNumber: round.roundNumber,
        matchNumber: i
      },
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    });
  }

  // Add round end event
  events.push({
    id: `round_${round.roundNumber}_end`,
    title: `${round.name} - End`,
    type: "round",
    startTime: "", // Will be set when distributing
    endTime: "", // Will be set when distributing
    status: "scheduled",
    metadata: {
      roundId: `round_${round.roundNumber}`,
      roundNumber: round.roundNumber
    },
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp
  });

  return events;
}

// ========================
// LEAGUE SCHEDULE GENERATION
// ========================

/**
 * Generates a league schedule
 */
export function generateLeagueSchedule(
  leagueId: string,
  options: LeagueScheduleOptions
): LeagueSchedule {
  const weeks: LeagueWeek[] = [];
  const startDate = new Date(options.startDate);
  
  // Generate weeks
  for (let weekNum = 1; weekNum <= options.totalWeeks; weekNum++) {
    const weekStartDate = new Date(startDate);
    weekStartDate.setDate(startDate.getDate() + (weekNum - 1) * 7);
    
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    
    const isByeWeek = options.byeWeeks?.includes(weekNum) || false;
    
    const week: LeagueWeek = {
      weekNumber: weekNum,
      startDate: weekStartDate.toISOString().split('T')[0],
      endDate: weekEndDate.toISOString().split('T')[0],
      events: [],
      isByeWeek
    };

    // Generate events for this week (if not a bye week)
    if (!isByeWeek) {
      const weekEvents = generateWeekEvents(weekNum, options);
      week.events = weekEvents;
    }

    weeks.push(week);
  }

  // Calculate statistics
  const allEvents = weeks.flatMap(week => week.events);
  const totalEvents = allEvents.length;
  const completedEvents = 0; // New schedule starts with no completed events

  return {
    id: `schedule_${leagueId}`,
    leagueId,
    name: `League Schedule`,
    season: new Date().getFullYear().toString(),
    startDate: options.startDate,
    endDate: options.endDate,
    timezone: options.timezone,
    weeks,
    totalWeeks: options.totalWeeks,
    currentWeek: 1,
    status: "draft",
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp
  };
}

/**
 * Generates events for a specific week
 */
function generateWeekEvents(
  weekNumber: number,
  options: LeagueScheduleOptions
): ScheduleEvent[] {
  const events: ScheduleEvent[] = [];
  
  // Add week start event
  events.push({
    id: `week_${weekNumber}_start`,
    title: `Week ${weekNumber} - Start`,
    type: "round",
    startTime: "", // Will be set when scheduling
    endTime: "", // Will be set when scheduling
    status: "scheduled",
    metadata: {
      weekId: `week_${weekNumber}`,
      weekNumber
    },
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp
  });

  // Add match events
  for (let i = 1; i <= options.matchesPerWeek; i++) {
    events.push({
      id: `week_${weekNumber}_match_${i}`,
      title: `Week ${weekNumber} - Match ${i}`,
      type: "match",
      startTime: "", // Will be set when scheduling
      endTime: "", // Will be set when scheduling
      status: "scheduled",
      metadata: {
        weekId: `week_${weekNumber}`,
        fixtureId: `fixture_${i}`,
        weekNumber,
        matchNumber: i
      },
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    });
  }

  // Add week end event
  events.push({
    id: `week_${weekNumber}_end`,
    title: `Week ${weekNumber} - End`,
    type: "round",
    startTime: "", // Will be set when scheduling
    endTime: "", // Will be set when scheduling
    status: "scheduled",
    metadata: {
      weekId: `week_${weekNumber}`,
      weekNumber
    },
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp
  });

  return events;
}

// ========================
// EVENT DISTRIBUTION UTILITIES
// ========================

/**
 * Distributes events across available days
 */
function distributeEventsAcrossDays(
  days: ScheduleDay[],
  events: ScheduleEvent[],
  options: TournamentScheduleOptions
): void {
  const availableDays = days.filter(day => !day.isRestDay);
  let currentDayIndex = 0;
  let eventsInCurrentDay = 0;

  events.forEach(event => {
    // Find next available day
    while (currentDayIndex < availableDays.length && 
           eventsInCurrentDay >= options.maxMatchesPerDay) {
      currentDayIndex++;
      eventsInCurrentDay = 0;
    }

    if (currentDayIndex < availableDays.length) {
      const day = availableDays[currentDayIndex];
      const eventTime = calculateEventTime(day.date, eventsInCurrentDay, options);
      
      event.startTime = eventTime.start;
      event.endTime = eventTime.end;
      
      day.events.push(event);
      eventsInCurrentDay++;
    }
  });
}

/**
 * Calculates event start and end times
 */
function calculateEventTime(
  date: string,
  eventIndex: number,
  options: TournamentScheduleOptions
): { start: string; end: string } {
  const [startHour, startMinute] = options.dailyStartTime.split(':').map(Number);
  const eventStartMinutes = startHour * 60 + startMinute + 
    (eventIndex * (options.matchDuration + options.breakDuration));
  
  const startTime = new Date(date);
  startTime.setHours(Math.floor(eventStartMinutes / 60), eventStartMinutes % 60, 0, 0);
  
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + options.matchDuration);
  
  return {
    start: startTime.toISOString(),
    end: endTime.toISOString()
  };
}


