import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Check if a user has access to a specific feature.
 * @param userId - Firestore user ID
 * @param feature - feature string (e.g., "premiumLeagues", "creatorTools")
 */
export async function hasFeature(userId: string, feature: string): Promise<boolean> {
  const membershipDoc = await db.collection("users").doc(userId).collection("membership").doc("active").get();
  if (!membershipDoc.exists) return false;

  const tierId = membershipDoc.data()?.tierId;
  if (!tierId) return false;

  const tierDoc = await db.collection("memberships").doc(tierId).get();
  if (!tierDoc.exists) return false;

  const features = tierDoc.data()?.features || [];
  if (features.includes("allFeatures")) return true;

  return features.includes(feature);
}


