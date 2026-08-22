import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  RouterLink
} from '@angular/router';

import {
  SavedPropertySummary
} from '../../models/dashboard-state.model';

import {
  SavedHomesComponent
} from '../../components/saved-homes/saved-homes.component';

import {
  DashboardStateService
} from '../../services/dashboard-state.service';

@Component({
  selector:
    'app-dashboard-saved-properties',
  standalone: true,
  imports: [
    RouterLink,
    SavedHomesComponent
  ],
  templateUrl:
    './dashboard-saved-properties.component.html',
  styleUrl:
    './dashboard-saved-properties.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class DashboardSavedPropertiesComponent
  implements OnInit {

  protected readonly dashboardState =
    inject(DashboardStateService);

  protected readonly isLoading =
    signal(true);

  protected readonly loadError =
    signal('');

  protected readonly removingListingUid =
    signal<string | null>(null);

  protected readonly removalError =
    signal('');

  async ngOnInit(): Promise<void> {
    await this.loadSavedProperties();
  }

  protected async retryLoading():
    Promise<void> {
    await this.loadSavedProperties();
  }

  protected async removeSavedProperty(
    property: SavedPropertySummary
  ): Promise<void> {
    if (this.removingListingUid()) {
      return;
    }

    this.removalError.set('');

    this.removingListingUid.set(
      property.listingUid
    );

    try {
      await this.dashboardState
        .removeSavedProperty(
          property.listingUid
        );
    } catch (error: unknown) {
      console.error(
        'Unable to remove saved property:',
        error
      );

      this.removalError.set(
        'We could not remove this saved property. ' +
        'Please try again.'
      );
    } finally {
      this.removingListingUid.set(null);
    }
  }

  private async loadSavedProperties():
    Promise<void> {
    this.isLoading.set(true);
    this.loadError.set('');
    this.removalError.set('');

    try {
      await this.dashboardState.load();
    } catch (error: unknown) {
      console.error(
        'Unable to load saved properties:',
        error
      );

      this.loadError.set(
        'Your saved properties could not be ' +
        'loaded. Please try again.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}