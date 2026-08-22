import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  DatePipe
} from '@angular/common';

import {
  RouterLink
} from '@angular/router';

import {
  ListingInquiryActivity
} from '../../../../core/domains/inquiries/models/listing-inquiry.model';

import {
  ListingInquiryService
} from '../../../../core/domains/inquiries/services/listing-inquiry.service';

type InquiryFilter =
  | 'all'
  | 'received'
  | 'sent';

@Component({
  selector: 'app-dashboard-inquiries',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink
  ],
  templateUrl:
    './dashboard-inquiries.component.html',
  styleUrl:
    './dashboard-inquiries.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class DashboardInquiriesComponent
  implements OnInit {

  private readonly inquiryService =
    inject(ListingInquiryService);

  protected readonly inquiries =
    signal<ListingInquiryActivity[]>([]);

  protected readonly selectedFilter =
    signal<InquiryFilter>('all');

  protected readonly isLoading =
    signal(true);

  protected readonly loadError =
    signal('');

  protected readonly receivedCount =
    computed(
      () =>
        this.inquiries().filter(
          inquiry =>
            inquiry.perspective ===
            'received'
        ).length
    );

  protected readonly sentCount =
    computed(
      () =>
        this.inquiries().filter(
          inquiry =>
            inquiry.perspective ===
            'sent'
        ).length
    );

  protected readonly unreadCount =
    computed(
      () =>
        this.inquiries().filter(
          inquiry =>
            inquiry.perspective ===
              'received' &&
            inquiry.status === 'new'
        ).length
    );

  protected readonly filteredInquiries =
    computed(() => {
      const selectedFilter =
        this.selectedFilter();

      if (selectedFilter === 'all') {
        return this.inquiries();
      }

      return this.inquiries().filter(
        inquiry =>
          inquiry.perspective ===
          selectedFilter
      );
    });

  async ngOnInit(): Promise<void> {
    await this.loadInquiries();
  }

  protected selectFilter(
    filter: InquiryFilter
  ): void {
    this.selectedFilter.set(filter);
  }

  protected inquiryRoute(
    inquiry: ListingInquiryActivity
  ): string[] {
    if (
      inquiry.perspective === 'received'
    ) {
      return [
        '/sell/listings',
        inquiry.listingUid,
        'manage',
        'inquiries'
      ];
    }

    return [
      '/listings',
      inquiry.listingUid
    ];
  }

  protected inquiryDate(
    inquiry: ListingInquiryActivity
  ): Date {
    const date =
      new Date(inquiry.createdAt);

    return Number.isNaN(date.getTime())
      ? new Date(0)
      : date;
  }

  protected async retryLoading():
    Promise<void> {
    await this.loadInquiries();
  }

  private async loadInquiries():
    Promise<void> {
    this.isLoading.set(true);
    this.loadError.set('');

    try {
      const response =
        await this.inquiryService
          .getUserInquiryActivity();

      this.inquiries.set(
        [...response.activities].sort(
          (
            firstInquiry,
            secondInquiry
          ) =>
            this.inquiryDate(
              secondInquiry
            ).getTime() -
            this.inquiryDate(
              firstInquiry
            ).getTime()
        )
      );
    } catch (error: unknown) {
      console.error(
        'Unable to load account inquiries:',
        error
      );

      this.inquiries.set([]);

      this.loadError.set(
        'Your inquiries could not be loaded. ' +
        'Please try again.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}