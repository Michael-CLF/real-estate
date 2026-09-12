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
  JsonPipe
} from '@angular/common';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import {
  ListingDeletionService
} from '../../../../core/domains/listings/services/listing-deletion.service';

import {
  AdministrationListingRecordType,
  AdministrationListingsService,
  GetAdministrationListingDetailsResult
} from '../../data-access/administration-listings.service';


@Component({
  selector:
    'app-administration-listing-details',

  standalone:
    true,

  imports: [
    CurrencyPipe,
    JsonPipe,
    RouterLink
  ],

  templateUrl:
    './listing-details.component.html',

  styleUrl:
    './listing-details.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class ListingDetailsComponent
  implements OnInit {

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly listingsService =
    inject(
      AdministrationListingsService
    );

  private readonly deletionService =
    inject(ListingDeletionService);


  protected readonly details =
    signal<
      GetAdministrationListingDetailsResult |
      null
    >(null);

  protected readonly loading =
    signal(true);

  protected readonly deleting =
    signal(false);

  protected readonly error =
    signal('');

  protected readonly deletionError =
    signal('');


  private readonly listingUid =
    this.route.snapshot.paramMap.get(
      'listingUid'
    ) ?? '';

  private readonly recordType =
    this.readRecordType(
      this.route.snapshot.paramMap.get(
        'recordType'
      )
    );


  protected readonly address =
    computed(
      () => {
        const details =
          this.details();

        if (!details) {
          return 'Address not provided';
        }

        const record =
          details.publishedListing ??
          details.sourceDraft;

        if (!record) {
          return 'Address not provided';
        }

        const nestedAddress =
          this.readRecord(
            record['address']
          );

        const addressLine1 =
          this.readString(
            record['addressLine1'] ??
            nestedAddress[
              'addressLine1'
            ]
          );

        const addressLine2 =
          this.readString(
            record['addressLine2'] ??
            nestedAddress[
              'addressLine2'
            ]
          );

        const city =
          this.readString(
            record['city'] ??
            nestedAddress['city']
          );

        const state =
          this.readString(
            record['state'] ??
            nestedAddress['state'] ??
            nestedAddress[
              'stateAbbreviation'
            ]
          );

        const postalCode =
          this.readString(
            record['zipCode'] ??
            nestedAddress['zipCode'] ??
            nestedAddress['postalCode']
          );

        const streetAddress = [
          addressLine1,
          addressLine2
        ]
          .filter(Boolean)
          .join(', ');

        const cityStatePostal = [
          city,
          state,
          postalCode
        ]
          .filter(Boolean)
          .join(' ');

        return [
          streetAddress,
          cityStatePostal
        ]
          .filter(Boolean)
          .join(', ') ||
          'Address not provided';
      }
    );


  protected readonly status =
    computed(
      () => {
        const details =
          this.details();

        if (!details) {
          return '';
        }

        if (
          details.recordType ===
          'published'
        ) {
          return this.readString(
            details.publishedListing?.[
              'status'
            ]
          );
        }

        return this.readString(
          this.readRecord(
            details.sourceDraft?.[
              'publication'
            ]
          )['status']
        ) || 'draft';
      }
    );


  protected readonly listPrice =
    computed(
      () => {
        const details =
          this.details();

        if (!details) {
          return 0;
        }

        if (
          details.publishedListing
        ) {
          return this.readNumber(
            details.publishedListing[
              'listPrice'
            ] ??
            details.publishedListing[
              'price'
            ]
          );
        }

        const pricing =
          this.readRecord(
            details.sourceDraft?.[
              'pricing'
            ]
          );

        return this.readNumber(
          pricing['listPrice']
        );
      }
    );


  async ngOnInit(): Promise<void> {
    await this.loadDetails();
  }


  protected propertyValue(
    fieldName: string
  ): unknown {
    const details =
      this.details();

    if (!details) {
      return null;
    }

    if (
      details.publishedListing &&
      details.publishedListing[
        fieldName
      ] !== undefined
    ) {
      return details
        .publishedListing[
          fieldName
        ];
    }

    const propertyDetails =
      this.readRecord(
        details.sourceDraft?.[
          'propertyDetails'
        ]
      );

    return propertyDetails[fieldName] ??
      null;
  }


  protected workflowValue(
    sectionName: string,
    fieldName: string
  ): unknown {
    const details =
      this.details();

    const sourceDraft =
      details?.sourceDraft;

    if (!sourceDraft) {
      return null;
    }

    return this.readRecord(
      sourceDraft[sectionName]
    )[fieldName] ?? null;
  }


  protected recordValue(
    fieldName: string
  ): unknown {
    const details =
      this.details();

    const record =
      details?.publishedListing ??
      details?.sourceDraft;

    return record?.[fieldName] ??
      null;
  }


  protected formatValue(
    value: unknown
  ): string {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return 'Not provided';
    }

    if (typeof value === 'boolean') {
      return value
        ? 'Yes'
        : 'No';
    }

    if (Array.isArray(value)) {
      return value.length > 0
        ? value.join(', ')
        : 'None';
    }

    if (
      typeof value === 'number'
    ) {
      return new Intl.NumberFormat(
        'en-US'
      ).format(value);
    }

    if (
      typeof value === 'string'
    ) {
      return this.formatStatus(value);
    }

    return JSON.stringify(
      value
    );
  }


  protected formatDate(
    value: unknown
  ): string {
    if (
      typeof value !== 'string' ||
      !value.trim()
    ) {
      return 'Not available';
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return new Intl.DateTimeFormat(
      'en-US',
      {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    ).format(date);
  }


  protected formatStatus(
    value: string
  ): string {
    return value
      .replace(
        /_/g,
        ' '
      )
      .replace(
        /-/g,
        ' '
      );
  }


  protected async deleteListing():
    Promise<void> {
    const details =
      this.details();

    if (
      !details ||
      this.deleting()
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Permanently delete ${this.address()}?\n\n` +
        'This will also delete its drafts, photos, disclosures, saved-property references, inquiries, showings, offers, contracts, documents, marketing records, and transaction timeline.\n\n' +
        'This action cannot be undone.'
      );

    if (!confirmed) {
      return;
    }

    this.deleting.set(true);
    this.deletionError.set('');

    try {
      await this.deletionService
        .deleteListing(
          details.requestedListingUid,
          details.recordType
        );

      await this.router.navigate([
        '/administration',
        'listings'
      ]);
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

      this.deleting.set(false);
    }
  }


  private async loadDetails():
    Promise<void> {
    if (
      !this.listingUid ||
      !this.recordType
    ) {
      this.loading.set(false);

      this.error.set(
        'The listing review link is invalid.'
      );

      return;
    }

    this.loading.set(true);
    this.error.set('');

    try {
      const details =
        await this.listingsService
          .getListingDetails(
            this.listingUid,
            this.recordType
          );

      this.details.set(details);
    } catch (error: unknown) {
      console.error(
        'Unable to load administrator listing details:',
        error
      );

      this.error.set(
        error instanceof Error &&
        error.message
          ? error.message
          : 'The listing details could not be loaded.'
      );
    } finally {
      this.loading.set(false);
    }
  }


  private readRecordType(
    value: string | null
  ): AdministrationListingRecordType |
    null {
    return (
      value === 'draft' ||
      value === 'published'
    )
      ? value
      : null;
  }


  private readRecord(
    value: unknown
  ): Record<string, unknown> {
    return (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value)
    )
      ? value as
        Record<string, unknown>
      : {};
  }


  private readString(
    value: unknown
  ): string {
    return typeof value === 'string'
      ? value.trim()
      : '';
  }


  private readNumber(
    value: unknown
  ): number {
    return (
      typeof value === 'number' &&
      Number.isFinite(value)
    )
      ? value
      : 0;
  }
}