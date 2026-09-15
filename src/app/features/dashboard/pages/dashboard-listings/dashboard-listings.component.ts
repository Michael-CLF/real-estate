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
  ListingDeletionService
} from '../../../../core/domains/listings/services/listing-deletion.service';

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
  selector:
    'app-dashboard-listings',

  standalone:
    true,

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

  private readonly deletionService =
    inject(ListingDeletionService);


  protected readonly selectedTab =
    signal<ListingTab>('active');

  protected readonly isLoading =
    signal(true);

  protected readonly loadError =
    signal('');

  protected readonly deletionError =
    signal('');

  protected readonly deletionSuccess =
    signal('');

  protected readonly deletingListingUid =
    signal<string | null>(null);


  protected readonly draftListings =
    computed(
      () =>
        this.dashboardState.state()
          .draftListings
    );


  protected readonly activeListings =
    computed(
      () =>
        this.dashboardState.state()
          .activeListings
    );


  protected readonly underContractListings =
    computed(
      () =>
        this.dashboardState.state()
          .underContractListings
    );


  protected readonly soldListings =
    computed(
      () =>
        this.dashboardState.state()
          .soldListings
    );


  protected readonly selectedListings =
    computed<Listing[]>(() => {
      switch (this.selectedTab()) {
        case 'draft':
          return this.draftListings();

        case 'under-contract':
          return this
            .underContractListings();

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


  protected readonly deletionAllowed =
    computed(() =>
      this.selectedTab() === 'draft' ||
      this.selectedTab() === 'active'
    );


  async ngOnInit(): Promise<void> {
    await this.loadListings();
  }


  protected selectTab(
    tab: ListingTab
  ): void {
    this.selectedTab.set(tab);
    this.deletionError.set('');
    this.deletionSuccess.set('');
  }


  protected async retryLoading():
    Promise<void> {
    await this.loadListings();
  }


  protected async manageListing(
    listing: Listing
  ): Promise<void> {
    if (
      String(listing.status) ===
      'draft'
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


  protected async openMarketingToolkit(
    listing: Listing
  ): Promise<void> {
    if (
      String(listing.status) ===
      'draft'
    ) {
      return;
    }

    await this.router.navigate([
      '/sell/listings',
      listing.Uid,
      'manage',
      'marketing'
    ]);
  }


  protected async deleteListing(
    listing: Listing
  ): Promise<void> {
    if (
      this.deletingListingUid()
    ) {
      return;
    }

    const recordType =
      String(listing.status) ===
        'draft'
        ? 'draft'
        : 'published';

    const address = [
      listing.addressLine1,
      listing.city,
      listing.state,
      listing.zipCode
    ]
      .filter(Boolean)
      .join(', ');

    const confirmationMessage =
      recordType === 'draft'
        ? (
          'Permanently delete this listing draft?\n\n' +
          `${address || listing.Uid}\n\n` +
          'Any uploaded listing photos will also be deleted.\n\n' +
          'This action cannot be undone.'
        )
        : (
          'Permanently delete this property listing?\n\n' +
          `${address || listing.Uid}\n\n` +
          'NavStreet will also delete its draft, photos, disclosures, saved-property references, inquiries, showings, offers, contracts, documents, marketing records, and transaction information.\n\n' +
          'This action cannot be undone.'
        );

    const confirmed =
      window.confirm(
        confirmationMessage
      );

    if (!confirmed) {
      return;
    }

    this.deletingListingUid.set(
      listing.Uid
    );

    this.deletionError.set('');
    this.deletionSuccess.set('');

    try {
      await this.deletionService
        .deleteListing(
          listing.Uid,
          recordType
        );

      await this.loadListings();

      this.deletionSuccess.set(
        recordType === 'draft'
          ? 'The listing draft was permanently deleted.'
          : 'The property listing and its related records were permanently deleted.'
      );

    } catch (error: unknown) {
      console.error(
        'Listing deletion failed:',
        error
      );

      this.deletionError.set(
        error instanceof Error &&
        error.message
          ? error.message
          : 'The listing could not be deleted.'
      );

    } finally {
      this.deletingListingUid.set(
        null
      );
    }
  }


  private async loadListings():
    Promise<void> {
    this.isLoading.set(true);
    this.loadError.set('');

    try {
      await this.dashboardState.load();

      if (
        this.activeListings().length > 0
      ) {
        this.selectedTab.set('active');

      } else if (
        this.draftListings().length > 0
      ) {
        this.selectedTab.set('draft');

      } else if (
        this.underContractListings()
          .length > 0
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
