import {
  Injectable,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  User
} from 'firebase/auth';

import {
  AuthService
} from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthState {

  private readonly authService = inject(AuthService);

  /*
   * Firebase authentication initialization state.
   *
   * true:
   * We do not yet know whether the browser has an
   * authenticated Firebase session.
   *
   * false:
   * Firebase has completed its initial auth-state check.
   */
  readonly loading = signal(true);

  /*
   * The currently authenticated Firebase user.
   *
   * null means the user is signed out.
   */
  readonly user = signal<User | null>(null);

  /*
   * Authentication is only considered established after
   * Firebase has finished initializing and returned a user.
   */
  readonly isAuthenticated = computed(
    () =>
      !this.loading() &&
      this.user() !== null
  );

  /*
   * Convenience UID for guards, repositories and components.
   */
  readonly uid = computed(
    () => this.user()?.uid ?? null
  );

  /*
   * Convenience email for authenticated-user UI.
   */
  readonly email = computed(
    () => this.user()?.email ?? null
  );

  /*
   * Explicit signed-out state.
   *
   * This is intentionally different from loading.
   * While Firebase is initializing, we do not yet know
   * whether the user is signed in or signed out.
   */
  readonly isSignedOut = computed(
    () =>
      !this.loading() &&
      this.user() === null
  );

  constructor() {
    this.authService.onAuthStateChanged(
      user => {
        this.user.set(user);
        this.loading.set(false);
      }
    );
  }
}