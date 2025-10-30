import * as admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();

export async function sanityReminders() {
  console.log("🔔 Running Reminders Sanity Check...\n");

  let totalReminders = 0;
  let checkInReminders = 0;
  let startReminders = 0;
  let roundReminders = 0;
  let recentReminders = 0;

  // Check Reminder Logs
  console.log("📋 REMINDER LOGS");
  console.log("=" .repeat(50));

  const reminderLogsSnapshot = await db.collection("reminderLogs")
    .orderBy("sentAt", "desc")
    .limit(20)
    .get();

  if (reminderLogsSnapshot.empty) {
    console.log("📭 No reminder logs found");
  } else {
    totalReminders = reminderLogsSnapshot.size;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    console.log(`📊 Found ${totalReminders} recent reminder logs:\n`);

    reminderLogsSnapshot.forEach(doc => {
      const data = doc.data();
      const sentAt = new Date(data.sentAt);
      const isRecent = sentAt > oneDayAgo;

      if (isRecent) recentReminders++;

      console.log(`🔔 Reminder: ${data.eventTitle}`);
      console.log(`   Competition: ${data.competitionId}`);
      console.log(`   Type: ${data.reminderType}`);
      console.log(`   Sent: ${sentAt.toLocaleString()}`);
      console.log(`   Participants: ${data.participants?.join(", ") || "None"}`);
      console.log(`   Stream: ${data.streamLink || "No stream link"}`);
      console.log(`   Recent: ${isRecent ? "✅" : "❌"}`);
      console.log("");

      // Count by type
      switch (data.reminderType) {
        case "checkin":
          checkInReminders++;
          break;
        case "start":
          startReminders++;
          break;
        case "round":
          roundReminders++;
          break;
      }
    });
  }

  // Check for upcoming events that might need reminders
  console.log("\n⏰ UPCOMING EVENTS CHECK");
  console.log("=" .repeat(50));

  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  let upcomingEvents = 0;
  let eventsNeedingReminders = 0;

  // Check tournaments
  const tournamentsSnapshot = await db.collection("tournaments").get();
  for (const tournamentDoc of tournamentsSnapshot.docs) {
    const scheduleSnapshot = await db
      .collection("tournaments")
      .doc(tournamentDoc.id)
      .collection("schedule")
      .doc("schedule")
      .get();

    if (scheduleSnapshot.exists) {
      const scheduleData = scheduleSnapshot.data();
      if (scheduleData?.days) {
        for (const day of scheduleData.days) {
          if (day.events) {
            for (const event of day.events) {
              const eventStart = new Date(event.startTime);
              if (eventStart > now && eventStart <= oneHourFromNow) {
                upcomingEvents++;
                console.log(`⏰ Upcoming: ${event.title} in ${Math.floor((eventStart.getTime() - now.getTime()) / (1000 * 60))} minutes`);
                
                // Check if reminders have been sent
                const remindersSent = event.remindersSent || [];
                const needsCheckIn = event.type === "match" && !remindersSent.includes("checkin");
                const needsStart = event.type === "match" && !remindersSent.includes("start");
                const needsRound = event.type === "round" && !remindersSent.includes("round");
                
                if (needsCheckIn || needsStart || needsRound) {
                  eventsNeedingReminders++;
                  console.log(`   ⚠️ Needs reminders: ${[needsCheckIn && "checkin", needsStart && "start", needsRound && "round"].filter(Boolean).join(", ")}`);
                }
              }
            }
          }
        }
      }
    }
  }

  // Check leagues
  const leaguesSnapshot = await db.collection("leagues").get();
  for (const leagueDoc of leaguesSnapshot.docs) {
    const scheduleSnapshot = await db
      .collection("leagues")
      .doc(leagueDoc.id)
      .collection("schedule")
      .doc("schedule")
      .get();

    if (scheduleSnapshot.exists) {
      const scheduleData = scheduleSnapshot.data();
      if (scheduleData?.weeks) {
        for (const week of scheduleData.weeks) {
          if (week.events) {
            for (const event of week.events) {
              const eventStart = new Date(event.startTime);
              if (eventStart > now && eventStart <= oneHourFromNow) {
                upcomingEvents++;
                console.log(`⏰ Upcoming: ${event.title} in ${Math.floor((eventStart.getTime() - now.getTime()) / (1000 * 60))} minutes`);
                
                // Check if reminders have been sent
                const remindersSent = event.remindersSent || [];
                const needsCheckIn = event.type === "match" && !remindersSent.includes("checkin");
                const needsStart = event.type === "match" && !remindersSent.includes("start");
                
                if (needsCheckIn || needsStart) {
                  eventsNeedingReminders++;
                  console.log(`   ⚠️ Needs reminders: ${[needsCheckIn && "checkin", needsStart && "start"].filter(Boolean).join(", ")}`);
                }
              }
            }
          }
        }
      }
    }
  }

  // Summary
  console.log("\n\n📌 REMINDERS SUMMARY");
  console.log("=" .repeat(50));
  console.log(`📊 Total Reminder Logs: ${totalReminders}`);
  console.log(`📧 Check-in Reminders: ${checkInReminders}`);
  console.log(`🎮 Start Reminders: ${startReminders}`);
  console.log(`🏆 Round Reminders: ${roundReminders}`);
  console.log(`⏰ Recent Reminders (24h): ${recentReminders}`);
  console.log(`📅 Upcoming Events (1h): ${upcomingEvents}`);
  console.log(`⚠️ Events Needing Reminders: ${eventsNeedingReminders}`);

  if (eventsNeedingReminders > 0) {
    console.log(`\n💡 Run 'pnpm test:reminders' to send pending reminders`);
  }

  if (totalReminders === 0) {
    console.log("\n💡 No reminders have been sent yet. This is normal for new installations.");
  }

  console.log("\n✅ Reminders sanity check complete");
}

// Run script if executed directly
if (require.main === module) {
  sanityReminders()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}


