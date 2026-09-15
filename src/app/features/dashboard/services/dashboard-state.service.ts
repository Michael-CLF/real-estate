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
    underContractListings: [],
    soldListings: [],
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
      underContractListings,
      soldListings,
      savedProperties
    ] = await Promise.all([
      this.loadDashboardValue(
        'user profile',
        this.dashboardService
          .getCurrentUserProfile(),
        null
      ),

      this.loadDashboardValue(
        'listing drafts',
        this.dashboardService
          .getDraftListings(),
        []
      ),

      this.loadDashboardValue(
        'active listings',
        this.dashboardService
          .getActiveListings(),
        []
      ),

      this.loadDashboardValue(
        'under-contract listings',
        this.dashboardService
          .getUnderContractListings(),
        []
      ),

      this.loadDashboardValue(
        'sold listings',
        this.dashboardService
          .getSoldListings(),
        []
      ),

      this.loadDashboardValue(
        'saved properties',
        this.dashboardService
          .getSavedHomes(),
        []
      )
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
      underContractListings,
      soldListings,
      savedProperties,

      hasDraftListings:
        draftListings.length > 0,

      hasListings:
        draftListings.length +
        activeListings.length +
        underContractListings.length +
        soldListings.length > 0,

      hasSavedProperties:
        savedProperties.length > 0,

      showWelcome:
        draftListings.length === 0 &&
        activeListings.length === 0 &&
        underContractListings.length === 0 &&
        soldListings.length === 0 &&
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

  private async loadDashboardValue<T>(
    sectionName: string,
    request: Promise<T>,
    fallbackValue: T
  ): Promise<T> {
    try {
      return await request;
    } catch (error: unknown) {
      console.error(
        `Unable to load dashboard ${sectionName}:`,
        error
      );

      return fallbackValue;
    }
  }
}
