import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

initializeApp({ projectId: 'demo-cqg' });
const db = getFirestore();

function getArgFlag(name: string, def?: string): string | undefined {
  const arg = process.argv.find(a => a.startsWith(`--${name}=`));
  if (!arg) return def;
  const [, v] = arg.split('=');
  return v ?? def;
}

async function getLatestTournamentId(): Promise<string | null> {
  const snap = await db.collection('tournaments').orderBy('createdAt', 'desc').limit(1).get();
  if (snap.empty) return null;
  return snap.docs[0].id;
}

async function getCurrentRound(tournamentId: string): Promise<number> {
  const snap = await db.collection('tournaments').doc(tournamentId).collection('matches').get();
  if (snap.empty) return 1;
  const rounds = snap.docs.map(d => (d.data() as any).round || 1);
  return Math.max(...rounds);
}

function randScore(): number {
  return 5 + Math.floor(Math.random() * 11); // 5-15
}

async function simulateRound(tournamentId: string, round: number) {
  const matchesSnap = await db.collection('tournaments').doc(tournamentId)
    .collection('matches').where('round', '==', round).get();
  if (matchesSnap.empty) {
    console.log(`⚠️ No matches found for round ${round}`);
    return { completed: 0 };
  }
  let completed = 0;
  for (const doc of matchesSnap.docs) {
    const m = doc.data() as any;
    if (m.status === 'completed') continue;
    if (!m.playerA || !m.playerB) continue;
    // Randomly pick winner
    const winner = Math.random() < 0.5 ? m.playerA : m.playerB;
    let scoreA = randScore();
    let scoreB = randScore();
    // Ensure higher score matches winner
    if (winner === m.playerA && scoreA <= scoreB) scoreA = scoreB + 1;
    if (winner === m.playerB && scoreB <= scoreA) scoreB = scoreA + 1;

    await doc.ref.update({
      scoreA,
      scoreB,
      winner,
      status: 'completed',
      submittedAt: Timestamp.now(),
      reportedBy: 'simulator'
    });
    completed++;
    console.log(`🏆 Match ${doc.id} (Round ${round}): ${winner} wins (${m.playerA}:${scoreA} – ${m.playerB}:${scoreB})`);
  }
  if (completed > 0) console.log(`✅ Round ${round} complete, advancing…`);
  return { completed };
}

async function main() {
  let tournamentId = getArgFlag('tournament') || null;
  const auto = (getArgFlag('auto') || 'false') === 'true';
  let roundArg = getArgFlag('round');
  const reportMode = (getArgFlag('report') || '').toLowerCase(); // '', 'json', 'txt'
  const saveToFirestore = (getArgFlag('save') || 'false') === 'true';

  if (!tournamentId) {
    tournamentId = await getLatestTournamentId();
  }
  if (!tournamentId) {
    console.error('❌ No tournament found. Provide --tournament=<id> or seed one first.');
    process.exit(1);
  }

  let round = roundArg ? parseInt(roundArg, 10) : await getCurrentRound(tournamentId);

  if (!auto) {
    await simulateRound(tournamentId, round);
    console.log('Done.');
    return;
  }

  // Auto mode: loop rounds until no new matches are generated
  for (;;) {
    const { completed } = await simulateRound(tournamentId, round);
    // wait for auto-progression trigger
    await new Promise(r => setTimeout(r, 2500));
    // Check if next round exists
    const nextSnap = await db.collection('tournaments').doc(tournamentId)
      .collection('matches').where('round', '==', round + 1).get();
    if (nextSnap.empty) {
      if (completed === 0) {
        console.log('🔥 Final Champion likely decided or no further rounds.');
        break;
      } else {
        // progression may be async; check once more
        await new Promise(r => setTimeout(r, 1500));
        const recheck = await db.collection('tournaments').doc(tournamentId)
          .collection('matches').where('round', '==', round + 1).get();
        if (recheck.empty) {
          console.log('🔥 Final Champion likely decided.');
          break;
        } else {
          round = round + 1;
          continue;
        }
      }
    } else {
      round = round + 1;
    }
  }

  // === Build tournament report ===
  const allMatchesSnap = await db.collection('tournaments').doc(tournamentId)
    .collection('matches').get();
  const matches = allMatchesSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
    .sort((a, b) => (a.round || 1) - (b.round || 1));
  const rounds = Array.from(new Set(matches.map(m => m.round || 1))).sort((a, b) => a - b);
  const grouped: Record<number, any[]> = {};
  for (const m of matches) {
    const r = m.round || 1;
    grouped[r] = grouped[r] || [];
    grouped[r].push(m);
  }
  const finalRound = rounds[rounds.length - 1];
  const finalMatch = (grouped[finalRound] || []).find(m => m.winner);
  const champion = finalMatch?.winner || null;

  const timestamp = new Date();
  const isoDate = timestamp.toISOString().slice(0, 10);

  const jsonReport = {
    tournamentId,
    date: timestamp.toISOString(),
    rounds: rounds.map(r => ({
      round: r,
      matches: (grouped[r] || []).map((m, idx) => ({
        id: m.id,
        index: idx + 1,
        playerA: m.playerA,
        playerB: m.playerB,
        winner: m.winner,
        scoreA: m.scoreA,
        scoreB: m.scoreB,
        status: m.status,
      }))
    })),
    champion,
  };

  const lines: string[] = [];
  lines.push('===============================');
  lines.push('🏆 Tournament Report');
  lines.push(`Tournament: ${tournamentId}`);
  lines.push(`Date: ${isoDate}`);
  lines.push('-------------------------------');
  for (const r of rounds) {
    lines.push(`Round ${r}:`);
    (grouped[r] || []).forEach((m, idx) => {
      const winnerName = m.winner || 'TBD';
      const a = m.playerA; const b = m.playerB;
      const sa = m.scoreA ?? 0; const sb = m.scoreB ?? 0;
      const verb = m.winner ? 'def.' : 'vs';
      lines.push(`  Match ${idx + 1}: ${a} ${verb} ${b} (${sa}–${sb})`);
    });
  }
  lines.push(`Champion: ${champion || 'TBD'}`);
  lines.push('===============================');

  // Print to console
  console.log(lines.join('\n'));

  // Export options
  const reportsDir = path.join(process.cwd(), 'reports');
  if (reportMode === 'json') {
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
    const out = path.join(reportsDir, `${tournamentId}-${isoDate}.json`);
    fs.writeFileSync(out, JSON.stringify(jsonReport, null, 2));
    console.log(`📄 JSON report saved: ${out}`);
  } else if (reportMode === 'txt') {
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
    const out = path.join(reportsDir, `${tournamentId}-${isoDate}.txt`);
    fs.writeFileSync(out, lines.join('\n'));
    console.log(`📄 Text report saved: ${out}`);
  }

  // Optional: save to Firestore
  if (saveToFirestore) {
    await db.collection('tournaments').doc(tournamentId).update({ report: jsonReport });
    console.log('💾 Report stored in Firestore under tournaments/{id}/report');
  }
}

main().catch((e) => {
  console.error('❌ Simulation failed', e);
  process.exit(1);
});


