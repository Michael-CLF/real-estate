import {
  initializeApp
} from 'firebase/app';

import {
  getAuth
} from 'firebase/auth';

import {
  getFirestore
} from 'firebase/firestore';

import {
  getFunctions
} from 'firebase/functions';

import {
  getStorage
} from 'firebase/storage';

import {
  environment
} from '../../../../environments/environment';

export const firebaseApp =
  initializeApp(
    environment.firebase
  );

export const auth =
  getAuth(firebaseApp);

export const firestore =
  getFirestore(firebaseApp);

export const functions =
  getFunctions(
    firebaseApp,
    'us-east1'
  );

export const storage =
  getStorage(firebaseApp);