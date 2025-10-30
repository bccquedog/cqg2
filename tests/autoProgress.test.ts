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

async function listMatches(page: any, tournamentId: string) {
  const res = await rest(page, 'GET', `/tournaments/${tournamentId}/matches`);
  const json = await res.json();
  const docs = json.documents || [];
  const unwrap = (doc: any) => {
    const f = doc.fields || {};
    const iv = (x: any) => (x?.integerValue !== undefined ? parseInt(x.integerValue, 10) : 0);
    const sv = (x: any) => x?.stringValue ?? null;
    const nv = (x: any) => (x?.doubleValue !== undefined ? x.doubleValue : parseInt(x?.integerValue ?? '0', 10));
    return {
      name: doc.name,
      playerA: sv(f.playerA),
      playerB: sv(f.playerB),
      scoreA: nv(f.scoreA),
      scoreB: nv(f.scoreB),
      winner: sv(f.winner),
      status: sv(f.status),
      round: iv(f.round),
    };
  };
  return docs.map(unwrap);
}

async function seedTournament(page: any, tournamentId: string, players: string[]) {
  // Create tournament
  await rest(page, 'PATCH', `/tournaments/${tournamentId}`, wrapFields({ name: 'AutoProgress E2E', status: 'upcoming' }));
  // Seed Round 1 matches with pending status
  for (let i = 0; i < players.length; i += 2) {
    const a = players[i];
    const b = players[i + 1];
    const matchId = `r1_${i/2}`;
    await rest(page, 'PATCH', `/tournaments/${tournamentId}/matches/${matchId}`, wrapFields({
      playerA: a,
      playerB: b,
      scoreA: 0,
      scoreB: 0,
      winner: null,
      status: 'pending',
      submittedAt: null,
      reportedBy: null,
      round: 1,
    }));
  }
}

test.describe('Auto progression', () => {
  test('✅ Round 1 → Round 2 for 4 players', async ({ page }) => {
    const tid = 'auto4';
    const players = ['p1','p2','p3','p4'];
    await seedTournament(page, tid, players);

    // Navigate to tournament page so client auto-advance logic can run on submit
    await page.goto(`/tournaments/${tid}`, { waitUntil: 'domcontentloaded' });

    // Submit two matches via UI (use first two MatchResultForm instances)
    const forms = page.locator('button:has-text("Submit")');
    const count = await forms.count();
    // Fill first form: p1 > p2
    await page.getByPlaceholder(/Score p1|Score A|Score/).first().fill('10');
    await page.getByPlaceholder(/Score p3|Score B|Score/).first().fill('5');
    await forms.first().click();

    // Second form: p3 > p4
    const allInputs = page.locator('input[type="number"]');
    await allInputs.nth(2).fill('9');
    await allInputs.nth(3).fill('6');
    await forms.nth(1).click();

    // Poll REST until round 2 match appears
    let r2 = [] as any[];
    for (let i = 0; i < 20; i++) {
      const matches = await listMatches(page, tid);
      r2 = matches.filter(m => m.round === 2);
      if (r2.length === 1) break;
      await page.waitForTimeout(250);
    }
    expect(r2.length).toBe(1);
    expect(r2[0].status).toBe('pending');
    // players should be winners of r1
    expect([r2[0].playerA, r2[0].playerB].sort()).toEqual(['p1','p3'].sort());
  });

  test('✅ Larger bracket 8 players auto-progresses through rounds', async ({ page }) => {
    const tid = 'auto8';
    const players = ['a','b','c','d','e','f','g','h'];
    await seedTournament(page, tid, players);
    await page.goto(`/tournaments/${tid}`, { waitUntil: 'domcontentloaded' });

    // Complete 4 r1 matches via REST (simulate UI submits) with winners a,c,e,g
    for (let i = 0; i < 4; i++) {
      const a = players[i*2];
      const b = players[i*2+1];
      await rest(page, 'PATCH', `/tournaments/${tid}/matches/r1_${i}`, wrapFields({
        playerA: a,
        playerB: b,
        scoreA: 5,
        scoreB: 3,
        winner: a,
        status: 'completed',
        submittedAt: new Date(),
        reportedBy: a,
        round: 1,
      }));
    }
    // Wait r2 to appear with 2 matches
    let r2 = [] as any[];
    for (let i = 0; i < 20; i++) {
      const matches = await listMatches(page, tid);
      r2 = matches.filter(m => m.round === 2);
      if (r2.length === 2) break;
      await page.waitForTimeout(250);
    }
    expect(r2.length).toBe(2);

    // Complete r2 matches and expect a single r3 final
    await rest(page, 'PATCH', `/tournaments/${tid}/matches/r2_0`, wrapFields({
      playerA: 'a', playerB: 'c', scoreA: 7, scoreB: 4, winner: 'a', status: 'completed', submittedAt: new Date(), reportedBy: 'a', round: 2,
    }));
    await rest(page, 'PATCH', `/tournaments/${tid}/matches/r2_1`, wrapFields({
      playerA: 'e', playerB: 'g', scoreA: 8, scoreB: 6, winner: 'e', status: 'completed', submittedAt: new Date(), reportedBy: 'e', round: 2,
    }));

    let r3 = [] as any[];
    for (let i = 0; i < 20; i++) {
      const matches = await listMatches(page, tid);
      r3 = matches.filter(m => m.round === 3);
      if (r3.length === 1) break;
      await page.waitForTimeout(250);
    }
    expect(r3.length).toBe(1);
    expect([r3[0].playerA, r3[0].playerB].sort()).toEqual(['a','e'].sort());
  });

  test('❌ No round 2 if round 1 incomplete', async ({ page }) => {
    const tid = 'incomplete4';
    const players = ['x1','x2','x3','x4'];
    await seedTournament(page, tid, players);
    await page.goto(`/tournaments/${tid}`, { waitUntil: 'domcontentloaded' });
    // Complete only one match
    await rest(page, 'PATCH', `/tournaments/${tid}/matches/r1_0`, wrapFields({
      playerA: 'x1', playerB: 'x2', scoreA: 4, scoreB: 1, winner: 'x1', status: 'completed', submittedAt: new Date(), reportedBy: 'x1', round: 1,
    }));
    const matches = await listMatches(page, tid);
    const r2 = matches.filter(m => m.round === 2);
    expect(r2.length).toBe(0);
  });
});




