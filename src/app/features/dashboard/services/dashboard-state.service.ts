import { Injectable, inject, signal } from '@angular/core';

import { DashboardState } from '../models/dashboard-state.model';
import { DashboardService } from './dashboard.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardStateService {

  private readonly dashboardService = inject(DashboardService);

  readonly state = signal<DashboardState>({
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

    const draftListings =
      await this.dashboardService.getDraftListings();

    const activeListings =
      await this.dashboardService.getActiveListings();

    const savedProperties = await this.dashboardService.getSavedHomes();

   this.state.update(state => ({
  ...state,
  draftListings,
  activeListings,
  savedProperties,
  hasDraftListings: draftListings.length > 0,
  hasListings: draftListings.length + activeListings.length > 0,
  hasSavedProperties: savedProperties.length > 0,
  showWelcome:
    draftListings.length === 0 &&
    activeListings.length === 0 &&
    savedProperties.length === 0
}));

  }

}