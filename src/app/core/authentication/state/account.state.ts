import {
  Injectable,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';

import {
  PlatformUser
} from '../../domains/users/models/platform-user.model';

import {
  FirebaseUserRepository
} from '../../infrastructure/firebase/firebase-user.repository';

import {
  AuthState
} from './auth.state';

@Injectable({
  providedIn: 'root'
})
export class AccountState {

  private readonly authState = inject(AuthState);

  private readonly userRepository =
    inject(FirebaseUserRepository);

  /*
   * The NavStreet Firestore user profile associated
   * with the authenticated Firebase user.
   *
   * null means either:
   *
   * 1. There is no authenticated Firebase user, or
   * 2. The authenticated Firebase user does not have
   *    a NavStreet /users/{uid} document.
   */
  readonly profile =
    signal<PlatformUser | null>(null);

  /*
   * Indicates that NavStreet is currently checking
   * Firestore for the authenticated user's profile.
   */
  readonly loading = signal(true);

  /*
   * Indicates that the Firebase user is authenticated
   * but no corresponding NavStreet user profile exists.
   */
  readonly profileMissing = signal(false);

  /*
   * Stores an unexpected Firestore/profile loading error.
   *
   * A missing document is not considered an error.
   */
  readonly error = signal<string | null>(null);

  /*
   * A complete NavStreet account requires both:
   *
   * 1. A Firebase authenticated user.
   * 2. A corresponding Firestore user profile.
   */
  readonly hasAccount = computed(
    () =>
      !this.authState.loading() &&
      !this.loading() &&
      this.authState.isAuthenticated() &&
      this.profile() !== null
  );

  /*
   * True when Firebase authentication exists but the
   * NavStreet Firestore account does not.
   */
  readonly hasIncompleteAccount = computed(
    () =>
      !this.authState.loading() &&
      !this.loading() &&
      this.authState.isAuthenticated() &&
      this.profileMissing()
  );

  /*
   * A disabled account still exists, but should not
   * eventually receive normal authenticated access.
   */
  readonly isActive = computed(
    () =>
      this.hasAccount() &&
      this.profile()?.status === 'active'
  );

  readonly uid = computed(
    () => this.profile()?.uid ?? null
  );

  readonly displayName = computed(
    () => this.profile()?.displayName ?? null
  );

  readonly email = computed(
    () => this.profile()?.email ?? null
  );

  constructor() {
    effect(() => {
      const authLoading =
        this.authState.loading();

      const firebaseUser =
        this.authState.user();

      /*
       * Firebase has not finished determining whether
       * a browser session exists.
       */
      if (authLoading) {
        this.loading.set(true);
        this.profile.set(null);
        this.profileMissing.set(false);
        this.error.set(null);

        return;
      }

      /*
       * Firebase has finished initializing and there
       * is no authenticated user.
       */
      if (!firebaseUser) {
        this.loading.set(false);
        this.profile.set(null);
        this.profileMissing.set(false);
        this.error.set(null);

        return;
      }

      /*
       * Firebase authentication exists.
       *
       * Now determine whether this UID also has a
       * NavStreet account in Firestore.
       */
      void this.loadProfile(firebaseUser.uid);
    });
  }

  async refresh(): Promise<void> {
    const firebaseUser =
      this.authState.user();

    if (!firebaseUser) {
      this.profile.set(null);
      this.profileMissing.set(false);
      this.error.set(null);
      this.loading.set(false);

      return;
    }

    await this.loadProfile(
      firebaseUser.uid
    );
  }

  private async loadProfile(
    uid: string
  ): Promise<void> {
    this.loading.set(true);
    this.profileMissing.set(false);
    this.error.set(null);

    try {
      const profile =
        await this.userRepository.getById(uid);

      /*
       * Protect against an auth-state change occurring
       * while the Firestore request was in progress.
       */
      if (
        this.authState.user()?.uid !== uid
      ) {
        return;
      }

      if (!profile) {
        this.profile.set(null);
        this.profileMissing.set(true);

        return;
      }

      this.profile.set(profile);
      this.profileMissing.set(false);
    } catch (error) {
      /*
       * A Firestore permissions/network failure must not
       * be treated as "profile missing." We do not know
       * whether the account exists in that situation.
       */
      if (
        this.authState.user()?.uid !== uid
      ) {
        return;
      }

      console.error(
        'Unable to load NavStreet account profile:',
        error
      );

      this.profile.set(null);
      this.profileMissing.set(false);

      this.error.set(
        error instanceof Error
          ? error.message
          : 'Unable to load the NavStreet account.'
      );
    } finally {
      /*
       * Only complete this request if it still belongs
       * to the currently authenticated Firebase user.
       */
      if (
        this.authState.user()?.uid === uid
      ) {
        this.loading.set(false);
      }
    }
  }
}