import { Injectable, inject } from '@angular/core';

import { AuthState } from '../../../core/authentication/auth.state';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private readonly authState = inject(AuthState);

  get currentUserId(): string {
    const uid = this.authState.uid;

    if (!uid) {
      throw new Error('No authenticated user.');
    }

    return uid;
  }
}