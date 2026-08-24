import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  CurrencyPipe,
  DatePipe,
  DecimalPipe
} from '@angular/common';

import {
  AdministrationListing,
  AdministrationListingsService,
  AdministrationListingStatus,
  AdministrationListingSummary
} from '../../data-access/administration-listings.service';

type ListingStatusFilter =
  | 'all'
  | AdministrationListingStatus;

@Component({
  selector:
    'app-administration-listings',

  standalone:
    true,

  imports: [
    CurrencyPipe,
    DatePipe,
    DecimalPipe
  ],

  templateUrl:
    './listings.component.html',

  styleUrl:
    './listings.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class ListingsComponent
  implements OnInit {

  private readonly listingsService =
    inject(
      AdministrationListingsService
    );

  protected readonly listings =
    signal<AdministrationListing[]>([]);

  protected readonly summary =
    signal<AdministrationListingSummary>({
      totalListings: 0,
      activeListings: 0,
      featuredListings: 0,
      underContractListings: 0,
      soldListings: 0,
      inactiveListings: 0
    });

  protected readonly loading =
    signal(true);

  protected readonly error =
    signal<string | null>(null);

  protected readonly searchTerm =
    signal('');

  protected readonly statusFilter =
    signal<ListingStatusFilter>(
      'all'
    );

  protected readonly filteredListings =
    computed(() => {
      const search =
        this.searchTerm()
          .trim()
          .toLowerCase();

      const selectedStatus =
        this.statusFilter();

      return this.listings().filter(
        listing => {
          const matchesStatus =
            selectedStatus === 'all' ||
            listing.status ===
              selectedStatus;

          if (!matchesStatus) {
            return false;
          }

          if (!search) {
            return true;
          }

          const address =
            this.formatAddress(
              listing
            );

          return [
            listing.title,
            listing.uid,
            listing.sellerUid,
            listing.propertyType,
            listing.status,
            address
          ].some(
            value =>
              value
                .toLowerCase()
                .includes(search)
          );
        }
      );
    });

  ngOnInit(): void {
    void this.loadListings();
  }

  protected onSearch(
    event: Event
  ): void {
    const input =
      event.target as HTMLInputElement;

    this.searchTerm.set(
      input.value
    );
  }

  protected onStatusFilter(
    status: ListingStatusFilter
  ): void {
    this.statusFilter.set(status);
  }

  protected refresh(): void {
    void this.loadListings();
  }

  protected formatAddress(
    listing: AdministrationListing
  ): string {
    const address =
      listing.address;

    const cityStatePostal = [
      address.city,
      address.state
    ]
      .filter(Boolean)
      .join(', ');

    return [
      address.addressLine1,
      [
        cityStatePostal,
        address.postalCode
      ]
        .filter(Boolean)
        .join(' ')
    ]
      .filter(Boolean)
      .join(', ');
  }

  protected formatStatus(
    status:
      AdministrationListingStatus
  ): string {
    return status
      .replace(
        /_/g,
        ' '
      );
  }

  private async loadListings():
    Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const result =
        await this.listingsService
          .getListings();

      this.listings.set(
        result.listings
      );

      this.summary.set(
        result.summary
      );

    } catch (error: unknown) {
      this.error.set(
        error instanceof Error
          ? error.message
          : 'NavStreet listings could not be loaded.'
      );

    } finally {
      this.loading.set(false);
    }
  }
}