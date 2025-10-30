import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  Timestamp 
} from "firebase/firestore";
import { db } from "./firebaseClient";
import { Clan } from "../types/clan";

const CLANS_COLLECTION = "clans";

/**
 * Create a new clan in Firestore
 * @param data - Clan data (id will be auto-generated)
 * @returns Promise<string> - The created clan ID
 */
export async function createClan(data: Omit<Clan, "id" | "createdAt">): Promise<string> {
  try {
    const clanData = {
      ...data,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, CLANS_COLLECTION), clanData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating clan:", error);
    throw new Error("Failed to create clan");
  }
}

/**
 * Get a clan by its ID
 * @param clanId - The clan ID
 * @returns Promise<Clan | null> - The clan data or null if not found
 */
export async function getClanById(clanId: string): Promise<Clan | null> {
  try {
    const docRef = doc(db, CLANS_COLLECTION, clanId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt as Timestamp,
      } as Clan;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting clan:", error);
    throw new Error("Failed to get clan");
  }
}

/**
 * Get all clans from Firestore
 * @returns Promise<Clan[]> - Array of all clans
 */
export async function getAllClans(): Promise<Clan[]> {
  try {
    const querySnapshot = await getDocs(collection(db, CLANS_COLLECTION));
    const clans: Clan[] = [];

    querySnapshot.forEach((doc) => {
      clans.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt as Timestamp,
      } as Clan);
    });

    return clans;
  } catch (error) {
    console.error("Error getting all clans:", error);
    throw new Error("Failed to get clans");
  }
}

/**
 * Update a clan by its ID
 * @param clanId - The clan ID to update
 * @param data - Partial clan data to update
 * @returns Promise<void>
 */
export async function updateClan(clanId: string, data: Partial<Omit<Clan, "id" | "createdAt">>): Promise<void> {
  try {
    const docRef = doc(db, CLANS_COLLECTION, clanId);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error("Error updating clan:", error);
    throw new Error("Failed to update clan");
  }
}

/**
 * Delete a clan by its ID
 * @param clanId - The clan ID to delete
 * @returns Promise<void>
 */
export async function deleteClan(clanId: string): Promise<void> {
  try {
    const docRef = doc(db, CLANS_COLLECTION, clanId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting clan:", error);
    throw new Error("Failed to delete clan");
  }
}

/**
 * Add a member to a clan
 * @param clanId - The clan ID
 * @param userId - The user ID to add
 * @returns Promise<void>
 */
export async function addMemberToClan(clanId: string, userId: string): Promise<void> {
  try {
    const clan = await getClanById(clanId);
    if (!clan) {
      throw new Error("Clan not found");
    }

    if (clan.members.includes(userId)) {
      throw new Error("User is already a member of this clan");
    }

    const updatedMembers = [...clan.members, userId];
    await updateClan(clanId, { members: updatedMembers });
  } catch (error) {
    console.error("Error adding member to clan:", error);
    throw new Error("Failed to add member to clan");
  }
}

/**
 * Remove a member from a clan
 * @param clanId - The clan ID
 * @param userId - The user ID to remove
 * @returns Promise<void>
 */
export async function removeMemberFromClan(clanId: string, userId: string): Promise<void> {
  try {
    const clan = await getClanById(clanId);
    if (!clan) {
      throw new Error("Clan not found");
    }

    if (!clan.members.includes(userId)) {
      throw new Error("User is not a member of this clan");
    }

    // Prevent removing the captain
    if (clan.captainId === userId) {
      throw new Error("Cannot remove the clan captain");
    }

    const updatedMembers = clan.members.filter(id => id !== userId);
    await updateClan(clanId, { members: updatedMembers });
  } catch (error) {
    console.error("Error removing member from clan:", error);
    throw new Error("Failed to remove member from clan");
  }
}

/**
 * Update clan stats (wins, losses, tournamentsWon)
 * @param clanId - The clan ID
 * @param stats - Updated stats
 * @returns Promise<void>
 */
export async function updateClanStats(clanId: string, stats: Partial<Clan["stats"]>): Promise<void> {
  try {
    const clan = await getClanById(clanId);
    if (!clan) {
      throw new Error("Clan not found");
    }

    const updatedStats = {
      ...clan.stats,
      ...stats,
    };

    await updateClan(clanId, { stats: updatedStats });
  } catch (error) {
    console.error("Error updating clan stats:", error);
    throw new Error("Failed to update clan stats");
  }
}


