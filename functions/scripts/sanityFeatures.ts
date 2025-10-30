import * as admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();

async function sanityCheckFeatures() {
  try {
    console.log("🔍 Starting Feature Toggles Sanity Check...\n");

    // Check main feature toggles document
    const doc = await db.collection("adminControls").doc("featureToggles").get();
    if (!doc.exists) {
      console.log("❌ No featureToggles document found");
      return;
    }

    const toggles = doc.data() || {};
    console.log("✅ Current Feature Toggles:\n");

    for (const [key, value] of Object.entries(toggles)) {
      const toggle = value as any;
      let toggleInfo = `🔹 ${key}: enabled=${toggle.enabled}, scope=${toggle.scope?.join(",")}, retentionDays=${toggle.retentionDays}, updatedAt=${toggle.updatedAt}, lastUpdatedBy=${toggle.lastUpdatedBy}`;
      
      // Add special fields for buyIns
      if (key === 'buyIns' && toggle.amount !== undefined && toggle.currency !== undefined) {
        toggleInfo += `, amount=${toggle.amount}, currency=${toggle.currency}`;
      }
      
      console.log(toggleInfo);
    }

    // Check history log counts per toggle
    console.log("\n📜 History Log Counts per Toggle:");
    const historyRef = db.collection("adminControls").doc("featureToggles").collection("history");

    for (const [key, value] of Object.entries(toggles)) {
      const toggle = value as any;
      const historySnapshot = await historyRef.where("feature", "==", key).get();
      console.log(
        `   ↳ ${key}: ${historySnapshot.size} logs (retentionDays=${toggle.retentionDays})`
      );
    }

    console.log("\n📊 Feature Toggle Summary:");
    const enabledCount = Object.values(toggles).filter((toggle: any) => toggle.enabled).length;
    const totalCount = Object.keys(toggles).length;
    console.log(`   • Total toggles: ${totalCount}`);
    console.log(`   • Enabled: ${enabledCount}`);
    console.log(`   • Disabled: ${totalCount - enabledCount}`);

    // Check history subcollection
    console.log("\n📜 Checking History Logs...");
    const historySnapshot = await db
      .collection("adminControls")
      .doc("featureToggles")
      .collection("history")
      .orderBy("updatedAt", "desc")
      .limit(5)
      .get();

    if (historySnapshot.empty) {
      console.log("   • No history logs found");
    } else {
      console.log(`   • Found ${historySnapshot.size} recent history entries:`);
      historySnapshot.forEach((doc) => {
        const log = doc.data();
        console.log(
          `     - ${log.feature}: ${log.oldValue} → ${log.newValue} (${log.updatedBy}) ${log.updatedAt?.toDate?.()?.toLocaleString() || log.updatedAt}`
        );
      });
    }

    // Validate retention policies
    console.log("\n⏰ Retention Policy Validation:");
    for (const [key, value] of Object.entries(toggles)) {
      const toggle = value as any;
      const retentionDays = toggle.retentionDays;
      if (typeof retentionDays !== 'number' || retentionDays < 1) {
        console.log(`   ❌ ${key}: Invalid retentionDays (${retentionDays})`);
      } else {
        console.log(`   ✅ ${key}: ${retentionDays} days`);
      }
    }

    // Check scope validation
    console.log("\n🎯 Scope Validation:");
    for (const [key, value] of Object.entries(toggles)) {
      const toggle = value as any;
      const scope = toggle.scope;
      if (!Array.isArray(scope) || scope.length === 0) {
        console.log(`   ❌ ${key}: Invalid scope (${JSON.stringify(scope)})`);
      } else {
        console.log(`   ✅ ${key}: [${scope.join(", ")}]`);
      }
    }

    console.log("\n✅ Sanity check completed successfully!");

  } catch (err) {
    console.error("❌ Sanity check failed:", err);
  }
}

sanityCheckFeatures();
