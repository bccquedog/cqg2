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

test('Admin Export Report generates Firestore report', async ({ page }) => {
  const tid = 'admin-report-1';
  // Seed tournament and completed matches (4 players → 3 matches)
  await rest(page, 'PATCH', `/tournaments/${tid}`, wrapFields({ name: 'Admin Report Test', createdAt: new Date(), status: 'completed' }));
  // Round 1
  await rest(page, 'PATCH', `/tournaments/${tid}/matches/r1_0`, wrapFields({
    playerA: 'player1', playerB: 'player2', scoreA: 10, scoreB: 6, winner: 'player1', status: 'completed', submittedAt: new Date(), reportedBy: 'seed', round: 1,
  }));
  await rest(page, 'PATCH', `/tournaments/${tid}/matches/r1_1`, wrapFields({
    playerA: 'player3', playerB: 'player4', scoreA: 14, scoreB: 12, winner: 'player3', status: 'completed', submittedAt: new Date(), reportedBy: 'seed', round: 1,
  }));
  // Round 2 (final)
  await rest(page, 'PATCH', `/tournaments/${tid}/matches/r2_0`, wrapFields({
    playerA: 'player1', playerB: 'player3', scoreA: 11, scoreB: 9, winner: 'player1', status: 'completed', submittedAt: new Date(), reportedBy: 'seed', round: 2,
  }));

  // Navigate to admin page
  await page.goto(`/admin/tournaments/${tid}`, { waitUntil: 'domcontentloaded' });
  // Click Export Report
  await page.getByRole('button', { name: '📊 Export Report' }).click();
  // Verify toast/message
  await expect(page.getByText('✅ Report exported successfully')).toBeVisible({ timeout: 5000 });

  // Verify Firestore report exists
  const tourRes = await rest(page, 'GET', `/tournaments/${tid}`);
  expect(tourRes.status()).toBe(200);
  const tourJson = await tourRes.json();
  const fields = tourJson.fields || {};
  expect(fields.report).toBeTruthy();
  const report = JSON.parse(Buffer.from(fields.report.mapValue ? JSON.stringify(fields.report) : '{}').toString());
  // If mapValue present, reconstruct minimally
  const mv = fields.report?.mapValue?.fields;
  const champion = mv?.champion?.stringValue;
  expect(champion).toBe('player1');
});




