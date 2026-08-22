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
  ListingInquiryService
} from '../../../../core/domains/inquiries/services/listing-inquiry.service';

import {
  ListingInquiryActivity
} from '../../../../core/domains/inquiries/models/listing-inquiry.model';

import {
  ActivityItem
} from '../../components/activity-card/activity-card.component';

@Component({
  selector: 'app-dashboard-activity',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink
  ],
  templateUrl:
    './dashboard-activity.component.html',
  styleUrl:
    './dashboard-activity.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class DashboardActivityComponent
  implements OnInit {

  private readonly inquiryService =
    inject(ListingInquiryService);

  protected readonly activities =
    signal<ActivityItem[]>([]);

  protected readonly isLoading =
    signal(true);

  protected readonly loadError =
    signal('');

  protected readonly receivedActivityCount =
    computed(() =>
      this.activities().filter(
        activity =>
          activity.activityUid.startsWith(
            'received-'
          )
      ).length
    );

  protected readonly sentActivityCount =
    computed(() =>
      this.activities().filter(
        activity =>
          activity.activityUid.startsWith(
            'sent-'
          ) ||
          activity.activityUid.startsWith(
            'viewed-'
          )
      ).length
    );

  async ngOnInit(): Promise<void> {
    await this.loadActivity();
  }

  protected reloadActivity(): void {
    void this.loadActivity();
  }

  private async loadActivity():
    Promise<void> {

    this.isLoading.set(true);
    this.loadError.set('');

    try {
      const response =
        await this.inquiryService
          .getUserInquiryActivity();

      const activities =
        response.activities
          .map(activity =>
            this.mapInquiryActivity(
              activity
            )
          )
          .sort(
            (
              firstActivity,
              secondActivity
            ) =>
              secondActivity.timestamp
                .getTime() -
              firstActivity.timestamp
                .getTime()
          );

      this.activities.set(activities);

    } catch (error: unknown) {
      console.error(
        'Unable to load account activity:',
        error
      );

      this.activities.set([]);

      this.loadError.set(
        'Your recent account activity could not ' +
        'be loaded. Please try again.'
      );

    } finally {
      this.isLoading.set(false);
    }
  }

  private mapInquiryActivity(
    activity: ListingInquiryActivity
  ): ActivityItem {

    if (
      activity.perspective ===
      'received'
    ) {
      return {
        activityUid:
          `received-${activity.inquiryUid}`,

        title:
          'New buyer inquiry',

        description:
          `${activity.buyerName} contacted you ` +
          `about ${activity.propertyAddress}. ` +
          `Reference: ` +
          activity.inquiryReferenceNumber,

        timestamp:
          this.createActivityDate(
            activity.createdAt
          ),

        icon:
          'fa-solid fa-message',

        statusLabel:
          activity.status === 'read'
            ? 'Read'
            : 'New',

        route: [
          '/sell/listings',
          activity.listingUid,
          'manage',
          'inquiries'
        ]
      };
    }

    const sellerViewedInquiry =
      activity.status === 'read' &&
      Boolean(activity.readAt);

    return {
      activityUid:
        sellerViewedInquiry
          ? `viewed-${activity.inquiryUid}`
          : `sent-${activity.inquiryUid}`,

      title:
        sellerViewedInquiry
          ? 'Inquiry viewed by seller'
          : 'Inquiry sent',

      description:
        `You contacted the seller of ` +
        `${activity.propertyAddress}. ` +
        `Reference: ` +
        activity.inquiryReferenceNumber,

      timestamp:
        this.createActivityDate(
          sellerViewedInquiry
            ? activity.readAt
            : activity.createdAt
        ),

      icon:
        sellerViewedInquiry
          ? 'fa-solid fa-eye'
          : 'fa-solid fa-paper-plane',

      statusLabel:
        sellerViewedInquiry
          ? 'Viewed'
          : 'Sent',

      route: [
        '/listings',
        activity.listingUid
      ]
    };
  }

  private createActivityDate(
    value: string | null
  ): Date {

    if (!value) {
      return new Date(0);
    }

    const date =
      new Date(value);

    return Number.isNaN(
      date.getTime()
    )
      ? new Date(0)
      : date;
  }
}