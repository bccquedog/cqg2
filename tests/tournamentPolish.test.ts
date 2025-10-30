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

async function seed8PlayerRound1(page: any, tid: string, startTime: Date) {
  await rest(page, 'PATCH', `/tournaments/${tid}`, wrapFields({ name: 'Polish Suite', status: 'upcoming', createdAt: new Date(), startTime, endTime: null }));
  const players = ['p1','p2','p3','p4','p5','p6','p7','p8'];
  for (let i = 0; i < 4; i++) {
    await rest(page, 'PATCH', `/tournaments/${tid}/matches/r1_${i}`, wrapFields({
      playerA: players[i*2],
      playerB: players[i*2+1],
      scoreA: 0, scoreB: 0, winner: null, status: 'pending', submittedAt: null, reportedBy: null, round: 1
    }));
  }
}

test.describe('Tournament Polish Tests', () => {
  test('[Feature A] Export Report works', async ({ page }) => {
    const tid = 'polish-a';
    await seed8PlayerRound1(page, tid, new Date(Date.now() + 60_000));
    // complete all r1
    for (let i = 0; i < 4; i++) {
      const a = i*2+1; const b = i*2+2;
      await rest(page, 'PATCH', `/tournaments/${tid}/matches/r1_${i}`, wrapFields({
        playerA: `p${a}`, playerB: `p${b}`, scoreA: 10, scoreB: 6, winner: `p${a}`, status: 'completed', submittedAt: new Date(), reportedBy: `p${a}`, round: 1
      }));
    }
    // wait for CF to generate r2 and then set tournament completed after finals by sim
    await page.waitForTimeout(2500);
    // quick final: seed r2, r3
    await rest(page, 'PATCH', `/tournaments/${tid}/matches/r2_0`, wrapFields({ playerA: 'p1', playerB: 'p3', scoreA: 11, scoreB: 9, winner: 'p1', status: 'completed', submittedAt: new Date(), reportedBy: 'sim', round: 2 }));
    await rest(page, 'PATCH', `/tournaments/${tid}/matches/r2_1`, wrapFields({ playerA: 'p5', playerB: 'p7', scoreA: 12, scoreB: 8, winner: 'p5', status: 'completed', submittedAt: new Date(), reportedBy: 'sim', round: 2 }));
    await page.waitForTimeout(1500);
    await rest(page, 'PATCH', `/tournaments/${tid}/matches/r3_0`, wrapFields({ playerA: 'p1', playerB: 'p5', scoreA: 13, scoreB: 11, winner: 'p1', status: 'completed', submittedAt: new Date(), reportedBy: 'sim', round: 3 }));
    await rest(page, 'PATCH', `/tournaments/${tid}`, wrapFields({ status: 'completed' }));

    await page.goto(`/admin/tournaments/${tid}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: '📊 Export Report' }).click();
    await expect(page.getByText('✅ Report exported successfully')).toBeVisible({ timeout: 5000 });

    const tourRes = await rest(page, 'GET', `/tournaments/${tid}`);
    const tourJson = await tourRes.json();
    expect(tourJson.fields?.report).toBeTruthy();
  });

  test('[Feature B] Timeline updates', async ({ page }) => {
    const tid = 'polish-b';
    await seed8PlayerRound1(page, tid, new Date(Date.now() + 60_000));
    // Complete a match
    await rest(page, 'PATCH', `/tournaments/${tid}/matches/r1_0`, wrapFields({ playerA: 'p1', playerB: 'p2', scoreA: 10, scoreB: 7, winner: 'p1', status: 'completed', submittedAt: new Date(), reportedBy: 'p1', round: 1 }));
    // UI timeline logs come from client form; emulate with direct timeline write for test determinism
    await rest(page, 'POST', `/tournaments/${tid}/timeline`, wrapFields({ action: 'Match completed', actor: 'p1', timestamp: new Date() }));
    // Complete remaining to trigger round 2
    for (let i = 1; i < 4; i++) {
      await rest(page, 'PATCH', `/tournaments/${tid}/matches/r1_${i}`, wrapFields({ playerA: `p${i*2+1}`, playerB: `p${i*2+2}`, scoreA: 9, scoreB: 6, winner: `p${i*2+1}`, status: 'completed', submittedAt: new Date(), reportedBy: `p${i*2+1}`, round: 1 }));
    }
    await page.waitForTimeout(2500);
    // Export report to create log
    await page.goto(`/admin/tournaments/${tid}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: '📊 Export Report' }).click();
    await expect(page.getByText('✅ Report exported successfully')).toBeVisible({ timeout: 5000 });

    await page.goto(`/tournaments/${tid}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('📜 Timeline')).toBeVisible();
    await expect(page.getByText('Match completed')).toBeVisible();
    await expect(page.getByText(/Round 2 generated/)).toBeVisible();
    await expect(page.getByText('Report exported')).toBeVisible();
  });

  test('[Feature C] Countdown + Live Status', async ({ page }) => {
    const tid = 'polish-c';
    const future = new Date(Date.now() + 30_000);
    await seed8PlayerRound1(page, tid, future);
    await page.goto(`/tournaments/${tid}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Starts in/)).toBeVisible();
    // Set start to now and status live
    await rest(page, 'PATCH', `/tournaments/${tid}`, wrapFields({ startTime: new Date(), status: 'live' }));
    await page.waitForTimeout(500);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByText('🔴 Live Now')).toBeVisible();
    // Complete all matches and set completed
    for (let i = 0; i < 4; i++) {
      await rest(page, 'PATCH', `/tournaments/${tid}/matches/r1_${i}`, wrapFields({ playerA: `p${i*2+1}`, playerB: `p${i*2+2}`, scoreA: 10, scoreB: 7, winner: `p${i*2+1}`, status: 'completed', submittedAt: new Date(), reportedBy: `p${i*2+1}`, round: 1 }));
    }
    await rest(page, 'PATCH', `/tournaments/${tid}`, wrapFields({ status: 'completed' }));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByText('✅ Completed')).toBeVisible();
  });

  test('[Feature D] Highlights Hook', async ({ page }) => {
    const tid = 'polish-d';
    await seed8PlayerRound1(page, tid, new Date());
    // Seed one completed with highlights
    await rest(page, 'PATCH', `/tournaments/${tid}/matches/r1_0`, wrapFields({
      playerA: 'p1', playerB: 'p2', scoreA: 12, scoreB: 9, winner: 'p1', status: 'completed', submittedAt: new Date(), reportedBy: 'p1', round: 1,
      highlights: { arrayValue: { values: [ { mapValue: { fields: { clipUrl: { stringValue: 'https://example.com/clip1' }, uploader: { stringValue: 'p1' }, timestamp: { timestampValue: new Date().toISOString() } } } } ] } }
    }));
    await page.goto(`/tournaments/${tid}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Highlights')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Clip 1' })).toBeVisible();
  });

  test('[Feature E] Force Advance Button', async ({ page }) => {
    const tid = 'polish-e';
    await seed8PlayerRound1(page, tid, new Date());
    // Leave matches pending; force advance
    await page.goto(`/admin/tournaments/${tid}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: '⚡ Force Advance' }).click();
    await expect(page.getByText('⚡ Forced round advancement triggered')).toBeVisible();
    // Wait for CF to generate
    await page.waitForTimeout(2500);
    // Verify r2 exists
    const r2 = await rest(page, 'GET', `/tournaments/${tid}/matches`);
    const json = await r2.json();
    const docs = json.documents || [];
    const hasRound2 = docs.some((d: any) => (d.fields?.round?.integerValue === '2'));
    expect(hasRound2).toBeTruthy();
    // Verify flag reset
    const tour = await rest(page, 'GET', `/tournaments/${tid}`);
    const tjson = await tour.json();
    expect(tjson.fields?.forceAdvance).toBeFalsy();
  });
});




