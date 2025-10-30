import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { firebaseConfig } from "@/config/firebaseConfig";

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export const rtdb = getDatabase(app);

// 👉 Use Production Firebase (emulators disabled)
console.log("🔥 Using Production Firebase");

export { app };
