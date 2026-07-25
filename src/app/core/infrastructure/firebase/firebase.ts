import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

import { environment } from '../../../../environments/environment';

export const firebaseApp = initializeApp(environment.firebase);

export const auth = getAuth(firebaseApp);

export const firestore = getFirestore(firebaseApp);

export const storage = getStorage(firebaseApp);

export let analytics: ReturnType<typeof getAnalytics> | null = null;

isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(firebaseApp);
  }
});