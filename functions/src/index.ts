/* eslint-disable @typescript-eslint/no-explicit-any */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Type definitions
interface MatchData {
  status: string;
  winner?: string;
  playerA?: string;
  playerB?: string;
  [key: string]: unknown;
}

interface TournamentData {
  settings?: {
    autoProgress?: boolean;
    simulationMode?: boolean;
  };
  [key: string]: unknown;
}

interface ContextParams {
  tournamentId: string;
  matchId: string;
  [key: string]: string;
}

admin.initializeApp();
const db = admin.firestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' });

export const onMatchCompleted = functions.firestore.onDocumentUpdated(
  'tournaments/{tournamentId}/matches/{matchId}',
  async (change, context) => {
    const before = change.before.data() as MatchData;
    const after = change.after.data() as MatchData;
    const { tournamentId } = context.params as ContextParams;

    // Trigger only when moving to completed
    if ((before.status === 'completed') || (after.status !== 'completed')) {
      return;
    }

    // Get tournament settings
    const tourRef = db.collection('tournaments').doc(tournamentId);
    const tourSnap = await tourRef.get();
    const tournament = tourSnap.exists ? tourSnap.data() as TournamentData : null;

    // Check if auto-progression is enabled
    if (!tournament?.settings?.autoProgress) {
      console.log(`[auto-progress] Auto-progression disabled for tournament ${tournamentId}`);
      return;
    }

    // Determine winner - handle simulation mode
    let winner = after.winner;
    
    // If no winner set and simulation mode enabled, pick random winner
    if (!winner && tournament.settings?.simulationMode) {
      const isPlayerAWinner = Math.random() > 0.5;
      winner = isPlayerAWinner ? after.playerA : after.playerB;
      
      // Update match with random winner
      await db.collection('tournaments').doc(tournamentId)
        .collection('matches').doc(context.params.matchId)
        .update({
          winner,
          winnerId: winner,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      
      console.log(`[auto-progress] Simulation mode: Random winner selected: ${winner}`);
    }

    // Basic validation
    if (typeof after.scoreA !== 'number' || typeof after.scoreB !== 'number') return;
    if (after.scoreA < 0 || after.scoreB < 0) return;
    if (!winner || !(winner === after.playerA || winner === after.playerB)) return;

    const round: number = after.round || 1;

    // Admin override: if tournament.forceAdvance is true, bypass checks
    const forceAdvance = tournament?.forceAdvance || false;

    // Fetch all matches of this round
    const roundSnap = await db.collection('tournaments').doc(tournamentId)
      .collection('matches')
      .where('round', '==', round)
      .get();

    const matches = roundSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    const allCompleted = matches.every(m => m.status === 'completed');
    if (!forceAdvance && !allCompleted) {
      console.log(`[auto-progress] Round ${round} not fully completed; skipping.`);
      return;
    }

    // Determine winners
    const winners: string[] = matches
      .filter(m => m.winner)
      .map(m => m.winner as string);

    // If odd number, cannot pair fully
    if (winners.length < 2 && !forceAdvance) return;

    const nextRound = round + 1;

    // Prevent duplicate generation: check if next round already exists
    const nextSnap = await db.collection('tournaments').doc(tournamentId)
      .collection('matches')
      .where('round', '==', nextRound)
      .get();
    if (!nextSnap.empty) {
      console.log(`[auto-progress] Next round ${nextRound} already exists; skipping.`);
      return;
    }

    // Create next round matches
    const batch = db.batch();
    for (let i = 0; i < winners.length; i += 2) {
      const a = winners[i];
      const b = winners[i + 1] || null;
      if (!a || !b) {
        if (!forceAdvance) continue;
      }
      const ref = db.collection('tournaments').doc(tournamentId)
        .collection('matches').doc(`r${nextRound}_${Math.floor(i/2)}`);
      batch.set(ref, {
        playerA: a,
        playerB: b,
        scoreA: 0,
        scoreB: 0,
        winner: null,
        status: 'pending',
        submittedAt: null,
        reportedBy: null,
        round: nextRound,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
    console.log(`[auto-progress] Generated next round ${nextRound} matches for tournament ${tournamentId}`);

    // Timeline log for progression
    await db.collection('tournaments').doc(tournamentId)
      .collection('timeline').add({
        action: `Round ${nextRound} generated` ,
        actor: 'system',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

    // Reset forceAdvance after use
    if (forceAdvance) {
      await tourRef.update({ forceAdvance: false });
      console.log(`[auto-progress] forceAdvance reset to false for ${tournamentId}`);
    }
  });

// Optional: handle reports from both players and auto-resolve or flag disputes
export const onMatchReports = functions.firestore.onDocumentUpdated(
  'tournaments/{tournamentId}/matches/{matchId}',
  async (change, context) => {
    const before = change.before.data() as any;
    const after = change.after.data() as any;
    const { tournamentId, matchId } = context.params as any;

    // If reports map present and status not completed, try to reconcile
    if (!after?.reports || after.status === 'completed') return;
    const reports = after.reports as Record<string, { scoreA: number; scoreB: number; winner: string }>;
    const reporters = Object.keys(reports || {});
    if (reporters.length < 2) return; // need both players

    const r = Object.values(reports);
    const agree = r.every(x => x.winner === r[0].winner && x.scoreA === r[0].scoreA && x.scoreB === r[0].scoreB);
    const matchRef = db.collection('tournaments').doc(tournamentId).collection('matches').doc(matchId);
    if (agree) {
      // auto-complete
      const winner = r[0].winner;
      await matchRef.update({
        scoreA: r[0].scoreA,
        scoreB: r[0].scoreB,
        winner,
        status: 'completed',
        submittedAt: admin.firestore.FieldValue.serverTimestamp(),
        reportedBy: 'auto'
      });
      console.log(`[reports] Auto-completed match ${matchId}`);
    } else {
      // flag dispute
      await matchRef.update({ status: 'disputed' });
      console.log(`[reports] Dispute flagged for match ${matchId}`);
    }
  });

// Callable function to redeem Golden Ticket invite
export const redeemInvite = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required');
  }

  const code = (data && data.code) as string;
  if (!code || typeof code !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Code required');
  }

  const inviteRef = db.collection('invites').doc(code);
  const inviteSnap = await inviteRef.get();
  if (!inviteSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Invite not found');
  }
  const invite = inviteSnap.data() as any;
  if (invite?.status !== 'unused') {
    throw new functions.https.HttpsError('failed-precondition', 'Invite already used');
  }

  // Update invite to used
  await inviteRef.update({
    status: 'used',
    usedBy: context.auth.uid,
    usedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Optional: tag player profile with Golden Ticket
  try {
    await db.collection('players').doc(context.auth.uid).set({ goldenTicket: true }, { merge: true });
  } catch (e) {
    // Non-fatal
    console.warn('Failed to tag player with goldenTicket', e);
  }

  return { success: true, message: 'Golden Ticket redeemed!' };
});

// Stripe: Create Checkout Session (callable)
export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required');
  }
  const userId = data?.userId || context.auth.uid;
  const tournamentId = data?.tournamentId as string;
  if (!tournamentId) {
    throw new functions.https.HttpsError('invalid-argument', 'tournamentId required');
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new functions.https.HttpsError('failed-precondition', 'Stripe not configured');
  }
  try {
    // Fetch tournament config
    const tourRef = db.collection('tournaments').doc(tournamentId);
    const tourSnap = await tourRef.get();
    if (!tourSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Tournament not found');
    }
    const tour = tourSnap.data() as { entryFee?: number; currency?: string };
    const entryFee = tour.entryFee ?? 0;
    const currency = (tour.currency || 'usd') as 'usd' | 'eur' | 'gbp' | 'cad' | 'aud';
    if (!entryFee || entryFee <= 0) {
      console.log('[stripe] free tournament', { tournamentId, userId, entryFee });
      return { sessionId: null, free: true };
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      currency,
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: entryFee,
            product_data: { name: `Tournament Registration (${tournamentId})` },
          },
          quantity: 1,
        },
      ],
      success_url: `http://localhost:3000/payment-success?tournament=${encodeURIComponent(tournamentId)}`,
      cancel_url: 'http://localhost:3000/payment-cancelled',
      metadata: { tournamentId, userId },
    });
    console.log('[stripe] session created', { id: session.id, tournamentId, userId, entryFee, currency });
    return { sessionId: session.id };
  } catch (e: any) {
    console.error('[stripe] create session failed', e);
    throw new functions.https.HttpsError('internal', 'Failed to create session');
  }
});

// Stripe Webhook (HTTP)
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  let event = req.body;
  try {
    // If you set STRIPE_WEBHOOK_SECRET, verify signature; otherwise trust body in emulator
    const sig = req.headers['stripe-signature'] as string | undefined;
    const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (whSecret && sig) {
      const buf = Buffer.from(JSON.stringify(req.body));
      event = stripe.webhooks.constructEvent(buf, sig, whSecret);
    }
  } catch (err) {
    console.error('[stripe] webhook signature verification failed', err);
    return res.status(400).send('Webhook Error');
  }

  const type = event.type || event?.type;
  try {
    if (type === 'checkout.session.completed') {
      const session = (event.data?.object || event.data.object) as Stripe.Checkout.Session;
      const tournamentId = (session.metadata?.tournamentId) as string;
      const userId = (session.metadata?.userId) as string;
      if (tournamentId && userId) {
        await db.collection('tournaments').doc(tournamentId)
          .collection('registrations').doc(userId).set({
            userId,
            paid: true,
            registeredAt: admin.firestore.FieldValue.serverTimestamp(),
            paymentId: session.id,
            amount: session.amount_total ?? null,
          }, { merge: true });
        console.log('[stripe] registration recorded', { tournamentId, userId, amount: session.amount_total });
      }
    } else if (type === 'checkout.session.expired') {
      console.log('[stripe] session expired');
    }
    res.json({ received: true });
  } catch (e) {
    console.error('[stripe] webhook handler error', e);
    res.status(500).send('Webhook handler error');
  }
});

// Register free tournament (callable)
export const registerFreeRegistration = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required');
  }
  const userId = data?.userId || context.auth.uid;
  const tournamentId = data?.tournamentId as string;
  if (!tournamentId) {
    throw new functions.https.HttpsError('invalid-argument', 'tournamentId required');
  }
  const tourRef = db.collection('tournaments').doc(tournamentId);
  const tourSnap = await tourRef.get();
  if (!tourSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Tournament not found');
  }
  const tour = tourSnap.data() as { entryFee?: number; status?: string; maxPlayers?: number };
  const entryFee = tour.entryFee ?? 0;
  const maxPlayers = tour.maxPlayers ?? 16;
  if (tour.status === 'closed') {
    throw new functions.https.HttpsError('failed-precondition', 'Tournament full');
  }
  if (entryFee > 0) {
    throw new functions.https.HttpsError('failed-precondition', 'Tournament is not free');
  }

  const regsRef = tourRef.collection('registrations');
  const regsSnap = await regsRef.get();
  if (regsSnap.size >= maxPlayers) {
    await tourRef.set({ status: 'closed' }, { merge: true });
    throw new functions.https.HttpsError('failed-precondition', 'Tournament full');
  }

  await regsRef.doc(userId).set({
    userId,
    paid: false,
    registeredAt: admin.firestore.FieldValue.serverTimestamp(),
    amount: 0,
  }, { merge: true });

  return { success: true };
});

// Auto-close tournament when registrations reach capacity
export const onRegistrationCreate = functions.firestore.onDocumentCreated(
  'tournaments/{tournamentId}/registrations/{userId}',
  async (snap, context) => {
    const { tournamentId } = context.params as { tournamentId: string };
    const tourRef = db.collection('tournaments').doc(tournamentId);
    const tourSnap = await tourRef.get();
    if (!tourSnap.exists) return;
    const tour = tourSnap.data() as { maxPlayers?: number; status?: string };
    const maxPlayers = tour.maxPlayers ?? 16;
    const regsSnap = await tourRef.collection('registrations').get();
    if (regsSnap.size >= maxPlayers) {
      // Close tournament
      await tourRef.set({ status: 'closed' }, { merge: true });

      // Seed bracket only if no matches exist yet
      const matchesSnap = await tourRef.collection('matches').limit(1).get();
      if (!matchesSnap.empty) {
        console.log(`[tournament] ${tournamentId} already has matches, skipping bracket seeding.`);
        return;
      }

      // Collect registered userIds in deterministic order, then shuffle
      const userIds: string[] = regsSnap.docs.map((d) => d.id);
      // Simple shuffle
      for (let i = userIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [userIds[i], userIds[j]] = [userIds[j], userIds[i]];
      }

      // Pair into round 1 matches
      const batch = db.batch();
      for (let i = 0; i < userIds.length; i += 2) {
        const playerA = userIds[i];
        const playerB = userIds[i + 1] ?? null;
        const matchRef = tourRef.collection('matches').doc();
        batch.set(matchRef, {
          playerA,
          playerB,
          round: 1,
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
      console.log(`✅ Tournament ${tournamentId} filled and bracket seeded.`);
    }
  });

import cors from 'cors';
import { sendCompetitionReminders } from '../reminders';
const corsHandler = cors({ origin: true });

// 1) helloWorld endpoint (v1 onRequest)
export const helloWorld = functions.https.onRequest((request, response) => {
  corsHandler(request as any, response as any, () => {
    response.json({ message: 'Hello CQG from Firebase Functions!' });
  });
});

// 2) Status endpoint: /status
export const status = functions.https.onRequest((request, response) => {
  corsHandler(request as any, response as any, () => {
    response.json({ ok: true, timestamp: Date.now() });
  });
});

// Helper to extract ":id" from path e.g. "/user123" -> "user123"
function extractIdFromPath(path: string | undefined): string | null {
  if (!path) return null;
  const trimmed = path.replace(/^\/+/, '');
  return trimmed.length ? trimmed : null;
}

// 3) /users/:id
export const users = functions.https.onRequest(async (request, response) => {
  corsHandler(request as any, response as any, async () => {
    try {
      const id = extractIdFromPath(request.path);
      if (!id) {
        response.status(400).json({ error: 'Missing user id' });
        return;
      }

      const snapshot = await db.collection('users').doc(id).get();
      if (!snapshot.exists) {
        response.status(404).json({ error: 'User not found' });
        return;
      }

      response.json({ id, ...snapshot.data() });
    } catch (error) {
      console.error('getUser error:', error);
      response.status(500).json({ error: 'Internal server error' });
    }
  });
});

// 4) /tournaments/:id
export const tournaments = functions.https.onRequest(async (request, response) => {
  corsHandler(request as any, response as any, async () => {
    try {
      const id = extractIdFromPath(request.path);
      if (!id) {
        response.status(400).json({ error: 'Missing tournament id' });
        return;
      }

      const snapshot = await db.collection('tournaments').doc(id).get();
      if (!snapshot.exists) {
        response.status(404).json({ error: 'Tournament not found' });
        return;
      }

      response.json({ id, ...snapshot.data() });
    } catch (error) {
      console.error('getTournament error:', error);
      response.status(500).json({ error: 'Internal server error' });
    }
  });
});

// 5) /matches/:id
export const matches = functions.https.onRequest(async (request, response) => {
  corsHandler(request as any, response as any, async () => {
    try {
      const id = extractIdFromPath(request.path);
      if (!id) {
        response.status(400).json({ error: 'Missing match id' });
        return;
      }

      const snapshot = await db.collection('matches').doc(id).get();
      if (!snapshot.exists) {
        response.status(404).json({ error: 'Match not found' });
        return;
      }

      response.json({ id, ...snapshot.data() });
    } catch (error) {
      console.error('getMatch error:', error);
      response.status(500).json({ error: 'Internal server error' });
    }
  });
});

// 6) Scheduled Reminders - runs every 5 minutes
export const scheduledReminders = functions.pubsub
  .schedule("every 5 minutes")
  .onRun(async (context: any) => {
    console.log("⏰ Running scheduled reminders...", context.timestamp);
    try {
      await sendCompetitionReminders();
      console.log("✅ Scheduled reminders completed successfully");
    } catch (error) {
      console.error("❌ Error in scheduled reminders:", error);
      throw error;
    }
  });

// === Firestore Triggers ===
// Notify players on sign-up/check-in and auto-advance bracket
export const notifyRegistration = functions.firestore.onDocumentUpdated(
  'tournaments/{tournamentId}',
  async (change, context) => {
    const before = change.before.data() as any;
    const after = change.after.data() as any;

    try {
      // New player registered
      const beforeRegistered = (before?.slots?.registered || []).length;
      const afterRegistered = (after?.slots?.registered || []).length;
      if (afterRegistered > beforeRegistered) {
        console.log('📣 New player registered!', context.params.tournamentId);
        // sendNotification can be implemented to fan-out user notifications
      }

      // Player checked in
      const beforeCheckedIn = (before?.slots?.checkedIn || []).length;
      const afterCheckedIn = (after?.slots?.checkedIn || []).length;
      if (afterCheckedIn > beforeCheckedIn) {
        console.log('✅ Player checked in', context.params.tournamentId);
      }
    } catch (err) {
      console.error('notifyRegistration error', err);
    }
  });

export const autoAdvanceBracket = functions.firestore.onDocumentUpdated(
  'tournaments/{tournamentId}',
  async (change, context) => {
    const after = change.after.data() as any;
    const id = context.params.tournamentId as string;

    try {
      const bracket = after?.bracket;
      if (!bracket?.rounds?.length) return;
      const lastRound = bracket.rounds[bracket.rounds.length - 1];
      const allCompleted = (lastRound.matches || []).length > 0 && (lastRound.matches || []).every((m: any) => m.status === 'completed' && m.winner);
      if (!allCompleted) return;

      // Calculate next round
      const winners = (lastRound.matches || []).map((m: any) => m.winner).filter(Boolean);
      if (winners.length < 2) return;
      const nextMatches: any[] = [];
      for (let i = 0; i < winners.length; i += 2) {
        const a = winners[i];
        const b = winners[i + 1];
        if (!a || !b) break;
        nextMatches.push({ matchId: `${id}_R${bracket.rounds.length + 1}_M${i / 2 + 1}`, players: [a, b], status: 'pending' });
      }

      const updated = {
        ...bracket,
        rounds: [
          ...bracket.rounds,
          { roundNumber: bracket.rounds.length + 1, matches: nextMatches },
        ],
      };
      await db.collection('tournaments').doc(id).update({ bracket: updated, updatedAt: new Date().toISOString() });
      console.log('🔁 Bracket advanced', id);
    } catch (err) {
      console.error('autoAdvanceBracket error', err);
    }
  });

// === League triggers ===
// Auto-update standings when league matches complete
export const updateLeagueStandings = functions.firestore.onDocumentUpdated(
  'leagues/{leagueId}',
  async (change, context) => {
    const before = change.before.data() as any;
    const after = change.after.data() as any;
    const id = context.params.leagueId as string;

    try {
      const beforeCompleted = (before?.schedule || []).flatMap((w: any) => w.matches || []).filter((m: any) => m.status === 'completed').length;
      const afterCompleted = (after?.schedule || []).flatMap((w: any) => w.matches || []).filter((m: any) => m.status === 'completed').length;
      if (afterCompleted <= beforeCompleted) return;

      // Recalculate standings
      const standingsMap: Record<string, { playerId: string; wins: number; losses: number; points: number; differential: number; streak: string }>= {};
      const pushResult = (winner: string, loser: string, score?: Record<string, number>) => {
        if (!standingsMap[winner]) standingsMap[winner] = { playerId: winner, wins: 0, losses: 0, points: 0, differential: 0, streak: '' };
        if (!standingsMap[loser]) standingsMap[loser] = { playerId: loser, wins: 0, losses: 0, points: 0, differential: 0, streak: '' };
        standingsMap[winner].wins += 1;
        standingsMap[winner].points += 3; // 3 points per win
        standingsMap[loser].losses += 1;
        if (score) {
          const wScore = score[winner] ?? 0;
          const lScore = score[loser] ?? 0;
          const diff = wScore - lScore;
          standingsMap[winner].differential += diff;
          standingsMap[loser].differential -= diff;
        }
      };

      for (const week of after?.schedule || []) {
        for (const m of week.matches || []) {
          if (m.status === 'completed' && m.result?.winner && m.result?.loser) {
            pushResult(m.result.winner, m.result.loser, m.result.score);
          }
        }
      }

      const newStandings = Object.values(standingsMap).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.differential !== a.differential) return b.differential - a.differential;
        return (b.wins - a.wins);
      });

      await db.collection('leagues').doc(id).update({ standings: newStandings, updatedAt: new Date().toISOString() });
      console.log('📊 League standings updated', id);
    } catch (err) {
      console.error('updateLeagueStandings error', err);
    }
  });

// === Stats and Leaderboards ===
async function updateTwoPlayerStats(winnerId: string, loserId: string, score?: Record<string, number>) {
  const winnerRef = db.collection('players').doc(winnerId);
  const loserRef = db.collection('players').doc(loserId);
  await db.runTransaction(async (tx) => {
    const [wDoc, lDoc] = await Promise.all([tx.get(winnerRef), tx.get(loserRef)]);
    const wStats = (wDoc.data()?.stats || {}) as any;
    const lStats = (lDoc.data()?.stats || {}) as any;
    tx.set(winnerRef, { stats: {
      wins: (wStats.wins || 0) + 1,
      losses: wStats.losses || 0,
      points: (wStats.points || 0) + 3,
      surgeScore: wStats.surgeScore || 0,
      tournamentsPlayed: wStats.tournamentsPlayed || 0,
      leaguesPlayed: wStats.leaguesPlayed || 0,
      currentTier: wDoc.data()?.stats?.currentTier || ''
    }}, { merge: true });
    tx.set(loserRef, { stats: {
      wins: lStats.wins || 0,
      losses: (lStats.losses || 0) + 1,
      points: lStats.points || 0,
      surgeScore: lStats.surgeScore || 0,
      tournamentsPlayed: lStats.tournamentsPlayed || 0,
      leaguesPlayed: lStats.leaguesPlayed || 0,
      currentTier: lDoc.data()?.stats?.currentTier || ''
    }}, { merge: true });
  });

// === Challenge triggers ===
function pickChallengeWinner(submissions: any[]): any | null {
  if (!Array.isArray(submissions) || submissions.length === 0) return null;
  // Choose by highest (votes + surgeScoreBonus)
  let best: any | null = null;
  let bestScore = -Infinity;
  for (const s of submissions) {
    const baseVotes = Number(s?.votes || 0);
    const bonus = Number(s?.surgeScoreBonus || 0);
    const score = baseVotes + bonus;
    if (score > bestScore) {
      best = s;
      bestScore = score;
    }
  }
  return best;
}

export const updateChallengeStats = functions.firestore.onDocumentUpdated(
  'challenges/{challengeId}',
  async (change, context) => {
    const before = change.before.data() as any;
    const after = change.after.data() as any;
    const cid = context.params.challengeId as string;

    try {
      const beforeApproved = new Set<string>((before?.submissions || []).filter((s: any) => s.status === 'approved').map((s: any) => s.playerId + '|' + (s.clipUrl || '')));
      const afterApproved = (after?.submissions || []).filter((s: any) => s.status === 'approved');

      // Increment stats for newly approved submissions
      for (const sub of afterApproved) {
        const key = sub.playerId + '|' + (sub.clipUrl || '');
        if (beforeApproved.has(key)) continue; // already counted
        const incBonus = Number(sub?.surgeScoreBonus || 0);
        const playerRef = db.collection('players').doc(sub.playerId);
        await playerRef.set({
          stats: {
            challengesPlayed: admin.firestore.FieldValue.increment(1),
            surgeScore: admin.firestore.FieldValue.increment(incBonus),
          },
          updatedAt: new Date().toISOString(),
        } as any, { merge: true });
      }

      // When challenge completes, record winner and intended rewards log (non-destructive)
      if (after?.status === 'completed' && before?.status !== 'completed') {
        const winner = pickChallengeWinner(after?.submissions || []);
        if (winner?.playerId && after?.rewards?.winner) {
          await db.collection('challengeWinners').doc(cid).set({
            challengeId: cid,
            playerId: winner.playerId,
            reward: after.rewards.winner,
            decidedAt: new Date().toISOString(),
          }, { merge: true });
          console.log('🏅 Challenge winner recorded', cid, winner.playerId);
        }
      }
    } catch (err) {
      console.error('updateChallengeStats error', err);
    }
  });

// === Event triggers ===
export const notifyEventStatusChange = functions.firestore.onDocumentUpdated(
  'events/{eventId}',
  async (change, context) => {
    const before = change.before.data() as any;
    const after = change.after.data() as any;
    const eventId = context.params.eventId as string;

    try {
      // Notify when event goes live
      if (before?.status !== 'live' && after?.status === 'live') {
        console.log('🎪 Event went live:', eventId, after?.details?.title);
        // TODO: Send notifications to subscribers
      }

      // Notify when event completes
      if (before?.status !== 'completed' && after?.status === 'completed') {
        console.log('🏁 Event completed:', eventId, after?.details?.title);
        // TODO: Send completion notifications
      }

      // Auto-archive old completed events
      if (after?.status === 'completed' && after?.details?.endTime) {
        const endTime = after.details.endTime.toDate();
        const daysSinceEnd = (Date.now() - endTime.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceEnd > 30) { // Archive after 30 days
          await db.collection('events').doc(eventId).update({
            status: 'archived',
            'audit.updatedAt': new Date().toISOString()
          });
          console.log('📦 Auto-archived old event:', eventId);
        }
      }
    } catch (err) {
      console.error('notifyEventStatusChange error', err);
    }
  });

export const updateStreamStatus = functions.firestore.onDocumentUpdated(
  'events/{eventId}',
  async (change, context) => {
    const before = change.before.data() as any;
    const after = change.after.data() as any;
    const eventId = context.params.eventId as string;

    try {
      // Check for stream status changes
      const beforeStreams = before?.streams || [];
      const afterStreams = after?.streams || [];

      for (const afterStream of afterStreams) {
        const beforeStream = beforeStreams.find((s: any) => s.streamId === afterStream.streamId);
        
        if (beforeStream && beforeStream.status !== afterStream.status) {
          console.log(`📺 Stream ${afterStream.streamId} status changed: ${beforeStream.status} → ${afterStream.status}`);
          
          // If featured stream goes live, notify
          if (afterStream.isFeatured && afterStream.status === 'live') {
            console.log('⭐ Featured stream went live:', afterStream.url);
            // TODO: Send featured stream notifications
          }
        }
      }
    } catch (err) {
      console.error('updateStreamStatus error', err);
    }
  });

// === Rate Limited Tournament Query ===
export const rateLimitedTournamentQuery = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
  }

  const uid = context.auth.uid;
  const tierId = context.auth.token.tierId as string || "default"; // custom claim from Stripe integration
  const WINDOW_MS = 60 * 1000; // 1 minute

  // 🔹 Pull tier config dynamically from Firestore
  const tierDoc = await db.collection("tiers").doc(tierId).get();
  const maxRequests = tierDoc.exists ? tierDoc.data()?.maxRequests : 30; // default fallback = 30

  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  const ref = db.collection("rateLimits").doc(uid);
  const snapshot = await ref.get();

  let requests: number[] = [];
  if (snapshot.exists) {
    requests = snapshot.data()?.requests || [];
    requests = requests.filter((ts: number) => ts > cutoff);
  }

  if (requests.length >= maxRequests) {
    throw new functions.https.HttpsError(
      "resource-exhausted",
      `Too many requests for your tier (${tierId}). Limit is ${maxRequests}/minute.`
    );
  }

  requests.push(now);
  await ref.set({ requests }, { merge: true });

  // ✅ Safe query
  const tournamentsRef = db
    .collection("tournaments")
    .orderBy("startDate")
    .limit(data.limit || 10);

  const snapshotTournaments = await tournamentsRef.get();

  return snapshotTournaments.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
});

// === Scheduled Functions ===
export const autoSwitchEventStatus = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    try {
      const now = Date.now();
      const events = await db.collection('events')
        .where('status', 'in', ['draft', 'pregame', 'live'])
        .get();

      console.log(`🕐 Checking ${events.size} active events for status changes...`);

      for (const eventDoc of events.docs) {
        const data = eventDoc.data() as any;
        const eventId = eventDoc.id;
        let shouldUpdate = false;
        let newStatus = data.status;

        // Check if draft should become pregame
        if (data.status === 'draft' && data.details?.startTime) {
          const startTime = data.details.startTime.toDate().getTime();
          if (startTime <= now) {
            newStatus = 'pregame';
            shouldUpdate = true;
            console.log(`📅 Event ${eventId} moved from draft to pregame`);
          }
        }

        // Check if pregame should become live
        if (data.status === 'pregame' && data.details?.startTime) {
          const startTime = data.details.startTime.toDate().getTime();
          if (startTime <= now) {
            newStatus = 'live';
            shouldUpdate = true;
            console.log(`🎪 Event ${eventId} went live`);
          }
        }

        // Check if live should become completed (if endTime is set)
        if (data.status === 'live' && data.details?.endTime) {
          const endTime = data.details.endTime.toDate().getTime();
          if (endTime <= now) {
            newStatus = 'completed';
            shouldUpdate = true;
            console.log(`🏁 Event ${eventId} completed`);
          }
        }

        if (shouldUpdate) {
          await eventDoc.ref.update({
            status: newStatus,
            'audit.updatedAt': new Date().toISOString()
          });
        }
      }

      console.log('✅ Event status check completed');
    } catch (err) {
      console.error('❌ Error in autoSwitchEventStatus:', err);
    }
  });

// === Stream Notifications ===
export const notifyFeaturedStream = functions.firestore.onDocumentUpdated(
  'events/{eventId}',
  async (change, context) => {
    const before = change.before.data() as any;
    const after = change.after.data() as any;
    const eventId = context.params.eventId as string;

    try {
      const beforeStreams = before?.streams || [];
      const afterStreams = after?.streams || [];

      // Find newly live featured streams
      for (const afterStream of afterStreams) {
        if (afterStream.isFeatured && afterStream.status === 'live') {
          const beforeStream = beforeStreams.find((s: any) => s.streamId === afterStream.streamId);
          
          // Only notify if this stream just went live
          if (!beforeStream || beforeStream.status !== 'live') {
            console.log(`⭐ Featured stream went live: ${afterStream.url}`);
            
            // TODO: Implement actual notification system
            // sendNotification(`Featured stream is live!`, after.details.title);
            
            // TODO: Implement Discord integration
            if (after.chatIntegration?.discordChannelId) {
              console.log(`📢 Would post to Discord: 🎥 Featured stream is live: ${afterStream.url}`);
              // postToDiscord(after.chatIntegration.discordChannelId, `🎥 Featured stream is live: ${afterStream.url}`);
            }
          }
        }
      }
    } catch (err) {
      console.error('❌ Error in notifyFeaturedStream:', err);
    }
  });
}

async function updateLeaderboard(scope: 'tournament' | 'league', refId: string) {
  const id = `${scope}_${refId}`;
  await db.collection('leaderboards').doc(id).set({
    scope,
    refId,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

async function updateGlobalLeaderboard() {
  await db.collection('leaderboards').doc('global').set({
    scope: 'global',
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

export const updatePlayerStats = functions.firestore.onDocumentUpdated(
  'tournaments/{tournamentId}',
  async (change, context) => {
    const before = change.before.data() as any;
    const after = change.after.data() as any;
    const tid = context.params.tournamentId as string;
    try {
      const getCompletedIds = (bracket: any) => {
        const ids = new Set<string>();
        for (const r of bracket?.rounds || []) {
          for (const m of r.matches || []) {
            if (m.status === 'completed' && m.winner && m.players?.length === 2) ids.add(m.matchId);
          }
        }
        return ids;
      };
      const beforeCompleted = getCompletedIds(before?.bracket);
      const afterCompleted = getCompletedIds(after?.bracket);
      const newCompleted = [...afterCompleted].filter((id) => !beforeCompleted.has(id));
      if (newCompleted.length === 0) return;

      // Map of matchId -> match for latest state
      const matchMap: Record<string, any> = {};
      for (const r of after?.bracket?.rounds || []) {
        for (const m of r.matches || []) matchMap[m.matchId] = m;
      }
      for (const mid of newCompleted) {
        const m = matchMap[mid];
        if (m?.players?.length === 2 && m.winner) {
          const winner = m.winner as string;
          const loser = m.players.find((p: string) => p !== winner) as string;
          await updateTwoPlayerStats(winner, loser, m.score);
        }
      }

      await updateLeaderboard('tournament', tid);
      await updateGlobalLeaderboard();
      console.log('🧮 Player stats and leaderboards updated for tournament', tid);
    } catch (err) {
      console.error('updatePlayerStats error', err);
    }
  });

export const updateLeagueStats = functions.firestore.onDocumentUpdated(
  'leagues/{leagueId}',
  async (change, context) => {
    const before = change.before.data() as any;
    const after = change.after.data() as any;
    const lid = context.params.leagueId as string;
    try {
      const listCompleted = (schedule: any[]) => new Set<string>(
        (schedule || []).flatMap((w: any) => w.matches || []).filter((m: any) => m.status === 'completed' && m.result?.winner && m.players?.length === 2).map((m: any) => m.matchId)
      );
      const beforeCompleted = listCompleted(before?.schedule || []);
      const afterCompleted = listCompleted(after?.schedule || []);
      const newCompleted = [...afterCompleted].filter((id) => !beforeCompleted.has(id));
      if (newCompleted.length === 0) return;

      // Build map of matchId -> match
      const matchMap: Record<string, any> = {};
      for (const w of after?.schedule || []) for (const m of w.matches || []) matchMap[m.matchId] = m;
      for (const mid of newCompleted) {
        const m = matchMap[mid];
        if (m?.players?.length === 2 && m.result?.winner) {
          const winner = m.result.winner as string;
          const loser = m.players.find((p: string) => p !== winner) as string;
          await updateTwoPlayerStats(winner, loser, m.result.score);
        }
      }

      await updateLeaderboard('league', lid);
      await updateGlobalLeaderboard();
      console.log('🧮 Player stats and leaderboards updated for league', lid);
    } catch (err) {
      console.error('updateLeagueStats error', err);
    }
  });

// Auto-progress to playoffs when all season matches complete and status is active
export const progressToPlayoffs = functions.firestore.onDocumentUpdated(
  'leagues/{leagueId}',
  async (change, context) => {
    const after = change.after.data() as any;
    const id = context.params.leagueId as string;

    try {
      if (after?.status !== 'active') return;
      const weeks = after?.schedule || [];
      if (!weeks.length) return;
      const allCompleted = weeks.every((w: any) => (w.matches || []).length > 0 && (w.matches || []).every((m: any) => m.status === 'completed'));
      if (!allCompleted) return;

      // Seed playoffs from standings (top 8 if available)
      const standings = (after?.standings || []).slice().sort((a: any, b: any) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.differential !== a.differential) return b.differential - a.differential;
        return (b.wins - a.wins);
      });
      const seeds = standings.map((s: any) => s.playerId).slice(0, 8);
      if (seeds.length < 2) return;

      const matches: any[] = [];
      // Simple 1v8, 2v7, ...
      for (let i = 0; i < Math.floor(seeds.length / 2); i++) {
        matches.push({ matchId: `${id}_PO_R1_M${i + 1}`, players: [seeds[i], seeds[seeds.length - 1 - i]], status: 'pending' });
      }
      const playoffBracket = { rounds: [{ roundNumber: 1, matches }] };

      await db.collection('leagues').doc(id).update({
        playoffs: { bracket: playoffBracket },
        status: 'playoffs',
        updatedAt: new Date().toISOString(),
      });
      console.log('🏆 League progressed to playoffs', id);
    } catch (err) {
      console.error('progressToPlayoffs error', err);
    }
  });

export { autoSeedBracket } from './autoSeedBracket';
export { autoArchiveTournament } from './autoArchive';
