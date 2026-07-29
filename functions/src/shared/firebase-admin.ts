import {
  getApps,
  initializeApp,
} from 'firebase-admin/app';

import {
  getAuth,
} from 'firebase-admin/auth';

import {
  getFirestore,
} from 'firebase-admin/firestore';

/**
 * Initialize the Firebase Admin SDK only once.
 *
 * Cloud Functions may reuse the same Node.js process across multiple
 * invocations, so duplicate initialization must be avoided.
 */
const adminApp =
  getApps()[0] ?? initializeApp();

/**
 * Server-side Firebase Authentication instance.
 */
export const adminAuth =
  getAuth(adminApp);

/**
 * Server-side Cloud Firestore instance.
 */
export const adminFirestore =
  getFirestore(adminApp);