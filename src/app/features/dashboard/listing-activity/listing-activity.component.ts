import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  CurrencyPipe
} from '@angular/common';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import {
  AuthService
} from '../../../core/authentication/services/auth.service';

import {
  ListingActivityItem,
  ListingActivitySummary,
  ListingActivityType
} from '../../../core/domains/listings/models/listing-activity.model';

import {
  Listing
} from '../../../core/domains/listings/models/listing.model';

import {
  ListingActivityService
} from '../../../core/domains/listings/services/listing-activity.service';

import {
  ListingService
} from '../../../core/domains/listings/services/listing.service';

@Component({
  selector: 'app-listing-activity',
  standalone: true,
  imports: [
    CurrencyPipe,
    RouterLink
  ],
  templateUrl: './listing-activity.component.html',
  styleUrl: './listing-activity.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListingActivityComponent implements OnInit {
  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly authService =
    inject(AuthService);

  private readonly listingService =
    inject(ListingService);

  private readonly listingActivityService =
    inject(ListingActivityService);

  protected readonly listing =
    signal<Listing | null>(null);

  protected readonly activities =
    signal<ListingActivityItem[]>([]);

  protected readonly summary =
    signal<ListingActivitySummary>({
      views: 0,
      saves: 0,
      inquiries: 0,
      unreadInquiries: 0,
      showingRequests: 0,
      pendingShowingRequests: 0
    });

  protected readonly isLoading =
    signal(true);

  protected readonly loadError =
    signal('');

  protected readonly listingUid =
    this.route.snapshot.paramMap.get(
      'listingUid'
    ) ?? '';

  async ngOnInit(): Promise<void> {
    if (!this.listingUid) {
      this.loadError.set(
        'The selected listing could not be identified.'
      );

      this.isLoading.set(false);
      return;
    }

    const currentUserUid =
      this.authService.currentUserUid;

    if (!currentUserUid) {
      this.loadError.set(
        'You must be signed in to review listing activity.'
      );

      this.isLoading.set(false);
      return;
    }

    try {
      const listing =
        await this.listingService
          .getPublishedListing(
            this.listingUid
          );

      if (!listing) {
        this.loadError.set(
          'The selected listing could not be found.'
        );

        return;
      }

      if (
        listing.sellerUid !==
        currentUserUid
      ) {
        this.loadError.set(
          'You do not have permission to review this listing activity.'
        );

        return;
      }

      this.listing.set(
        listing
      );

      const response =
        await this.listingActivityService
          .getListingActivity(
            this.listingUid
          );

      this.activities.set(
        response.activities
      );

      this.summary.set(
        response.summary
      );
    } catch (error: unknown) {
      console.error(
        'Unable to load listing activity:',
        error
      );

      this.loadError.set(
        'We could not load this listing activity. Please return to listing management and try again.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async openActivity(
    activity: ListingActivityItem
  ): Promise<void> {
    if (
      activity.activityType ===
      'inquiry_received'
    ) {
      await this.router.navigate([
        '/sell/listings',
        this.listingUid,
        'manage',
        'inquiries'
      ]);

      return;
    }

    if (
      activity.showingRequestUid
    ) {
      await this.router.navigate([
        '/sell/listings',
        this.listingUid,
        'showing-requests',
        activity.showingRequestUid
      ]);
    }
  }

  protected isActionable(
    activity: ListingActivityItem
  ): boolean {
    return (
      activity.activityType ===
        'inquiry_received' ||
      Boolean(
        activity.showingRequestUid
      )
    );
  }

  protected activityIcon(
    activityType: ListingActivityType
  ): string {
    switch (activityType) {
      case 'listing_published':
        return 'fa-solid fa-house-circle-check';

      case 'price_change':
        return 'fa-solid fa-dollar-sign';

      case 'inquiry_received':
        return 'fa-solid fa-message';

      case 'showing_requested':
        return 'fa-regular fa-calendar-plus';

      case 'showing_confirmed':
        return 'fa-regular fa-calendar-check';

      case 'showing_alternate_proposed':
        return 'fa-solid fa-calendar-day';

      case 'showing_declined':
        return 'fa-regular fa-calendar-xmark';

      case 'showing_cancelled':
        return 'fa-solid fa-ban';

      case 'showing_completed':
        return 'fa-solid fa-circle-check';
    }
  }

  protected activityClass(
    activityType: ListingActivityType
  ): string {
    return `activity-entry--${activityType}`;
  }

  protected formatDateTime(
    value: string
  ): string {
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
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }
    ).format(date);
  }
}