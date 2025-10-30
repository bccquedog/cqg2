import * as admin from "firebase-admin";

// Lazy initialization of Firestore
function getDb() {
  return admin.firestore();
}

// Generate random code
function generateCode(length: number = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// Issue a ticket
export async function issueTicket(userId: string, competitionId: string, roundId: string, ttlMinutes: number = 60) {
  const code = generateCode(10);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();

  const ticketDoc = await getDb().collection("tickets").add({
    code,
    userId,
    competitionId,
    roundId,
    valid: true,
    issuedAt: new Date().toISOString(),
    expiresAt,
  });

  return { id: ticketDoc.id, code };
}

// Validate a ticket
export async function validateTicket(code: string, competitionId: string): Promise<boolean> {
  const snapshot = await getDb().collection("tickets")
    .where("code", "==", code)
    .where("competitionId", "==", competitionId)
    .limit(1)
    .get();

  if (snapshot.empty) return false;

  const ticket = snapshot.docs[0].data();
  const now = new Date().toISOString();

  if (!ticket.valid) return false;
  if (ticket.expiresAt < now) return false;

  return true;
}

// Revoke a ticket
export async function revokeTicket(code: string, competitionId: string) {
  const snapshot = await getDb().collection("tickets")
    .where("code", "==", code)
    .where("competitionId", "==", competitionId)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    await snapshot.docs[0].ref.update({ valid: false });
    return true;
  }
  return false;
}
