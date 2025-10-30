import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const autoSeedBracket = functions.firestore.onDocumentWritten(
  'tournaments/{tournamentId}/registrations/{userId}',
  async (change, context) => {
    const { tournamentId } = context.params as { tournamentId: string };
    const tourRef = db.collection('tournaments').doc(tournamentId);
    const tourSnap = await tourRef.get();
    if (!tourSnap.exists) return;

    const tour = tourSnap.data() as { maxPlayers?: number; status?: string; seedingMode?: string; seedOrder?: string[] | null };
    const maxPlayers = tour.maxPlayers ?? 16;
    const seedingMode = tour.seedingMode || 'random';

    // Check if matches already exist; if so, do nothing
    const matchesSnap = await tourRef.collection('matches').limit(1).get();
    if (!matchesSnap.empty) {
      return;
    }

    // Count registrations
    const regsSnap = await tourRef.collection('registrations').get();
    const count = regsSnap.size;
    if (count !== maxPlayers) {
      return;
    }

    // Collect userIds according to seeding mode
    let userIds: string[] = regsSnap.docs.map((d) => d.id);
    if (seedingMode === 'admin' && Array.isArray(tour.seedOrder) && tour.seedOrder.length === userIds.length) {
      // Use admin-provided order if it matches count
      userIds = [...tour.seedOrder];
      console.log(`[bracket] Using admin seeding for ${tournamentId}`);
    } else {
      // Random shuffle (Phase 1 default)
      for (let i = userIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [userIds[i], userIds[j]] = [userIds[j], userIds[i]];
      }
      console.log(`[bracket] Using ${seedingMode} seeding for ${tournamentId}`);
    }

    // Seed round 1 matches
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
    batch.set(tourRef, { status: 'closed' }, { merge: true });
    await batch.commit();

    console.log(`✅ Tournament ${tournamentId} bracket seeded (${seedingMode}).`);
  });


