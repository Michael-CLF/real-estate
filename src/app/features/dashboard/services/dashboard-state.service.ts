import {
  Injectable,
  inject,
  signal
} from '@angular/core';

import {
  DashboardState
} from '../models/dashboard-state.model';

import {
  DashboardService
} from './dashboard.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardStateService {

  private readonly dashboardService =
    inject(DashboardService);

  readonly state = signal<DashboardState>({
    firstName: '',
    userProfile: null,

    isFirstDashboardVisit: false,

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
    /*
     * Prevent a placeholder or a previously
     * loaded user from appearing while the
     * current profile is being retrieved.
     */
    this.state.update(state => ({
      ...state,

      firstName: '',
      userProfile: null,
      isFirstDashboardVisit: false
    }));

    const [
      userProfile,
      draftListings,
      activeListings,
      savedProperties
    ] = await Promise.all([
      this.dashboardService
        .getCurrentUserProfile(),

      this.dashboardService
        .getDraftListings(),

      this.dashboardService
        .getActiveListings(),

      this.dashboardService
        .getSavedHomes()
    ]);

    const isFirstDashboardVisit =
      userProfile !== null &&
      userProfile.dashboardVisitedAt ===
      null;

    this.state.update(state => ({
      ...state,

      firstName:
        userProfile?.firstName ?? '',

      userProfile,

      isFirstDashboardVisit,

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

    if (isFirstDashboardVisit) {
      void this.dashboardService
        .markDashboardVisited()
        .catch(error => {
          console.error(
            'Unable to record the first dashboard visit:',
            error
          );
        });
    }
  }

  async removeSavedProperty(
    listingUid: string
  ): Promise<void> {
    await this.dashboardService.removeSavedHome(
      listingUid
    );

    this.state.update(currentState => {
      const savedProperties =
        currentState.savedProperties.filter(
          property =>
            property.listingUid !== listingUid
        );

      const hasSavedProperties =
        savedProperties.length > 0;

      return {
        ...currentState,
        savedProperties,
        hasSavedProperties,

        showWelcome:
          !currentState.hasListings &&
          !hasSavedProperties
      };
    });
  }
}