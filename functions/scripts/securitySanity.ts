import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const REPORT_DIR = path.join(process.cwd(), "security-reports");

type CheckResult = {
  check: string;
  status: "✅ PASS" | "⚠️ WARN" | "❌ FAIL";
  details: string;
};

async function checkFirestoreRules(): Promise<CheckResult> {
  // Check if we're in functions directory or root directory
  const rulesPath = fs.existsSync(path.join(process.cwd(), "firestore.rules"))
    ? path.join(process.cwd(), "firestore.rules")
    : path.join(process.cwd(), "..", "firestore.rules");
    
  if (!fs.existsSync(rulesPath)) {
    return { check: "Firestore Rules", status: "❌ FAIL", details: "firestore.rules not found" };
  }

  const rules = fs.readFileSync(rulesPath, "utf-8");
  if (!rules.includes("allow write: if false")) {
    return { check: "Firestore Rules", status: "⚠️ WARN", details: "Default deny not found" };
  }
  return { check: "Firestore Rules", status: "✅ PASS", details: "Default deny confirmed" };
}

async function checkAuditLogs(): Promise<CheckResult> {
  const snap = await db.collection("auditLogs").limit(1).get();
  if (snap.empty) {
    return { check: "Audit Logs", status: "⚠️ WARN", details: "No audit logs found - system ready for logging" };
  }
  return { check: "Audit Logs", status: "✅ PASS", details: `Audit logs collection exists with ${snap.docs.length} entries` };
}

async function checkClipsRetention(): Promise<CheckResult> {
  const tournamentsSnap = await db.collection("tournaments").limit(3).get();
  if (tournamentsSnap.empty) {
    return { check: "Clips Retention", status: "⚠️ WARN", details: "No tournaments found" };
  }

  let expiredFound = false;
  for (const doc of tournamentsSnap.docs) {
    const clipsSnap = await doc.ref.collection("clips").get();
    clipsSnap.forEach((clipDoc) => {
      const data = clipDoc.data();
      if (data.createdAt) {
        const createdAt = new Date(data.createdAt);
        const ageDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (ageDays > 14) expiredFound = true;
      }
    });
  }

  return expiredFound
    ? { check: "Clips Retention", status: "⚠️ WARN", details: "Some clips older than 14 days" }
    : { check: "Clips Retention", status: "✅ PASS", details: "All clips within retention" };
}

async function checkWrapUpScripts(): Promise<CheckResult> {
  const scriptsDir = path.join(process.cwd(), "functions", "scripts");
  const wrapUpExists =
    fs.existsSync(scriptsDir) &&
    fs.readdirSync(scriptsDir).some((file) => file.includes("tournamentWrapUp"));
  return wrapUpExists
    ? { check: "Wrap-Up Script", status: "✅ PASS", details: "tournamentWrapUp.ts found" }
    : { check: "Wrap-Up Script", status: "⚠️ WARN", details: "tournamentWrapUp.ts missing" };
}

async function runSecuritySanity() {
  console.log("🔐 Running CQG Security Sanity Check...\n");

  const results: CheckResult[] = [];
  results.push(await checkFirestoreRules());
  results.push(await checkAuditLogs());
  results.push(await checkClipsRetention());
  results.push(await checkWrapUpScripts());

  // Print results
  results.forEach((r) => console.log(`${r.status} - ${r.check}: ${r.details}`));

  // Ensure report directory exists
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  // Save JSON + Markdown reports
  const timestamp = Date.now();
  const jsonPath = path.join(REPORT_DIR, `report_${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  const mdPath = path.join(REPORT_DIR, `report_${timestamp}.md`);
  fs.writeFileSync(
    mdPath,
    "# 🔐 CQG Security Sanity Report\n\n" +
      results.map((r) => `- ${r.status} **${r.check}** → ${r.details}`).join("\n")
  );

  console.log(`\n💾 Reports saved to ${REPORT_DIR}`);

  // Exit with 1 if any ❌ FAIL
  if (results.some((r) => r.status === "❌ FAIL")) {
    console.log("\n❌ Security sanity check failed. Blocking deploy.");
    process.exit(1);
  }

  console.log("\n✅ No blocking issues found. Safe to deploy.");
  process.exit(0);
}

if (require.main === module) {
  runSecuritySanity().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
