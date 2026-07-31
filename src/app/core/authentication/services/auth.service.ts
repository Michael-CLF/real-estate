import { Injectable } from '@angular/core';

import {
  GoogleAuthProvider,
  Unsubscribe,
  User,
  UserCredential,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInWithPopup,
  signOut
} from 'firebase/auth';

import { auth } from '../../infrastructure/firebase/firebase';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  get currentUser(): User | null {
    return auth.currentUser;
  }

  get currentUserUid(): string | null {
    return auth.currentUser?.uid ?? null;
  }

  get isAuthenticated(): boolean {
    return auth.currentUser !== null;
  }

  onAuthStateChanged(
    callback: (user: User | null) => void
  ): Unsubscribe {
    return firebaseOnAuthStateChanged(
      auth,
      callback
    );
  }

  async signInWithGoogle(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();

    provider.setCustomParameters({
      prompt: 'select_account'
    });

    return signInWithPopup(
      auth,
      provider
    );
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }
}