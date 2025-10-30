import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  Timestamp 
} from "firebase/firestore";
import { db } from "./firebaseClient";
import { Profile } from "@/types/profile";

/**
 * Creates a new player profile in Firestore
 * @param userId - The user's unique identifier
 * @param data - Partial profile data to create
 * @returns Promise<void>
 */
export async function createProfile(userId: string, data: Partial<Profile>): Promise<void> {
  try {
    const profileRef = doc(db, "users", userId);
    
    const now = Date.now();
    const profileData: Profile = {
      id: userId,
      username: data.username || `Player_${userId.slice(0, 8)}`,
      email: data.email || "",
      avatarUrl: data.avatarUrl,
      tier: data.tier || "Gamer",
      wins: data.wins || 0,
      losses: data.losses || 0,
      tournamentsWon: data.tournamentsWon || 0,
      leaguesWon: data.leaguesWon || 0,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(profileRef, profileData);
  } catch (error) {
    console.error("Error creating profile:", error);
    throw new Error("Failed to create profile");
  }
}

/**
 * Retrieves a player profile from Firestore
 * @param userId - The user's unique identifier
 * @returns Promise<Profile | null>
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const profileRef = doc(db, "users", userId);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      const data = profileSnap.data();
      
      // Convert Firestore Timestamps to numbers if they exist
      const profile: Profile = {
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : data.updatedAt,
      } as Profile;
      
      return profile;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting profile:", error);
    throw new Error("Failed to get profile");
  }
}

/**
 * Updates an existing player profile in Firestore
 * @param userId - The user's unique identifier
 * @param data - Partial profile data to update
 * @returns Promise<void>
 */
export async function updateProfile(userId: string, data: Partial<Profile>): Promise<void> {
  try {
    const profileRef = doc(db, "users", userId);
    
    // Remove id from update data to prevent overwriting document ID
    const { id, createdAt, ...updateData } = data;
    
    const updatePayload = {
      ...updateData,
      updatedAt: Date.now(),
    };

    await updateDoc(profileRef, updatePayload);
  } catch (error) {
    console.error("Error updating profile:", error);
    throw new Error("Failed to update profile");
  }
}

/**
 * Deletes a player profile from Firestore
 * @param userId - The user's unique identifier
 * @returns Promise<void>
 */
export async function deleteProfile(userId: string): Promise<void> {
  try {
    const profileRef = doc(db, "users", userId);
    await deleteDoc(profileRef);
  } catch (error) {
    console.error("Error deleting profile:", error);
    throw new Error("Failed to delete profile");
  }
}