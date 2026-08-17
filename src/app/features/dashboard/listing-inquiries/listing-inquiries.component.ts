import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  DatePipe
} from '@angular/common';

import {
  ActivatedRoute,
  RouterLink
} from '@angular/router';

import {
  ListingInquiry
} from '../../../core/domains/inquiries/models/listing-inquiry.model';

import {
  ListingInquiryService
} from '../../../core/domains/inquiries/services/listing-inquiry.service';

@Component({
  selector: 'app-listing-inquiries',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink
  ],
  templateUrl:
    './listing-inquiries.component.html',
  styleUrl:
    './listing-inquiries.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class ListingInquiriesComponent
implements OnInit {
  private readonly route =
    inject(ActivatedRoute);

  private readonly listingInquiryService =
    inject(ListingInquiryService);

  protected readonly listingUid =
    this.route.snapshot.paramMap.get(
      'listingUid'
    ) ?? '';

  protected readonly inquiries =
    signal<ListingInquiry[]>([]);

  protected readonly unreadCount =
    signal(0);

  protected readonly selectedInquiryUid =
    signal('');

  protected readonly isLoading =
    signal(true);

  protected readonly markingReadInquiryUid =
    signal('');

  protected readonly loadError =
    signal('');

  protected readonly updateError =
    signal('');

  async ngOnInit(): Promise<void> {
    if (!this.listingUid) {
      this.loadError.set(
        'The selected listing could not be identified.'
      );

      this.isLoading.set(false);
      return;
    }

    await this.loadInquiries();
  }

  protected async selectInquiry(
    inquiry: ListingInquiry
  ): Promise<void> {
    this.selectedInquiryUid.set(
      inquiry.inquiryUid
    );

    this.updateError.set('');

    if (
      inquiry.isRead ||
      this.markingReadInquiryUid()
    ) {
      return;
    }

    this.markingReadInquiryUid.set(
      inquiry.inquiryUid
    );

    try {
      const response =
        await this.listingInquiryService
          .markListingInquiryRead(
            inquiry.inquiryUid
          );

      this.inquiries.update(
        currentInquiries =>
          currentInquiries.map(
            currentInquiry =>
              currentInquiry.inquiryUid ===
              inquiry.inquiryUid
                ? {
                  ...currentInquiry,
                  status:
                    response.status,
                  isRead:
                    response.isRead,
                  readAt:
                    response.readAt,
                  updatedAt:
                    response.readAt
                }
                : currentInquiry
          )
      );

      this.unreadCount.update(
        currentCount =>
          Math.max(
            0,
            currentCount - 1
          )
      );
    } catch (error: unknown) {
      console.error(
        'Unable to mark listing inquiry as read:',
        error
      );

      this.updateError.set(
        this.getErrorMessage(
          error,
          'We could not mark this inquiry as read. Please try again.'
        )
      );
    } finally {
      this.markingReadInquiryUid.set('');
    }
  }

  protected closeInquiry(): void {
    this.selectedInquiryUid.set('');
    this.updateError.set('');
  }

  protected async retryLoading():
    Promise<void> {
    await this.loadInquiries();
  }

  protected get selectedInquiry():
    ListingInquiry | null {
    const selectedUid =
      this.selectedInquiryUid();

    if (!selectedUid) {
      return null;
    }

    return (
      this.inquiries().find(
        inquiry =>
          inquiry.inquiryUid ===
          selectedUid
      ) ?? null
    );
  }

  protected createTelephoneLink(
    phone: string
  ): string {
    const digits =
      phone.replace(/\D/g, '');

    return `tel:${digits}`;
  }

  protected createEmailLink(
    email: string,
    inquiry: ListingInquiry
  ): string {
    const subject =
      `NavStreet inquiry ${inquiry.inquiryReferenceNumber}`;

    return (
      `mailto:${encodeURIComponent(email)}` +
      `?subject=${encodeURIComponent(subject)}`
    );
  }

  private async loadInquiries():
    Promise<void> {
    this.isLoading.set(true);
    this.loadError.set('');
    this.updateError.set('');
    this.selectedInquiryUid.set('');

    try {
      const response =
        await this.listingInquiryService
          .getListingInquiries(
            this.listingUid
          );

      this.inquiries.set(
        response.inquiries
      );

      this.unreadCount.set(
        response.unreadCount
      );
    } catch (error: unknown) {
      console.error(
        'Unable to load listing inquiries:',
        error
      );

      this.loadError.set(
        this.getErrorMessage(
          error,
          'We could not load buyer inquiries. Please try again.'
        )
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  private getErrorMessage(
    error: unknown,
    fallbackMessage: string
  ): string {
    if (
      error !== null &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message ===
        'string'
    ) {
      const message =
        error.message.trim();

      if (message) {
        return message;
      }
    }

    return fallbackMessage;
  }
}