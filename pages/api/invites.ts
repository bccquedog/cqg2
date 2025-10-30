import type { NextApiRequest, NextApiResponse } from 'next';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try { admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'demo-cqg' }); } catch {}
}

const db = admin.firestore();

function generateCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random()*alphabet.length)];
  return `CQG-${s}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const method = req.method;
  try {
    if (method === 'POST') {
      // Generate an invite
      const { issuedBy, issuedTo = null, tier = null } = req.body || {};
      const code = generateCode();
      const invite = {
        code,
        issuedBy: issuedBy || 'admin',
        issuedTo,
        status: 'unused',
        tier,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        redeemedAt: null,
      };
      const docRef = await db.collection('invites').add(invite);
      return res.status(200).json({ id: docRef.id, ...invite });
    }
    if (method === 'GET') {
      // List invites (basic)
      const snap = await db.collection('invites').orderBy('createdAt', 'desc').limit(50).get();
      const invites = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      return res.status(200).json({ invites });
    }
    if (method === 'PATCH') {
      // Redeem code
      const { code, userId } = req.body || {};
      if (!code) return res.status(400).json({ error: 'Missing code' });
      const q = await db.collection('invites').where('code', '==', code).limit(1).get();
      if (q.empty) return res.status(404).json({ error: 'Invalid code' });
      const docRef = q.docs[0].ref; const data = q.docs[0].data() as any;
      if (data.status !== 'unused') return res.status(400).json({ error: 'Code already used' });
      await docRef.update({ status: 'redeemed', redeemedAt: admin.firestore.FieldValue.serverTimestamp(), redeemedBy: userId || null });
      return res.status(200).json({ success: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e: any) {
    console.error('Invites API error', e);
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}




