import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebaseClient";
import { 
  TournamentSchedule, 
  LeagueSchedule, 
  ScheduleEvent, 
  ScheduleDay,
  LeagueWeek,
  ScheduleStats,
  ScheduleValidationResult
} from "@/types/schedule";

// ========================
// TOURNAMENT SCHEDULE FUNCTIONS
// ========================

/**
 * Creates a tournament schedule
 */
export async function createTournamentSchedule(
  tournamentId: string,
  scheduleData: Omit<TournamentSchedule, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const scheduleRef = doc(collection(db, "tournaments", tournamentId, "schedule"));
    const schedule = {
      ...scheduleData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(scheduleRef, schedule);
    return scheduleRef.id;
  } catch (error) {
    console.error("Error creating tournament schedule:", error);
    throw new Error("Failed to create tournament schedule");
  }
}

/**
 * Gets a tournament schedule
 */
export async function getTournamentSchedule(tournamentId: string): Promise<TournamentSchedule | null> {
  try {
    const scheduleRef = doc(db, "tournaments", tournamentId, "schedule", "schedule");
    const scheduleDoc = await getDoc(scheduleRef);
    
    if (!scheduleDoc.exists()) {
      return null;
    }

    return scheduleDoc.data() as TournamentSchedule;
  } catch (error) {
    console.error("Error getting tournament schedule:", error);
    throw new Error("Failed to get tournament schedule");
  }
}

/**
 * Updates a tournament schedule
 */
export async function updateTournamentSchedule(
  tournamentId: string, 
  scheduleData: Partial<TournamentSchedule>
): Promise<void> {
  try {
    const scheduleRef = doc(db, "tournaments", tournamentId, "schedule", "schedule");
    await updateDoc(scheduleRef, {
      ...scheduleData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating tournament schedule:", error);
    throw new Error("Failed to update tournament schedule");
  }
}

/**
 * Adds an event to a tournament schedule
 */
export async function addTournamentScheduleEvent(
  tournamentId: string,
  event: Omit<ScheduleEvent, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const schedule = await getTournamentSchedule(tournamentId);
    if (!schedule) {
      throw new Error("Tournament schedule not found");
    }

    const eventId = `event_${Date.now()}`;
    const newEvent: ScheduleEvent = {
      ...event,
      id: eventId,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    };

    // Find the appropriate day and add the event
    const eventDate = new Date(event.startTime).toISOString().split('T')[0];
    let dayFound = false;

    const updatedDays = schedule.days.map(day => {
      if (day.date === eventDate) {
        dayFound = true;
        return {
          ...day,
          events: [...day.events, newEvent]
        };
      }
      return day;
    });

    // If day doesn't exist, create it
    if (!dayFound) {
      updatedDays.push({
        date: eventDate,
        events: [newEvent]
      });
    }

    await updateTournamentSchedule(tournamentId, { days: updatedDays });
    return eventId;
  } catch (error) {
    console.error("Error adding tournament schedule event:", error);
    throw new Error("Failed to add tournament schedule event");
  }
}

/**
 * Updates a tournament schedule event
 */
export async function updateTournamentScheduleEvent(
  tournamentId: string,
  eventId: string,
  eventData: Partial<ScheduleEvent>
): Promise<void> {
  try {
    const schedule = await getTournamentSchedule(tournamentId);
    if (!schedule) {
      throw new Error("Tournament schedule not found");
    }

    const updatedDays = schedule.days.map(day => ({
      ...day,
      events: day.events.map(event => 
        event.id === eventId 
          ? { ...event, ...eventData, updatedAt: serverTimestamp() as Timestamp }
          : event
      )
    }));

    await updateTournamentSchedule(tournamentId, { days: updatedDays });
  } catch (error) {
    console.error("Error updating tournament schedule event:", error);
    throw new Error("Failed to update tournament schedule event");
  }
}

// ========================
// LEAGUE SCHEDULE FUNCTIONS
// ========================

/**
 * Creates a league schedule
 */
export async function createLeagueSchedule(
  leagueId: string,
  scheduleData: Omit<LeagueSchedule, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const scheduleRef = doc(collection(db, "leagues", leagueId, "schedule"));
    const schedule = {
      ...scheduleData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(scheduleRef, schedule);
    return scheduleRef.id;
  } catch (error) {
    console.error("Error creating league schedule:", error);
    throw new Error("Failed to create league schedule");
  }
}

/**
 * Gets a league schedule
 */
export async function getLeagueSchedule(leagueId: string): Promise<LeagueSchedule | null> {
  try {
    const scheduleRef = doc(db, "leagues", leagueId, "schedule", "schedule");
    const scheduleDoc = await getDoc(scheduleRef);
    
    if (!scheduleDoc.exists()) {
      return null;
    }

    return scheduleDoc.data() as LeagueSchedule;
  } catch (error) {
    console.error("Error getting league schedule:", error);
    throw new Error("Failed to get league schedule");
  }
}

/**
 * Updates a league schedule
 */
export async function updateLeagueSchedule(
  leagueId: string, 
  scheduleData: Partial<LeagueSchedule>
): Promise<void> {
  try {
    const scheduleRef = doc(db, "leagues", leagueId, "schedule", "schedule");
    await updateDoc(scheduleRef, {
      ...scheduleData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating league schedule:", error);
    throw new Error("Failed to update league schedule");
  }
}

/**
 * Adds an event to a league schedule
 */
export async function addLeagueScheduleEvent(
  leagueId: string,
  weekNumber: number,
  event: Omit<ScheduleEvent, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const schedule = await getLeagueSchedule(leagueId);
    if (!schedule) {
      throw new Error("League schedule not found");
    }

    const eventId = `event_${Date.now()}`;
    const newEvent: ScheduleEvent = {
      ...event,
      id: eventId,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    };

    const updatedWeeks = schedule.weeks.map(week => 
      week.weekNumber === weekNumber
        ? { ...week, events: [...week.events, newEvent] }
        : week
    );

    await updateLeagueSchedule(leagueId, { weeks: updatedWeeks });
    return eventId;
  } catch (error) {
    console.error("Error adding league schedule event:", error);
    throw new Error("Failed to add league schedule event");
  }
}

/**
 * Updates a league schedule event
 */
export async function updateLeagueScheduleEvent(
  leagueId: string,
  weekNumber: number,
  eventId: string,
  eventData: Partial<ScheduleEvent>
): Promise<void> {
  try {
    const schedule = await getLeagueSchedule(leagueId);
    if (!schedule) {
      throw new Error("League schedule not found");
    }

    const updatedWeeks = schedule.weeks.map(week => 
      week.weekNumber === weekNumber
        ? {
            ...week,
            events: week.events.map(event => 
              event.id === eventId 
                ? { ...event, ...eventData, updatedAt: serverTimestamp() as Timestamp }
                : event
            )
          }
        : week
    );

    await updateLeagueSchedule(leagueId, { weeks: updatedWeeks });
  } catch (error) {
    console.error("Error updating league schedule event:", error);
    throw new Error("Failed to update league schedule event");
  }
}

// ========================
// SCHEDULE UTILITY FUNCTIONS
// ========================

/**
 * Calculates schedule statistics
 */
export function calculateScheduleStats(events: ScheduleEvent[]): ScheduleStats {
  let completedEvents = 0;
  let pendingEvents = 0;
  let inProgressEvents = 0;
  let cancelledEvents = 0;
  let totalDuration = 0;

  events.forEach(event => {
    switch (event.status) {
      case "completed":
        completedEvents++;
        break;
      case "scheduled":
        pendingEvents++;
        break;
      case "in_progress":
        inProgressEvents++;
        break;
      case "cancelled":
      case "postponed":
        cancelledEvents++;
        break;
    }

    // Calculate duration
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60); // minutes
    totalDuration += duration;
  });

  const totalEvents = events.length;
  const completionPercentage = totalEvents > 0 ? (completedEvents / totalEvents) * 100 : 0;
  const averageEventDuration = totalEvents > 0 ? totalDuration / totalEvents : 0;

  return {
    totalEvents,
    completedEvents,
    pendingEvents,
    inProgressEvents,
    cancelledEvents,
    completionPercentage,
    totalDuration,
    averageEventDuration
  };
}

/**
 * Validates a schedule
 */
export function validateSchedule(events: ScheduleEvent[]): ScheduleValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for overlapping events
  const sortedEvents = events.sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const current = sortedEvents[i];
    const next = sortedEvents[i + 1];
    
    const currentEnd = new Date(current.endTime);
    const nextStart = new Date(next.startTime);
    
    if (currentEnd > nextStart) {
      errors.push(`Event "${current.title}" overlaps with "${next.title}"`);
    }
  }

  // Check for events without end times
  events.forEach(event => {
    if (!event.endTime) {
      errors.push(`Event "${event.title}" has no end time`);
    }
    
    if (event.startTime >= event.endTime) {
      errors.push(`Event "${event.title}" has invalid time range`);
    }
  });

  // Check for events in the past that aren't completed
  const now = new Date();
  events.forEach(event => {
    const eventStart = new Date(event.startTime);
    if (eventStart < now && event.status === "scheduled") {
      warnings.push(`Event "${event.title}" is in the past but still scheduled`);
    }
  });

  const stats = calculateScheduleStats(events);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats
  };
}


