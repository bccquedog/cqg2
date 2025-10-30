import { execSync } from 'child_process';

async function globalSetup() {
  const skipSeed = process.env.SKIP_SEED === "true";

  if (skipSeed) {
    console.log("⚡ Skipping Firestore seeding (SKIP_SEED=true)...");
    return;
  }

  console.log("🌱 Seeding Firestore before test suite...");
  try {
    execSync("ts-node scripts/seed.ts", { stdio: "inherit" });
  } catch (err) {
    console.error("❌ Firestore seeding failed:", err);
    process.exit(1);
  }
}

export default globalSetup;


