import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Reusable logger for all admin actions
export async function logAdminAction(
  adminId: string,
  role: string,
  action: string,
  details: Record<string, any> = {}
) {
  try {
    await addDoc(collection(db, "auditLogs"), {
      adminId,
      role,
      action,
      details,
      createdAt: serverTimestamp(),
    });
    console.log("✅ Admin action logged:", action);
  } catch (err) {
    console.error("❌ Failed to log admin action:", err);
  }
}
