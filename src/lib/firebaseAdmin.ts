import type { App as AdminApp } from 'firebase-admin/app';
import { getApps as getAdminApps, getApp as getAdminApp, initializeApp as initializeAdminApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore, Firestore as AdminFirestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, Auth as AdminAuth } from 'firebase-admin/auth';

declare global {
  // eslint-disable-next-line no-var
  var _adminApp: AdminApp | undefined;
  // eslint-disable-next-line no-var
  var _adminDb: AdminFirestore | undefined;
  // eslint-disable-next-line no-var
  var _adminAuth: AdminAuth | undefined;
}

function buildAdminCredentials() {
  // Prefer GOOGLE_APPLICATION_CREDENTIALS (ADC). If not present, build from env vars for Vercel/Next envs.
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (clientEmail && privateKey && projectId) {
    return cert({
      clientEmail,
      privateKey,
      projectId,
    });
  }
  return applicationDefault();
}

let adminApp: AdminApp;
let adminDb: AdminFirestore;
let adminAuth: AdminAuth;

if (!global._adminApp) {
  adminApp = initializeAdminApp({
    credential: buildAdminCredentials(),
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
  adminDb = getAdminFirestore(adminApp);
  adminAuth = getAdminAuth(adminApp);

  global._adminApp = adminApp;
  global._adminDb = adminDb;
  global._adminAuth = adminAuth;
} else {
  adminApp = global._adminApp;
  adminDb = global._adminDb!;
  adminAuth = global._adminAuth!;
}

export { adminApp, adminDb, adminAuth };




