import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 👉 Use Production Firebase (emulators disabled)
console.log("🔥 Using Production Firebase");

// Guest authentication removed - users must sign in with email/password
export async function ensureGuestAuth() {
  // No longer using anonymous authentication
  console.log("🔐 Authentication required - users must sign in with email/password");
}

// Helper function to check if user is authenticated
export function isAuthenticated() {
  return !!auth.currentUser;
}

// Helper function to get current user
export function getCurrentUser() {
  return auth.currentUser;
}

export { db, auth };