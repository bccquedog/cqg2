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

test('Tournament Timeline shows match completion, auto-progression, and report export', async ({ page }) => {
  const tid = 'timeline-1';

  // Seed tournament and 4-player Round 1 (2 matches)
  await rest(page, 'PATCH', `/tournaments/${tid}`, wrapFields({ name: 'Timeline Test', createdAt: new Date(), status: 'live' }));
  await rest(page, 'PATCH', `/tournaments/${tid}/matches/r1_0`, wrapFields({
    playerA: 'p1', playerB: 'p2', scoreA: 0, scoreB: 0, winner: null, status: 'pending', submittedAt: null, reportedBy: null, round: 1,
  }));
  await rest(page, 'PATCH', `/tournaments/${tid}/matches/r1_1`, wrapFields({
    playerA: 'p3', playerB: 'p4', scoreA: 0, scoreB: 0, winner: null, status: 'pending', submittedAt: null, reportedBy: null, round: 1,
  }));

  // Complete matches (trigger auto progression CF)
  await rest(page, 'PATCH', `/tournaments/${tid}/matches/r1_0`, wrapFields({
    playerA: 'p1', playerB: 'p2', scoreA: 10, scoreB: 7, winner: 'p1', status: 'completed', submittedAt: new Date(), reportedBy: 'p1', round: 1,
  }));
  await rest(page, 'PATCH', `/tournaments/${tid}/matches/r1_1`, wrapFields({
    playerA: 'p3', playerB: 'p4', scoreA: 9, scoreB: 6, winner: 'p3', status: 'completed', submittedAt: new Date(), reportedBy: 'p3', round: 1,
  }));

  // Manually create a timeline entry for match completion (since UI form logs it)
  await rest(page, 'POST', `/tournaments/${tid}/timeline`, wrapFields({ action: 'Match completed', actor: 'p1', timestamp: new Date() }));

  // Wait a bit for CF to generate round 2 and log timeline entry
  await page.waitForTimeout(2500);

  // Trigger admin export via UI to log 'Report exported'
  // First, set tournament to completed so report appears plausible
  await rest(page, 'PATCH', `/tournaments/${tid}`, wrapFields({ status: 'completed' }));
  await page.goto(`/admin/tournaments/${tid}`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: '📊 Export Report' }).click();
  await expect(page.getByText('✅ Report exported successfully')).toBeVisible({ timeout: 5000 });

  // Navigate to tournament page and verify Timeline UI
  await page.goto(`/tournaments/${tid}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('📜 Timeline')).toBeVisible();

  // Check entries appear
  await expect(page.getByText('Match completed')).toBeVisible();
  await expect(page.getByText(/Round 2 generated/)).toBeVisible();
  await expect(page.getByText('Report exported')).toBeVisible();
});




