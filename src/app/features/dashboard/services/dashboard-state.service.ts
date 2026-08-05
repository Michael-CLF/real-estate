import { Injectable, inject, signal } from '@angular/core';

import { DashboardState } from '../models/dashboard-state.model';
import { DashboardService } from './dashboard.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardStateService {

  private readonly dashboardService = inject(DashboardService);

  readonly state = signal<DashboardState>({
    firstName: '',

    hasListings: false,
    hasDraftListings: false,
    hasSavedProperties: false,
    hasMessages: false,
    hasOffers: false,
    hasShowings: false,

    showWelcome: true,

    draftListings: [],
    activeListings: [],
    savedProperties: []
  });

  async load(): Promise<void> {

    const [
      firstName,
      draftListings,
      activeListings,
      savedProperties
    ] = await Promise.all([
      this.dashboardService.getCurrentUserFirstName(),
      this.dashboardService.getDraftListings(),
      this.dashboardService.getActiveListings(),
      this.dashboardService.getSavedHomes()
    ]);

    this.state.update(state => ({
      ...state,

      firstName,
      draftListings,
      activeListings,
      savedProperties,

      hasDraftListings:
        draftListings.length > 0,

      hasListings:
        draftListings.length +
        activeListings.length > 0,

      hasSavedProperties:
        savedProperties.length > 0,

      showWelcome:
        draftListings.length === 0 &&
        activeListings.length === 0 &&
        savedProperties.length === 0
    }));
  }

}