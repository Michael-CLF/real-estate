import { Injectable } from '@angular/core';

import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

import { auth } from '../infrastructure/firebase/firebase';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  get currentUser(): User | null {
    return auth.currentUser;
  }

  onAuthStateChanged(callback: (user: User | null) => void): void {
    onAuthStateChanged(auth, callback);
  }

  async register(email: string, password: string) {
    return createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
  }

  async login(email: string, password: string) {
    return signInWithEmailAndPassword(
      auth,
      email,
      password
    );
  }

  async logout() {
    return signOut(auth);
  }
}