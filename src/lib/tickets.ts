import { 
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";

export interface Ticket {
  id?: string;
  code: string;
  userId: string;
  competitionId: string;
  roundId?: string;
  matchId?: string;
  valid: boolean;
  issuedAt: unknown; // Firestore Timestamp
  expiresAt?: unknown; // Firestore Timestamp
  usedAt?: unknown; // Firestore Timestamp
  usedBy?: string;
}

/**
 * Generates a random alphanumeric code
 * @param length - Length of the code (default: 8)
 * @returns string
 */
export function generateCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Issues a new ticket for a match
 * @param userId - User ID
 * @param competitionId - Competition ID
 * @param roundId - Round ID (optional)
 * @param matchId - Match ID (optional)
 * @param expiresInHours - Hours until expiration (default: 2)
 * @returns Promise<string> - The ticket code
 */
export async function issueTicket(
  userId: string,
  competitionId: string,
  roundId?: string,
  matchId?: string,
  expiresInHours: number = 2
): Promise<string> {
  try {
    const code = generateCode();
    const now = new Date();
    // const expiresAt = new Date(now.getTime() + (expiresInHours * 60 * 60 * 1000));

    const ticketData: Omit<Ticket, 'id'> = {
      code,
      userId,
      competitionId,
      roundId,
      matchId,
      valid: true,
      issuedAt: serverTimestamp(),
      expiresAt: serverTimestamp()
    };

    await addDoc(collection(db, "tickets"), ticketData);
    
    console.log(`✅ Ticket issued: ${code} for user ${userId} in competition ${competitionId}`);
    return code;
  } catch (error) {
    console.error("Error issuing ticket:", error);
    throw new Error("Failed to issue ticket");
  }
}

/**
 * Validates a ticket code
 * @param code - The ticket code to validate
 * @param competitionId - The competition ID
 * @returns Promise<boolean>
 */
export async function validateTicket(code: string, competitionId: string): Promise<boolean> {
  try {
    const ticketsRef = collection(db, "tickets");
    const q = query(
      ticketsRef,
      where("code", "==", code),
      where("competitionId", "==", competitionId),
      where("valid", "==", true)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return false;
    }

    const ticketDoc = querySnapshot.docs[0];
    const ticketData = ticketDoc.data();

    // Check if ticket is expired
    if (ticketData.expiresAt) {
      const expiresAt = ticketData.expiresAt.toDate();
      if (expiresAt < new Date()) {
        // Mark ticket as invalid
        await updateDoc(ticketDoc.ref, { 
          valid: false,
          invalidatedAt: serverTimestamp()
        });
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error validating ticket:", error);
    return false;
  }
}

/**
 * Revokes a ticket (marks it as invalid)
 * @param code - The ticket code to revoke
 * @returns Promise<void>
 */
export async function revokeTicket(code: string): Promise<void> {
  try {
    const ticketsRef = collection(db, "tickets");
    const q = query(ticketsRef, where("code", "==", code));
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const ticketDoc = querySnapshot.docs[0];
      await updateDoc(ticketDoc.ref, { 
        valid: false,
        revokedAt: serverTimestamp()
      });
      
      console.log(`✅ Ticket revoked: ${code}`);
    }
  } catch (error) {
    console.error("Error revoking ticket:", error);
    throw new Error("Failed to revoke ticket");
  }
}

/**
 * Gets ticket details by code
 * @param code - The ticket code
 * @returns Promise<Ticket | null>
 */
export async function getTicketByCode(code: string): Promise<Ticket | null> {
  try {
    const ticketsRef = collection(db, "tickets");
    const q = query(ticketsRef, where("code", "==", code));
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const ticketDoc = querySnapshot.docs[0];
    return {
      id: ticketDoc.id,
      ...ticketDoc.data()
    } as Ticket;
  } catch (error) {
    console.error("Error getting ticket by code:", error);
    return null;
  }
}

/**
 * Gets all tickets for a user
 * @param userId - The user ID
 * @returns Promise<Ticket[]>
 */
export async function getUserTickets(userId: string): Promise<Ticket[]> {
  try {
    const ticketsRef = collection(db, "tickets");
    const q = query(ticketsRef, where("userId", "==", userId));
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Ticket[];
  } catch (error) {
    console.error("Error getting user tickets:", error);
    return [];
  }
}

/**
 * Gets all tickets for a competition
 * @param competitionId - The competition ID
 * @returns Promise<Ticket[]>
 */
export async function getCompetitionTickets(competitionId: string): Promise<Ticket[]> {
  try {
    const ticketsRef = collection(db, "tickets");
    const q = query(ticketsRef, where("competitionId", "==", competitionId));
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Ticket[];
  } catch (error) {
    console.error("Error getting competition tickets:", error);
    return [];
  }
}

/**
 * Marks a ticket as used
 * @param code - The ticket code
 * @param usedBy - The user who used the ticket
 * @returns Promise<void>
 */
export async function markTicketAsUsed(code: string, usedBy: string): Promise<void> {
  try {
    const ticketsRef = collection(db, "tickets");
    const q = query(ticketsRef, where("code", "==", code));
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const ticketDoc = querySnapshot.docs[0];
      await updateDoc(ticketDoc.ref, { 
        usedAt: serverTimestamp(),
        usedBy,
        valid: false // Mark as invalid after use
      });
      
      console.log(`✅ Ticket marked as used: ${code} by ${usedBy}`);
    }
  } catch (error) {
    console.error("Error marking ticket as used:", error);
    throw new Error("Failed to mark ticket as used");
  }
}
