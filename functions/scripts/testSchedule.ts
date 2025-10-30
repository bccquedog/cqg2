import * as admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();

async function testSchedule() {
  console.log("⏰ Testing Tournament Schedule Data...\n");

  try {
    // Test the new schedule document
    const scheduleDoc = await db
      .collection("tournaments")
      .doc("soloCupS1")
      .collection("schedule")
      .doc("main")
      .get();

    if (scheduleDoc.exists) {
      const data = scheduleDoc.data();
      console.log("✅ Schedule document found!");
      console.log("📋 Schedule Data:");
      console.log(`   Start Time: ${data?.startTime}`);
      console.log(`   Check-in Opens: ${data?.checkInOpens}`);
      console.log(`   Check-in Closes: ${data?.checkInCloses}`);
      console.log(`   Round Durations:`, data?.roundDurations);
      console.log(`   Reminders:`, data?.reminders);
    } else {
      console.log("❌ Schedule document not found!");
    }

    // Test existing schedule documents
    console.log("\n📅 Testing Existing Schedule Documents...");
    
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
        console.log(`\n🏆 Tournament: ${tournamentDoc.id}`);
        console.log(`   Name: ${scheduleData?.name}`);
        console.log(`   Start Date: ${scheduleData?.startDate}`);
        console.log(`   End Date: ${scheduleData?.endDate}`);
        console.log(`   Total Events: ${scheduleData?.totalEvents}`);
        console.log(`   Completed Events: ${scheduleData?.completedEvents}`);
        console.log(`   Status: ${scheduleData?.status}`);
        
        if (scheduleData?.days) {
          console.log(`   Days: ${scheduleData.days.length}`);
          scheduleData.days.forEach((day: any, index: number) => {
            console.log(`     Day ${index + 1}: ${day.date} (${day.events?.length || 0} events)`);
          });
        }
        
        if (scheduleData?.weeks) {
          console.log(`   Weeks: ${scheduleData.weeks.length}`);
          scheduleData.weeks.forEach((week: any, index: number) => {
            console.log(`     Week ${week.weekNumber}: ${week.events?.length || 0} events`);
          });
        }
      } else {
        console.log(`\n⚠️ No schedule found for tournament: ${tournamentDoc.id}`);
      }
    }

    // Test league schedules
    console.log("\n🏅 Testing League Schedule Documents...");
    
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
        console.log(`\n🏅 League: ${leagueDoc.id}`);
        console.log(`   Name: ${scheduleData?.name}`);
        console.log(`   Start Date: ${scheduleData?.startDate}`);
        console.log(`   End Date: ${scheduleData?.endDate}`);
        console.log(`   Current Week: ${scheduleData?.currentWeek}`);
        console.log(`   Total Events: ${scheduleData?.totalEvents}`);
        console.log(`   Completed Events: ${scheduleData?.completedEvents}`);
        console.log(`   Status: ${scheduleData?.status}`);
        
        if (scheduleData?.weeks) {
          console.log(`   Weeks: ${scheduleData.weeks.length}`);
          scheduleData.weeks.forEach((week: any, index: number) => {
            console.log(`     Week ${week.weekNumber}: ${week.events?.length || 0} events`);
          });
        }
      } else {
        console.log(`\n⚠️ No schedule found for league: ${leagueDoc.id}`);
      }
    }

    console.log("\n✅ Schedule testing complete!");
    
  } catch (error) {
    console.error("❌ Error testing schedule:", error);
  }
}

testSchedule();


