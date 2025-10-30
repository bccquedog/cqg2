import { test, expect } from '@playwright/test';

const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8085';
const PROJECT = 'demo-cqg';

function wrapFields(data: Record<string, any>) {
  const wrap = (v: any): any => {
    if (v === null) return { nullValue: null };
    if (typeof v === 'string') return { stringValue: v };
    if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    if (typeof v === 'boolean') return { booleanValue: v };
    if (v instanceof Date) return { timestampValue: v.toISOString() };
    return { stringValue: String(v) };
  };
  const fields: any = {};
  for (const [k, v] of Object.entries(data)) fields[k] = wrap(v);
  return { fields };
}

async function rest(page: any, method: string, path: string, body?: any) {
  const url = `http://${EMULATOR_HOST}/v1/projects/${PROJECT}/databases/(default)/documents${path}`;
  const res = await page.request.fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    data: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

test.describe('Tournament countdown/live/completed indicators', () => {
  test('shows countdown, then live, then completed', async ({ page }) => {
    const tid = 'status-indicators-1';
    const future = new Date(Date.now() + 60_000);

    // Seed: tournament + 4-player round 1
    await rest(page, 'PATCH', `/tournaments/${tid}`, wrapFields({ name: 'Status Indicators', status: 'upcoming', startTime: future, endTime: null, createdAt: new Date() }));
    for (let i = 0; i < 2; i++) {
      await rest(page, 'PATCH', `/tournaments/${tid}/matches/r1_${i}`, wrapFields({
        playerA: `p${i*2+1}`,
        playerB: `p${i*2+2}`,
        scoreA: 0, scoreB: 0,
        winner: null,
        status: 'pending',
        submittedAt: null,
        reportedBy: null,
        round: 1,
      }));
    }

    // 1) Countdown visible
    await page.goto(`/tournaments/${tid}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Starts in/)).toBeVisible();

    // 2) Set start to now, pending matches => Live Now
    await rest(page, 'PATCH', `/tournaments/${tid}`, wrapFields({ startTime: new Date(), status: 'live' }));
    await page.waitForTimeout(500);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByText('🔴 Live Now')).toBeVisible();

    // 3) Complete all matches => Completed
    for (let i = 0; i < 2; i++) {
      await rest(page, 'PATCH', `/tournaments/${tid}/matches/r1_${i}`, wrapFields({
        playerA: `p${i*2+1}`,
        playerB: `p${i*2+2}`,
        scoreA: 10,
        scoreB: 7,
        winner: `p${i*2+1}`,
        status: 'completed',
        submittedAt: new Date(),
        reportedBy: `p${i*2+1}`,
        round: 1,
      }));
    }
    await rest(page, 'PATCH', `/tournaments/${tid}`, wrapFields({ status: 'completed', endTime: new Date() }));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByText('✅ Completed')).toBeVisible();
  });
});




