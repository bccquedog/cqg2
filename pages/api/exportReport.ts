import type { NextApiRequest, NextApiResponse } from 'next';
import * as admin from 'firebase-admin';

// Initialize Admin SDK once
if (!admin.apps.length) {
  try {
    admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'demo-cqg' });
  } catch {}
}

const db = admin.firestore();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { tournamentId } = req.body || {};
  if (!tournamentId) return res.status(400).json({ error: 'Missing tournamentId' });

  try {
    // Fetch all matches
    const snap = await db.collection('tournaments').doc(tournamentId).collection('matches').get();
    const matches = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    // Group by round
    const rounds = Array.from(new Set(matches.map(m => m.round || 1))).sort((a, b) => a - b);
    const grouped: Record<number, any[]> = {};
    for (const r of rounds) grouped[r] = matches.filter(m => (m.round || 1) === r);
    const finalRound = rounds[rounds.length - 1] || 1;
    const finalMatch = (grouped[finalRound] || []).find(m => m.winner);
    const champion = finalMatch?.winner || null;

    const now = new Date();
    const report = {
      tournamentId,
      date: now.toISOString(),
      rounds: rounds.map(r => ({
        round: r,
        matches: (grouped[r] || []).map((m, idx) => ({
          id: m.id,
          index: idx + 1,
          playerA: m.playerA,
          playerB: m.playerB,
          winner: m.winner,
          scoreA: m.scoreA ?? 0,
          scoreB: m.scoreB ?? 0,
          status: m.status,
        }))
      })),
      champion,
    };

    await db.collection('tournaments').doc(tournamentId).set({ report }, { merge: true });
    // Timeline log
    await db.collection('tournaments').doc(tournamentId).collection('timeline').add({
      action: 'Report exported',
      actor: 'admin',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    return res.status(200).json({ success: true, report });
  } catch (e: any) {
    console.error('exportReport failed', e);
    return res.status(500).json({ error: e?.message || 'Failed to export report' });
  }
}


