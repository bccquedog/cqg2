import * as admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();

export async function sanitySchedules() {
  console.log("📅 Running Schedule Sanity Check...\n");

  let totalTournaments = 0;
  let totalLeagues = 0;
  let tournamentSchedules = 0;
  let leagueSchedules = 0;
  let totalEvents = 0;
  let completedEvents = 0;
  let warnings = 0;

  // Check Tournament Schedules
  console.log("🏆 TOURNAMENT SCHEDULES");
  console.log("=" .repeat(50));

  const tournamentsSnapshot = await db.collection("tournaments").get();
  totalTournaments = tournamentsSnapshot.size;

  for (const tournamentDoc of tournamentsSnapshot.docs) {
    const tournamentData = tournamentDoc.data();
    console.log(`\n🏆 Tournament: ${tournamentData.name} (${tournamentDoc.id})`);

    // Check schedule subcollection
    const scheduleSnapshot = await db.collection("tournaments")
      .doc(tournamentDoc.id)
      .collection("schedule")
      .get();

    if (scheduleSnapshot.empty) {
      console.log("   ⚠️ No schedule found");
      warnings++;
    } else {
      tournamentSchedules++;
      const scheduleDoc = scheduleSnapshot.docs[0];
      const scheduleData = scheduleDoc.data();

      console.log(`   📅 Schedule: ${scheduleData.name}`);
      console.log(`   📈 Status: ${scheduleData.status}`);
      console.log(`   📆 Date Range: ${scheduleData.startDate} to ${scheduleData.endDate}`);
      console.log(`   🌍 Timezone: ${scheduleData.timezone}`);
      console.log(`   📊 Events: ${scheduleData.totalEvents} total, ${scheduleData.completedEvents} completed`);

      // Check days and events
      if (!scheduleData.days || scheduleData.days.length === 0) {
        console.log("   ❌ No days found in schedule");
        warnings++;
      } else {
        console.log(`   📅 Days: ${scheduleData.days.length}`);
        
        let scheduleEvents = 0;
        let scheduleCompleted = 0;

        scheduleData.days.forEach((day: any, dayIndex: number) => {
          console.log(`      Day ${dayIndex + 1} (${day.date}): ${day.events?.length || 0} events`);
          
          if (day.events) {
            day.events.forEach((event: any, eventIndex: number) => {
              scheduleEvents++;
              totalEvents++;

              console.log(`         Event ${eventIndex + 1}: ${event.title}`);
              console.log(`            Type: ${event.type}`);
              console.log(`            Time: ${event.startTime} - ${event.endTime}`);
              console.log(`            Status: ${event.status}`);
              
              if (event.status === "completed") {
                scheduleCompleted++;
                completedEvents++;
              }

              // Validation checks
              if (event.status === "completed" && !event.endTime) {
                console.log(`            ⚠️ Completed event has no end time`);
                warnings++;
              }
              if (event.startTime >= event.endTime) {
                console.log(`            ⚠️ Invalid time range`);
                warnings++;
              }
              if (event.type === "match" && (!event.participants || event.participants.length === 0)) {
                console.log(`            ⚠️ Match event has no participants`);
                warnings++;
              }
            });
          }
        });

        console.log(`   📊 Schedule Stats: ${scheduleCompleted}/${scheduleEvents} events completed`);
      }
    }
  }

  // Check League Schedules
  console.log("\n\n🏅 LEAGUE SCHEDULES");
  console.log("=" .repeat(50));

  const leaguesSnapshot = await db.collection("leagues").get();
  totalLeagues = leaguesSnapshot.size;

  for (const leagueDoc of leaguesSnapshot.docs) {
    const leagueData = leagueDoc.data();
    console.log(`\n🏅 League: ${leagueData.name} (${leagueDoc.id})`);

    // Check schedule subcollection
    const scheduleSnapshot = await db.collection("leagues")
      .doc(leagueDoc.id)
      .collection("schedule")
      .get();

    if (scheduleSnapshot.empty) {
      console.log("   ⚠️ No schedule found");
      warnings++;
    } else {
      leagueSchedules++;
      const scheduleDoc = scheduleSnapshot.docs[0];
      const scheduleData = scheduleDoc.data();

      console.log(`   📅 Schedule: ${scheduleData.name}`);
      console.log(`   📈 Status: ${scheduleData.status}`);
      console.log(`   📆 Date Range: ${scheduleData.startDate} to ${scheduleData.endDate}`);
      console.log(`   🌍 Timezone: ${scheduleData.timezone}`);
      console.log(`   📊 Weeks: ${scheduleData.totalWeeks} total, Week ${scheduleData.currentWeek} current`);

      // Check weeks and events
      if (!scheduleData.weeks || scheduleData.weeks.length === 0) {
        console.log("   ❌ No weeks found in schedule");
        warnings++;
      } else {
        console.log(`   📅 Weeks: ${scheduleData.weeks.length}`);
        
        let scheduleEvents = 0;
        let scheduleCompleted = 0;

        scheduleData.weeks.forEach((week: any, weekIndex: number) => {
          console.log(`      Week ${week.weekNumber} (${week.startDate} to ${week.endDate}): ${week.events?.length || 0} events`);
          
          if (week.events) {
            week.events.forEach((event: any, eventIndex: number) => {
              scheduleEvents++;
              totalEvents++;

              console.log(`         Event ${eventIndex + 1}: ${event.title}`);
              console.log(`            Type: ${event.type}`);
              console.log(`            Time: ${event.startTime} - ${event.endTime}`);
              console.log(`            Status: ${event.status}`);
              
              if (event.status === "completed") {
                scheduleCompleted++;
                completedEvents++;
              }

              // Validation checks
              if (event.status === "completed" && !event.endTime) {
                console.log(`            ⚠️ Completed event has no end time`);
                warnings++;
              }
              if (event.startTime >= event.endTime) {
                console.log(`            ⚠️ Invalid time range`);
                warnings++;
              }
              if (event.type === "match" && (!event.participants || event.participants.length === 0)) {
                console.log(`            ⚠️ Match event has no participants`);
                warnings++;
              }
            });
          }
        });

        console.log(`   📊 Schedule Stats: ${scheduleCompleted}/${scheduleEvents} events completed`);
      }
    }
  }

  // Summary
  console.log("\n\n📌 SCHEDULE SUMMARY");
  console.log("=" .repeat(50));
  console.log(`🏆 Tournaments: ${totalTournaments} total, ${tournamentSchedules} with schedules`);
  console.log(`🏅 Leagues: ${totalLeagues} total, ${leagueSchedules} with schedules`);
  console.log(`📅 Total Events: ${totalEvents} total, ${completedEvents} completed`);
  console.log(`⚠️ Warnings: ${warnings}`);
  
  const completionRate = totalEvents > 0 
    ? ((completedEvents / totalEvents) * 100).toFixed(1)
    : "0";
  console.log(`📊 Overall Completion Rate: ${completionRate}%`);

  if (warnings === 0) {
    console.log("✅ All schedules are valid!");
  } else {
    console.log(`⚠️ ${warnings} issues found that need attention`);
  }

  console.log("\n✅ Schedule sanity check complete");
}

// Run script if executed directly
if (require.main === module) {
  sanitySchedules()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}


