import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// Limit per user
const MAX_REQUESTS = 30; // per minute
const WINDOW_MS = 60 * 1000;

export const rateLimitedTournamentQuery = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
  }

  const uid = context.auth.uid;
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  const ref = db.collection("rateLimits").doc(uid);
  const snapshot = await ref.get();

  let requests: number[] = [];
  if (snapshot.exists) {
    requests = snapshot.data()?.requests || [];
    requests = requests.filter((ts: number) => ts > cutoff);
  }

  if (requests.length >= MAX_REQUESTS) {
    throw new functions.https.HttpsError("resource-exhausted", "Too many requests. Slow down.");
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


