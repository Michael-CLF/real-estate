import { Injectable, signal } from '@angular/core';
import { User, onAuthStateChanged } from 'firebase/auth';

import { auth } from '../infrastructure/firebase/firebase';

@Injectable({
  providedIn: 'root'
})
export class AuthState {

  private readonly _user = signal<User | null>(null);

  private readonly _loading = signal(true);

  readonly user = this._user.asReadonly();

  readonly loading = this._loading.asReadonly();

  readonly isAuthenticated = () => this._user() !== null;

  constructor() {
    onAuthStateChanged(auth, (user) => {
      this._user.set(user);
      this._loading.set(false);
    });
  }

  get uid(): string | null {
    return this._user()?.uid ?? null;
  }

  get email(): string | null {
    return this._user()?.email ?? null;
  }
}