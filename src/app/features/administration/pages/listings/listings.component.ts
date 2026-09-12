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
  DatePipe
} from '@angular/common';

import {
  RouterLink
} from '@angular/router';

import {
  ListingDeletionService
} from '../../../../core/domains/listings/services/listing-deletion.service';

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
    RouterLink
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

  private readonly deletionService =
    inject(ListingDeletionService);


  protected readonly listings =
    signal<AdministrationListing[]>([]);

  protected readonly summary =
    signal<AdministrationListingSummary>({
      totalListings: 0,
      draftListings: 0,
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

  protected readonly deletionError =
    signal('');

  protected readonly deletingListingKey =
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
            selectedStatus === 'all'
              ? true
              : selectedStatus === 'draft'
                ? listing.recordType === 'draft'
                : selectedStatus === 'published'
                  ? listing.recordType ===
                    'published'
                  : listing.recordType ===
                      'published' &&
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
            listing.recordType,
            listing.propertyType,
            listing.status,
            listing.publicationStatus ?? '',
            listing.paymentStatus ?? '',
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
    this.deletionError.set('');

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
    status: string | null
  ): string {
    if (!status) {
      return 'Not available';
    }

    return status
      .replace(
        /_/g,
        ' '
      )
      .replace(
        /-/g,
        ' '
      );
  }


  protected abbreviateUid(
    uid: string
  ): string {
    if (uid.length <= 14) {
      return uid;
    }

    return (
      `${uid.slice(0, 8)}` +
      `…${uid.slice(-4)}`
    );
  }


  protected getListingKey(
    listing: AdministrationListing
  ): string {
    return [
      listing.recordType,
      listing.uid
    ].join(':');
  }


  protected async deleteListing(
    listing: AdministrationListing
  ): Promise<void> {
    if (
      this.deletingListingKey()
    ) {
      return;
    }

    const address =
      this.formatAddress(listing) ||
      listing.title;

    const recordLabel =
      listing.recordType === 'draft'
        ? 'listing draft'
        : 'published listing';

    const confirmed =
      window.confirm(
        `Permanently delete this ${recordLabel}?\n\n` +
        `${address}\n\n` +
        'NavStreet will also delete all related photos, disclosures, saved-property references, inquiries, showings, offers, contracts, documents, marketing records, and transaction information.\n\n' +
        'This action cannot be undone.'
      );

    if (!confirmed) {
      return;
    }

    const listingKey =
      this.getListingKey(listing);

    this.deletingListingKey.set(
      listingKey
    );

    this.deletionError.set('');

    try {
      await this.deletionService
        .deleteListing(
          listing.uid,
          listing.recordType
        );

      await this.loadListings();
    } catch (error: unknown) {
      console.error(
        'Administrator listing deletion failed:',
        error
      );

      this.deletionError.set(
        error instanceof Error &&
        error.message
          ? error.message
          : 'The listing could not be deleted.'
      );
    } finally {
      this.deletingListingKey.set(
        null
      );
    }
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