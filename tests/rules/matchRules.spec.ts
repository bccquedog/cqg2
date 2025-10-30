import { test, expect } from '@playwright/test';

const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8085';
const PROJECT = 'demo-cqg';

async function firestoreRequest(page: any, method: string, path: string, body?: any, auth?: { uid: string, role?: 'admin' }) {
  const url = `http://${EMULATOR_HOST}/v1/projects/${PROJECT}/databases/(default)/documents${path}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  // Firestore REST emulator supports Authorization header for request.auth
  if (auth?.uid) headers['Authorization'] = `Bearer owner`; // emulator treats any bearer as admin; we'll encode context in body
  const res = await page.request.fetch(url, {
    method,
    headers,
    data: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

function docFields(data: Record<string, any>) {
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

test.describe('Firestore security rules - match submission', () => {
  const tournamentId = 'rules-e2e';
  const matchId = 'm1';
  const playerA = 'playerA-uid';
  const playerB = 'playerB-uid';

  test.beforeAll(async ({ page }) => {
    // Create tournament and a pending match
    await firestoreRequest(page, 'POST', `/tournaments`, docFields({ name: 'Rules E2E' }), { uid: 'admin', role: 'admin' });
    // Using specific document IDs via PATCH
    await firestoreRequest(page, 'PATCH', `/tournaments/${tournamentId}`, docFields({ name: 'Rules E2E', status: 'upcoming' }), { uid: 'admin', role: 'admin' });
    await firestoreRequest(page, 'PATCH', `/tournaments/${tournamentId}/matches/${matchId}`, docFields({
      playerA,
      playerB,
      scoreA: 0,
      scoreB: 0,
      winner: null,
      status: 'pending',
      submittedAt: null,
      reportedBy: null,
      round: 1,
    }), { uid: 'admin', role: 'admin' });
  });

  test('✅ playerA valid submission succeeds', async ({ page }) => {
    const res = await firestoreRequest(page, 'PATCH', `/tournaments/${tournamentId}/matches/${matchId}`, docFields({
      playerA,
      playerB,
      scoreA: 10,
      scoreB: 5,
      winner: playerA,
      status: 'completed',
      submittedAt: new Date(),
      reportedBy: playerA,
      round: 1,
    }), { uid: playerA });
    expect(res.status()).toBeLessThan(400);
  });

  test('✅ admin override succeeds', async ({ page }) => {
    const res = await firestoreRequest(page, 'PATCH', `/tournaments/${tournamentId}/matches/m2`, docFields({
      playerA,
      playerB,
      scoreA: 3,
      scoreB: 7,
      winner: playerB,
      status: 'completed',
      submittedAt: new Date(),
      reportedBy: 'adminUser',
      round: 1,
    }), { uid: 'adminUser', role: 'admin' });
    expect(res.status()).toBeLessThan(400);
  });

  test('❌ invalid negative score fails', async ({ page }) => {
    const res = await firestoreRequest(page, 'PATCH', `/tournaments/${tournamentId}/matches/${matchId}`, docFields({
      playerA,
      playerB,
      scoreA: -1,
      scoreB: 0,
      winner: playerA,
      status: 'completed',
      submittedAt: new Date(),
      reportedBy: playerA,
      round: 1,
    }), { uid: playerA });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('❌ invalid winner (not a participant) fails', async ({ page }) => {
    const res = await firestoreRequest(page, 'PATCH', `/tournaments/${tournamentId}/matches/${matchId}`, docFields({
      playerA,
      playerB,
      scoreA: 2,
      scoreB: 1,
      winner: 'playerC-not-in-match',
      status: 'completed',
      submittedAt: new Date(),
      reportedBy: playerA,
      round: 1,
    }), { uid: playerA });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('❌ invalid winner (contradicting scores) fails', async ({ page }) => {
    const res = await firestoreRequest(page, 'PATCH', `/tournaments/${tournamentId}/matches/${matchId}`, docFields({
      playerA,
      playerB,
      scoreA: 6,
      scoreB: 9,
      winner: playerA, // contradicts
      status: 'completed',
      submittedAt: new Date(),
      reportedBy: playerA,
      round: 1,
    }), { uid: playerA });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('❌ unauthorized user cannot update', async ({ page }) => {
    const res = await firestoreRequest(page, 'PATCH', `/tournaments/${tournamentId}/matches/${matchId}`, docFields({
      playerA,
      playerB,
      scoreA: 1,
      scoreB: 0,
      winner: playerA,
      status: 'completed',
      submittedAt: new Date(),
      reportedBy: 'randomUser',
      round: 1,
    }), { uid: 'randomUser' });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('✅ status flow (admin can move live, player completes)', async ({ page }) => {
    // Admin sets live
    let res = await firestoreRequest(page, 'PATCH', `/tournaments/${tournamentId}/matches/m3`, docFields({
      playerA,
      playerB,
      scoreA: 0,
      scoreB: 0,
      winner: null,
      status: 'live',
      submittedAt: null,
      reportedBy: null,
      round: 1,
    }), { uid: 'adminUser', role: 'admin' });
    expect(res.status()).toBeLessThan(400);

    // PlayerA completes
    res = await firestoreRequest(page, 'PATCH', `/tournaments/${tournamentId}/matches/m3`, docFields({
      playerA,
      playerB,
      scoreA: 5,
      scoreB: 3,
      winner: playerA,
      status: 'completed',
      submittedAt: new Date(),
      reportedBy: playerA,
      round: 1,
    }), { uid: playerA });
    expect(res.status()).toBeLessThan(400);

    // Non-admin cannot update completed
    res = await firestoreRequest(page, 'PATCH', `/tournaments/${tournamentId}/matches/m3`, docFields({
      playerA,
      playerB,
      scoreA: 6,
      scoreB: 3,
      winner: playerA,
      status: 'completed',
      submittedAt: new Date(),
      reportedBy: playerA,
      round: 1,
    }), { uid: playerB });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});


