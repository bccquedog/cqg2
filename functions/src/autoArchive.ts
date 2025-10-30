import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Auto-archive tournaments when they complete
export const autoArchiveTournament = functions.firestore.onDocumentUpdated(
  'tournaments/{tournamentId}',
  async (change, context) => {
    const before = change.before.data() as any;
    const after = change.after.data() as any;
    const { tournamentId } = context.params as { tournamentId: string };

    // Only trigger when status changes to completed
    if (before.status !== 'completed' && after.status === 'completed') {
      // Check if auto-archiving is enabled (global or per-tournament)
      const autoArchiveEnabled = after.autoArchive !== false; // default true

      if (autoArchiveEnabled) {
        // Mark as archived after a delay (simulate for dev; in prod use scheduled function)
        const archiveDelayMs = 5000; // 5 seconds for testing; use hours/days in prod
        
        setTimeout(async () => {
          try {
            await db.collection('tournaments').doc(tournamentId).update({
              archived: true,
              archivedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`✅ Tournament ${tournamentId} auto-archived.`);
          } catch (e) {
            console.error(`Failed to archive tournament ${tournamentId}:`, e);
          }
        }, archiveDelayMs);
      }
    }
  });



