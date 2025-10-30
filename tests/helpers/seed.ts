import { execSync } from 'child_process';

export async function reseedFirestore() {
  try {
    execSync('ts-node scripts/seed.ts', { stdio: 'inherit' });
  } catch (err) {
    console.error('❌ Reseed failed:', err);
    throw err;
  }
}




