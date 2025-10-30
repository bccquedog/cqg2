import * as admin from "firebase-admin";
// import { validateTicket } from "./utils/tickets"; // Unused import

// Type definitions
interface TournamentData {
  name: string;
  [key: string]: unknown;
}

interface ScheduleData {
  [key: string]: unknown;
}

interface LeagueData {
  name: string;
  [key: string]: unknown;
}

interface EventData {
  id: string;
  title: string;
  type: string;
  startTime: string;
  remindersSent?: string[];
  [key: string]: unknown;
}

interface DayData {
  events: EventData[];
  [key: string]: unknown;
}

interface ScheduleDataWithDays extends ScheduleData {
  days: DayData[];
}

// Lazy initialization of Firestore
function getDb() {
  return admin.firestore();
}

export async function sendCompetitionReminders() {
  const now = new Date();
  console.log(`🔔 Running competition reminders check at ${now.toISOString()}`);

  let tournamentsChecked = 0;
  let leaguesChecked = 0;
  let remindersSent = 0;

  // Check Tournament Reminders
  console.log("\n🏆 Checking Tournament Reminders...");
  const tournamentsSnapshot = await getDb().collection("tournaments").get();
  tournamentsChecked = tournamentsSnapshot.size;

  for (const tournamentDoc of tournamentsSnapshot.docs) {
    const tournamentData = tournamentDoc.data() as TournamentData;
    console.log(`\n📋 Tournament: ${tournamentData.name} (${tournamentDoc.id})`);

    // Get tournament schedule
    const scheduleSnapshot = await getDb()
      .collection("tournaments")
      .doc(tournamentDoc.id)
      .collection("schedule")
      .doc("schedule")
      .get();

    if (!scheduleSnapshot.exists) {
      console.log("   ⚠️ No schedule found");
      continue;
    }

    const scheduleData = scheduleSnapshot.data() as ScheduleDataWithDays;
    const reminders = await checkTournamentReminders(tournamentDoc.id, tournamentData, scheduleData, now);
    remindersSent += reminders;
  }

  // Check League Reminders
  console.log("\n🏅 Checking League Reminders...");
  const leaguesSnapshot = await getDb().collection("leagues").get();
  leaguesChecked = leaguesSnapshot.size;

  for (const leagueDoc of leaguesSnapshot.docs) {
    const leagueData = leagueDoc.data() as LeagueData;
    console.log(`\n📋 League: ${leagueData.name} (${leagueDoc.id})`);

    // Get league schedule
    const scheduleSnapshot = await getDb()
      .collection("leagues")
      .doc(leagueDoc.id)
      .collection("schedule")
      .doc("schedule")
      .get();

    if (!scheduleSnapshot.exists) {
      console.log("   ⚠️ No schedule found");
      continue;
    }

    const scheduleData = scheduleSnapshot.data();
    const reminders = await checkLeagueReminders(leagueDoc.id, leagueData, scheduleData, now);
    remindersSent += reminders;
  }

  // Check Main Schedule Documents (New Format)
  console.log("\n⏰ Checking Main Schedule Documents...");
  const mainSchedulesSnapshot = await getDb().collectionGroup("schedule").get();
  
  for (const scheduleDoc of mainSchedulesSnapshot.docs) {
    const data = scheduleDoc.data();
    const path = scheduleDoc.ref.path.split("/");
    const compType = path[0]; // tournaments or leagues
    const compId = path[1];

    // Only process main schedule documents (not the detailed schedule documents)
    if (scheduleDoc.id === "main" && data.startTime) {
      console.log(`\n⏰ Checking main schedule for ${compType}/${compId}`);

      const reminders = await checkMainScheduleReminders(compId, compType, data, now);
      remindersSent += reminders;
    }
  }

  console.log(`\n📊 Reminder Summary:`);
  console.log(`   Tournaments Checked: ${tournamentsChecked}`);
  console.log(`   Leagues Checked: ${leaguesChecked}`);
  console.log(`   Reminders Sent: ${remindersSent}`);
  console.log(`✅ Competition reminders check complete`);
}

async function checkTournamentReminders(
  tournamentId: string,
  tournamentData: TournamentData,
  scheduleData: ScheduleDataWithDays,
  now: Date
): Promise<number> {
  let remindersSent = 0;

  if (!scheduleData.days) {
    console.log("   ⚠️ No days in schedule");
    return remindersSent;
  }

  // Check each day's events
  for (const day of scheduleData.days) {
    if (!day.events) continue;

    for (const event of day.events) {
      const eventStart = new Date(event.startTime);
      const timeUntilEvent = eventStart.getTime() - now.getTime();
      const minutesUntilEvent = Math.floor(timeUntilEvent / (1000 * 60));

      // Check-in reminder (30 minutes before)
      if (event.type === "match" && minutesUntilEvent <= 30 && minutesUntilEvent > 0) {
        if (!event.remindersSent?.includes("checkin")) {
          console.log(`   📢 Sending check-in reminder for ${event.title} (${minutesUntilEvent} min)`);
          await sendCheckInReminder(tournamentId, tournamentData, event);
          await markReminderSent(tournamentId, "schedule", event.id, "checkin");
          remindersSent++;
        }
      }

      // Match start reminder (5 minutes before)
      if (event.type === "match" && minutesUntilEvent <= 5 && minutesUntilEvent > 0) {
        if (!event.remindersSent?.includes("start")) {
          console.log(`   📢 Sending match start reminder for ${event.title} (${minutesUntilEvent} min)`);
          await sendMatchStartReminder(tournamentId, tournamentData, event);
          await markReminderSent(tournamentId, "schedule", event.id, "start");
          remindersSent++;
        }
      }

      // Round start reminder (15 minutes before)
      if (event.type === "round" && minutesUntilEvent <= 15 && minutesUntilEvent > 0) {
        if (!event.remindersSent?.includes("round")) {
          console.log(`   📢 Sending round start reminder for ${event.title} (${minutesUntilEvent} min)`);
          await sendRoundStartReminder(tournamentId, tournamentData, event);
          await markReminderSent(tournamentId, "schedule", event.id, "round");
          remindersSent++;
        }
      }
    }
  }

  return remindersSent;
}

async function checkLeagueReminders(
  leagueId: string,
  leagueData: LeagueData,
  scheduleData: ScheduleData,
  now: Date
): Promise<number> {
  let remindersSent = 0;

  if (!scheduleData.weeks) {
    console.log("   ⚠️ No weeks in schedule");
    return remindersSent;
  }

  // Check current week's events
  const currentWeek = scheduleData.weeks.find((week: unknown) => (week as Record<string, unknown>).weekNumber === scheduleData.currentWeek);
  if (!currentWeek || !currentWeek.events) {
    console.log("   ⚠️ No current week or events found");
    return remindersSent;
  }

  for (const event of currentWeek.events) {
    const eventStart = new Date(event.startTime);
    const timeUntilEvent = eventStart.getTime() - now.getTime();
    const minutesUntilEvent = Math.floor(timeUntilEvent / (1000 * 60));

    // Check-in reminder (30 minutes before)
    if (event.type === "match" && minutesUntilEvent <= 30 && minutesUntilEvent > 0) {
      if (!event.remindersSent?.includes("checkin")) {
        console.log(`   📢 Sending check-in reminder for ${event.title} (${minutesUntilEvent} min)`);
        await sendCheckInReminder(leagueId, leagueData, event);
        await markReminderSent(leagueId, "schedule", event.id, "checkin");
        remindersSent++;
      }
    }

    // Match start reminder (5 minutes before)
    if (event.type === "match" && minutesUntilEvent <= 5 && minutesUntilEvent > 0) {
      if (!event.remindersSent?.includes("start")) {
        console.log(`   📢 Sending match start reminder for ${event.title} (${minutesUntilEvent} min)`);
        await sendMatchStartReminder(leagueId, leagueData, event);
        await markReminderSent(leagueId, "schedule", event.id, "start");
        remindersSent++;
      }
    }
  }

  return remindersSent;
}

async function checkMainScheduleReminders(
  competitionId: string,
  competitionType: string,
  scheduleData: ScheduleData,
  now: Date
): Promise<number> {
  let remindersSent = 0;

  if (!scheduleData.startTime) {
    console.log("   ⚠️ No start time in main schedule");
    return remindersSent;
  }

  // Convert times
  const start = new Date(scheduleData.startTime);
  const checkInOpens = new Date(scheduleData.checkInOpens);
  const checkInCloses = new Date(scheduleData.checkInCloses);

  // Pre-check-in reminder
  if (scheduleData.reminders?.preCheckIn && now >= checkInOpens && now < checkInCloses) {
    console.log(`   📢 Reminder: Check-in is OPEN for ${competitionId}`);
    await sendMainScheduleReminder(competitionId, competitionType, "checkin", {
      message: "Check-in is now open!",
      checkInOpens,
      checkInCloses,
      startTime: start
    });
    remindersSent++;
  }

  // Pre-match reminder (5 minutes before start)
  const fiveMinutesBefore = new Date(start.getTime() - 5 * 60 * 1000);
  if (scheduleData.reminders?.preMatch && now >= fiveMinutesBefore && now < start) {
    console.log(`   📢 Reminder: ${competitionId} is starting in 5 minutes`);
    await sendMainScheduleReminder(competitionId, competitionType, "prematch", {
      message: "Competition starting in 5 minutes!",
      startTime: start
    });
    remindersSent++;
  }

  // Match start reminder
  if (scheduleData.reminders?.preMatch && now >= start && now < new Date(start.getTime() + 5 * 60 * 1000)) {
    console.log(`   📢 Reminder: ${competitionId} is starting NOW`);
    await sendMainScheduleReminder(competitionId, competitionType, "start", {
      message: "Competition is starting NOW!",
      startTime: start
    });
    remindersSent++;
  }

  // Late warning (if after start but before round end)
  if (scheduleData.reminders?.lateWarning && now > start && now < new Date(start.getTime() + 30 * 60 * 1000)) {
    console.log(`   ⚠️ Warning: ${competitionId} late players may be disqualified`);
    await sendMainScheduleReminder(competitionId, competitionType, "latewarning", {
      message: "Late players may be disqualified!",
      startTime: start
    });
    remindersSent++;
  }

  return remindersSent;
}

async function sendCheckInReminder(competitionId: string, competitionData: TournamentData | LeagueData, event: EventData) {
  // TODO: Integrate with Discord bot, push notifications, email, etc.
  console.log(`      📧 Check-in reminder: ${event.title}`);
  console.log(`         Participants: ${event.participants?.join(", ") || "TBD"}`);
  console.log(`         Stream: ${event.streamLink || "No stream link"}`);
  
  // Log reminder to Firestore for tracking
  await getDb().collection("reminderLogs").add({
    competitionId,
    competitionType: "tournament",
    eventId: event.id,
    eventTitle: event.title,
    reminderType: "checkin",
    sentAt: new Date().toISOString(),
    participants: event.participants || [],
    streamLink: event.streamLink
  });
}

async function sendMatchStartReminder(competitionId: string, competitionData: TournamentData | LeagueData, event: EventData) {
  // TODO: Integrate with Discord bot, push notifications, email, etc.
  console.log(`      🎮 Match start reminder: ${event.title}`);
  console.log(`         Participants: ${event.participants?.join(", ") || "TBD"}`);
  console.log(`         Stream: ${event.streamLink || "No stream link"}`);
  
  // Log reminder to Firestore for tracking
  await getDb().collection("reminderLogs").add({
    competitionId,
    competitionType: "tournament",
    eventId: event.id,
    eventTitle: event.title,
    reminderType: "start",
    sentAt: new Date().toISOString(),
    participants: event.participants || [],
    streamLink: event.streamLink
  });
}

async function sendRoundStartReminder(competitionId: string, competitionData: TournamentData | LeagueData, event: EventData) {
  // TODO: Integrate with Discord bot, push notifications, email, etc.
  console.log(`      🏆 Round start reminder: ${event.title}`);
  console.log(`         Stream: ${event.streamLink || "No stream link"}`);
  
  // Log reminder to Firestore for tracking
  await getDb().collection("reminderLogs").add({
    competitionId,
    competitionType: "tournament",
    eventId: event.id,
    eventTitle: event.title,
    reminderType: "round",
    sentAt: new Date().toISOString(),
    participants: event.participants || [],
    streamLink: event.streamLink
  });
}

async function sendMainScheduleReminder(
  competitionId: string, 
  competitionType: string, 
  reminderType: string, 
  data: Record<string, unknown>
) {
  // TODO: Integrate with Discord bot, push notifications, email, etc.
  console.log(`      📧 ${reminderType} reminder: ${data.message}`);
  
  // Log reminder to Firestore for tracking
  await getDb().collection("reminderLogs").add({
    competitionId,
    competitionType,
    eventId: "main",
    eventTitle: `${competitionType} ${competitionId}`,
    reminderType,
    sentAt: new Date().toISOString(),
    message: data.message,
    metadata: data
  });
}

async function markReminderSent(competitionId: string, collection: string, eventId: string, reminderType: string) {
  try {
    const scheduleRef = getDb()
      .collection("tournaments")
      .doc(competitionId)
      .collection(collection)
      .doc("schedule");

    const scheduleDoc = await scheduleRef.get();
    if (!scheduleDoc.exists) return;

    const scheduleData = scheduleDoc.data();
    if (!scheduleData) return;

    // Update the specific event to mark reminder as sent
    let updated = false;
    if (scheduleData.days) {
      for (const day of scheduleData.days) {
        if (day.events) {
          for (const event of day.events) {
            if (event.id === eventId) {
              if (!event.remindersSent) {
                event.remindersSent = [];
              }
              if (!event.remindersSent.includes(reminderType)) {
                event.remindersSent.push(reminderType);
                updated = true;
              }
              break;
            }
          }
        }
      }
    }

    if (scheduleData.weeks) {
      for (const week of scheduleData.weeks) {
        if (week.events) {
          for (const event of week.events) {
            if (event.id === eventId) {
              if (!event.remindersSent) {
                event.remindersSent = [];
              }
              if (!event.remindersSent.includes(reminderType)) {
                event.remindersSent.push(reminderType);
                updated = true;
              }
              break;
            }
          }
        }
      }
    }

    if (updated) {
      await scheduleRef.update({
        ...scheduleData,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error(`Error marking reminder sent for ${competitionId}:`, error);
  }
}

// Function is already exported above