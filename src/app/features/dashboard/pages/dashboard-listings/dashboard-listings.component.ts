import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  Router,
  RouterLink
} from '@angular/router';

import {
  Listing
} from '../../../../core/domains/listings/models/listing.model';

import {
  AccountListingsComponent
} from '../../components/account-listings/account-listings.component';

import {
  DashboardStateService
} from '../../services/dashboard-state.service';

type ListingTab =
  | 'draft'
  | 'active'
  | 'under-contract'
  | 'sold';

@Component({
  selector: 'app-dashboard-listings',
  standalone: true,
  imports: [
    RouterLink,
    AccountListingsComponent
  ],
  templateUrl:
    './dashboard-listings.component.html',
  styleUrl:
    './dashboard-listings.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class DashboardListingsComponent
  implements OnInit {

  protected readonly dashboardState =
    inject(DashboardStateService);

  private readonly router =
    inject(Router);

  protected readonly selectedTab =
    signal<ListingTab>('active');

  protected readonly isLoading =
    signal(true);

  protected readonly loadError =
    signal('');

  protected readonly draftListings =
    computed(
      () =>
        this.dashboardState.state()
          .draftListings
    );

  protected readonly activeListings =
    computed(() =>
      this.dashboardState.state()
        .activeListings
        .filter(listing => {
          const status =
            String(listing.status);

          return (
            status !== 'under_contract' &&
            status !== 'under-contract' &&
            status !== 'sold'
          );
        })
    );

  protected readonly underContractListings =
    computed(() =>
      this.dashboardState.state()
        .activeListings
        .filter(listing => {
          const status =
            String(listing.status);

          return (
            status === 'under_contract' ||
            status === 'under-contract'
          );
        })
    );

  protected readonly soldListings =
    computed(() =>
      this.dashboardState.state()
        .activeListings
        .filter(
          listing =>
            String(listing.status) ===
            'sold'
        )
    );

  protected readonly selectedListings =
    computed<Listing[]>(() => {
      switch (this.selectedTab()) {
        case 'draft':
          return this.draftListings();

        case 'under-contract':
          return this.underContractListings();

        case 'sold':
          return this.soldListings();

        case 'active':
        default:
          return this.activeListings();
      }
    });

  protected readonly selectedEmptyMessage =
    computed(() => {
      switch (this.selectedTab()) {
        case 'draft':
          return (
            'You do not have any unfinished ' +
            'listing drafts.'
          );

        case 'under-contract':
          return (
            'You do not have any properties ' +
            'currently under contract.'
          );

        case 'sold':
          return (
            'You do not have any sold ' +
            'properties yet.'
          );

        case 'active':
        default:
          return (
            'You do not have any active ' +
            'property listings.'
          );
      }
    });

  protected readonly selectedActionLabel =
    computed(() =>
      this.selectedTab() === 'draft'
        ? 'Continue Listing'
        : 'Manage Listing'
    );

  async ngOnInit(): Promise<void> {
    await this.loadListings();
  }

  protected selectTab(
    tab: ListingTab
  ): void {
    this.selectedTab.set(tab);
  }

  protected async retryLoading():
    Promise<void> {
    await this.loadListings();
  }

  protected async manageListing(
    listing: Listing
  ): Promise<void> {
    if (
      String(listing.status) === 'draft'
    ) {
      await this.router.navigate([
        '/sell/listings',
        listing.Uid,
        'edit'
      ]);

      return;
    }

    await this.router.navigate([
      '/sell/listings',
      listing.Uid,
      'manage'
    ]);
  }

  private async loadListings():
    Promise<void> {
    this.isLoading.set(true);
    this.loadError.set('');

    try {
      await this.dashboardState.load();

      if (this.activeListings().length > 0) {
        this.selectedTab.set('active');
      } else if (
        this.draftListings().length > 0
      ) {
        this.selectedTab.set('draft');
      } else if (
        this.underContractListings().length >
        0
      ) {
        this.selectedTab.set(
          'under-contract'
        );
      } else if (
        this.soldListings().length > 0
      ) {
        this.selectedTab.set('sold');
      }
    } catch (error: unknown) {
      console.error(
        'Unable to load account listings:',
        error
      );

      this.loadError.set(
        'Your property listings could not be ' +
        'loaded. Please try again.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}