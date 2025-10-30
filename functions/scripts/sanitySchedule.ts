import * as admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();

export async function sanitySchedule() {
  console.log("⏰ Running Schedule Sanity Check...\n");

  let totalSchedules = 0;
  let totalEvents = 0;
  let issues = 0;
  let warnings = 0;
  const now = new Date();

  // Check all schedule documents
  console.log("📅 SCHEDULE DOCUMENTS");
  console.log("=" .repeat(50));

  const schedulesSnapshot = await db.collectionGroup("schedule").get();
  
  if (schedulesSnapshot.empty) {
    console.log("📭 No schedule documents found");
  } else {
    totalSchedules = schedulesSnapshot.size;
    console.log(`📋 Found ${totalSchedules} schedule documents:\n`);

    for (const scheduleDoc of schedulesSnapshot.docs) {
      const data = scheduleDoc.data();
      const schedulePath = scheduleDoc.ref.path;
      const competitionType = schedulePath.includes("/tournaments/") ? "Tournament" : "League";
      const competitionId = schedulePath.split("/")[1];

      console.log(`📅 ${competitionType} Schedule: ${competitionId}`);
      console.log(`   Path: ${schedulePath}`);
      console.log(`   Name: ${data.name || "Unnamed"}`);
      console.log(`   Status: ${data.status || "Unknown"}`);
      console.log(`   Start Date: ${data.startDate || "Not set"}`);
      console.log(`   End Date: ${data.endDate || "Not set"}`);
      console.log(`   Timezone: ${data.timezone || "Not set"}`);
      console.log(`   Total Events: ${data.totalEvents || 0}`);
      console.log(`   Completed Events: ${data.completedEvents || 0}`);

      // Check for main schedule document (new format)
      if (data.startTime) {
        console.log(`   ⏰ Start Time: ${data.startTime}`);
        console.log(`   📝 Check-In Opens: ${data.checkInOpens || "Not set"}`);
        console.log(`   📝 Check-In Closes: ${data.checkInCloses || "Not set"}`);
        console.log(`   ⏱️ Round Durations:`, data.roundDurations || "Not set");
        console.log(`   🔔 Reminders:`, data.reminders || "Not set");
      }

      // Validation checks for main schedule
      if (data.startTime) {
        if (data.checkInOpens && data.checkInCloses) {
          if (new Date(data.checkInOpens) >= new Date(data.checkInCloses)) {
            console.log("   ❌ Check-in open time must be before close time");
            issues++;
          }
        }
        
        if (data.checkInCloses && new Date(data.checkInCloses) >= new Date(data.startTime)) {
          console.log("   ❌ Check-in must close before competition start");
          issues++;
        }
        
        if (new Date(data.startTime) < now) {
          console.log("   ⚠️ Competition start time is in the past");
          warnings++;
        }

        if (data.roundDurations) {
          Object.entries(data.roundDurations).forEach(([round, dur]) => {
            if (typeof dur === 'number' && dur <= 0) {
              console.log(`   ❌ Invalid duration for ${round}: ${dur} minutes`);
              issues++;
            }
          });
        }
      }

      // Check for detailed schedule (events)
      if (data.days) {
        console.log(`   📅 Days: ${data.days.length}`);
        data.days.forEach((day: any, dayIdx: number) => {
          console.log(`     Day ${dayIdx + 1}: ${day.date} (${day.events?.length || 0} events)`);
          totalEvents += day.events?.length || 0;
          
          if (day.events) {
            day.events.forEach((event: any, eventIdx: number) => {
              if (!event.id) {
                console.log(`       ❌ Event ${eventIdx + 1} missing ID`);
                issues++;
              }
              if (!event.title) {
                console.log(`       ❌ Event ${eventIdx + 1} missing title`);
                issues++;
              }
              if (!event.startTime) {
                console.log(`       ❌ Event ${eventIdx + 1} missing start time`);
                issues++;
              }
              if (!event.endTime) {
                console.log(`       ❌ Event ${eventIdx + 1} missing end time`);
                issues++;
              }
              if (new Date(event.startTime) >= new Date(event.endTime)) {
                console.log(`       ❌ Event ${eventIdx + 1} start time must be before end time`);
                issues++;
              }
            });
          }
        });
      }

      if (data.weeks) {
        console.log(`   📅 Weeks: ${data.weeks.length}`);
        if (data.currentWeek) {
          console.log(`   📍 Current Week: ${data.currentWeek}`);
        }
        
        data.weeks.forEach((week: any, weekIdx: number) => {
          console.log(`     Week ${week.weekNumber}: ${week.events?.length || 0} events`);
          totalEvents += week.events?.length || 0;
          
          if (week.events) {
            week.events.forEach((event: any, eventIdx: number) => {
              if (!event.id) {
                console.log(`       ❌ Event ${eventIdx + 1} missing ID`);
                issues++;
              }
              if (!event.title) {
                console.log(`       ❌ Event ${eventIdx + 1} missing title`);
                issues++;
              }
              if (!event.startTime) {
                console.log(`       ❌ Event ${eventIdx + 1} missing start time`);
                issues++;
              }
              if (!event.endTime) {
                console.log(`       ❌ Event ${eventIdx + 1} missing end time`);
                issues++;
              }
              if (new Date(event.startTime) >= new Date(event.endTime)) {
                console.log(`       ❌ Event ${eventIdx + 1} start time must be before end time`);
                issues++;
              }
            });
          }
        });
      }

      // Check for missing required fields
      if (!data.name) {
        console.log("   ⚠️ Warning: Missing schedule name");
        warnings++;
      }
      if (!data.startDate) {
        console.log("   ⚠️ Warning: Missing start date");
        warnings++;
      }
      if (!data.endDate) {
        console.log("   ⚠️ Warning: Missing end date");
        warnings++;
      }
      if (!data.timezone) {
        console.log("   ⚠️ Warning: Missing timezone");
        warnings++;
      }
      if (data.totalEvents === undefined) {
        console.log("   ⚠️ Warning: Missing total events count");
        warnings++;
      }
      if (data.completedEvents === undefined) {
        console.log("   ⚠️ Warning: Missing completed events count");
        warnings++;
      }

      console.log("");
    }
  }

  // Check for orphaned schedule documents
  console.log("🔍 ORPHANED SCHEDULE CHECK");
  console.log("=" .repeat(50));

  let orphanedSchedules = 0;
  
  for (const scheduleDoc of schedulesSnapshot.docs) {
    const schedulePath = scheduleDoc.ref.path;
    const pathParts = schedulePath.split("/");
    
    // Extract competition type and ID from path
    // Path format: tournaments/{id}/schedule/schedule or leagues/{id}/schedule/schedule
    const competitionType = pathParts[0]; // "tournaments" or "leagues"
    const competitionId = pathParts[1];
    
    // Check if parent competition exists
    const competitionDoc = await db.collection(competitionType).doc(competitionId).get();
    
    if (!competitionDoc.exists) {
      console.log(`⚠️ Orphaned schedule: ${schedulePath} (parent ${competitionType}/${competitionId} not found)`);
      orphanedSchedules++;
      warnings++;
    }
  }

  // Check for competitions without schedules
  console.log("\n📋 MISSING SCHEDULE CHECK");
  console.log("=" .repeat(50));

  let competitionsWithoutSchedules = 0;

  // Check tournaments
  const tournamentsSnapshot = await db.collection("tournaments").get();
  for (const tournamentDoc of tournamentsSnapshot.docs) {
    const scheduleDoc = await db
      .collection("tournaments")
      .doc(tournamentDoc.id)
      .collection("schedule")
      .doc("schedule")
      .get();
    
    if (!scheduleDoc.exists) {
      console.log(`⚠️ Tournament ${tournamentDoc.id} has no schedule`);
      competitionsWithoutSchedules++;
      warnings++;
    }
  }

  // Check leagues
  const leaguesSnapshot = await db.collection("leagues").get();
  for (const leagueDoc of leaguesSnapshot.docs) {
    const scheduleDoc = await db
      .collection("leagues")
      .doc(leagueDoc.id)
      .collection("schedule")
      .doc("schedule")
      .get();
    
    if (!scheduleDoc.exists) {
      console.log(`⚠️ League ${leagueDoc.id} has no schedule`);
      competitionsWithoutSchedules++;
      warnings++;
    }
  }

  // Summary
  console.log("\n\n📌 SCHEDULE SANITY SUMMARY");
  console.log("=" .repeat(50));
  console.log(`📊 Total Schedules: ${totalSchedules}`);
  console.log(`📅 Total Events: ${totalEvents}`);
  console.log(`❌ Issues Found: ${issues}`);
  console.log(`⚠️ Warnings: ${warnings}`);
  console.log(`🔍 Orphaned Schedules: ${orphanedSchedules}`);
  console.log(`📋 Competitions Without Schedules: ${competitionsWithoutSchedules}`);

  if (totalSchedules === 0) {
    console.log("\n💡 No schedules found. This is normal for new installations.");
    console.log("💡 Run 'pnpm seed' to create sample schedules for testing.");
  }

  if (issues > 0) {
    console.log(`\n❌ ${issues} critical issues found that need immediate attention.`);
  }

  if (warnings > 0) {
    console.log(`\n⚠️ ${warnings} warnings found that should be reviewed.`);
  }

  if (orphanedSchedules > 0) {
    console.log(`\n🔍 ${orphanedSchedules} orphaned schedules found. Consider cleaning up.`);
  }

  if (competitionsWithoutSchedules > 0) {
    console.log(`\n📋 ${competitionsWithoutSchedules} competitions are missing schedules.`);
  }

  console.log("\n✅ Schedule sanity check complete");
}

// Run script if executed directly
if (require.main === module) {
  sanitySchedule()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
