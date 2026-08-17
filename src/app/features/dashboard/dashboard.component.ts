import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  SavedPropertySummary
} from './models/dashboard-state.model';

import {
  Router,
  RouterLink
} from '@angular/router';

import {
  AccountListingsComponent
} from './components/account-listings/account-listings.component';

import {
  SavedHomesComponent
} from './components/saved-homes/saved-homes.component';

import {
  DashboardStateService
} from './services/dashboard-state.service';

import {
  Listing
} from '../../core/domains/listings/models/listing.model';

import {
  ListingInquiryService
} from '../../core/domains/inquiries/services/listing-inquiry.service';

import {
  WelcomeComponent
} from './components/welcome/welcome.component';

import {
  ActivityCardComponent,
  ActivityItem
} from './components/activity-card/activity-card.component';

type ListingTab =
  | 'draft'
  | 'active'
  | 'under-contract'
  | 'sold';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    AccountListingsComponent,
    ActivityCardComponent,
    SavedHomesComponent,
    WelcomeComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class DashboardComponent
implements OnInit {
  protected readonly dashboardState =
    inject(DashboardStateService);

  private readonly router =
    inject(Router);

  private readonly listingInquiryService =
    inject(ListingInquiryService);

  protected readonly selectedListingTab =
    signal<ListingTab>('active');

  protected readonly recentActivities =
    signal<ActivityItem[]>([]);

  protected readonly removingSavedListingUid =
    signal<string | null>(null);

  protected readonly savedPropertyError =
    signal('');

  async ngOnInit(): Promise<void> {
    await this.dashboardState.load();

    /*
     * Prefer Active when active listings exist.
     * Otherwise show Draft when drafts exist.
     */
    if (
      this.dashboardState.state()
        .activeListings.length > 0
    ) {
      this.selectedListingTab.set(
        'active'
      );
    } else if (
      this.dashboardState.state()
        .draftListings.length > 0
    ) {
      this.selectedListingTab.set(
        'draft'
      );
    }

    await this.loadRecentInquiryActivity();
  }

  protected selectListingTab(
    tab: ListingTab
  ): void {
    this.selectedListingTab.set(tab);
  }

  protected async manageListing(
    listing: Listing
  ): Promise<void> {
    if (listing.status === 'draft') {
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

    console.log(
      'Manage active listing:',
      listing
    );
  }

  protected async removeSavedProperty(
    property: SavedPropertySummary
  ): Promise<void> {
    if (this.removingSavedListingUid()) {
      return;
    }

    this.savedPropertyError.set('');

    this.removingSavedListingUid.set(
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

      this.savedPropertyError.set(
        'We could not remove this property. Please try again.'
      );
    } finally {
      this.removingSavedListingUid.set(
        null
      );
    }
  }

  private async loadRecentInquiryActivity():
    Promise<void> {
    try {
      const response =
        await this.listingInquiryService
          .getUserInquiryActivity();

      const activities =
        response.activities
          .map(
            activity =>
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

      this.recentActivities.set(
        activities
      );
    } catch (error: unknown) {
      /*
       * Inquiry activity must not prevent the rest
       * of the universal dashboard from loading.
       */
      console.error(
        'Unable to load recent inquiry activity:',
        error
      );

      this.recentActivities.set([]);
    }
  }

  private mapInquiryActivity(
    activity: {
      inquiryUid: string;
      inquiryReferenceNumber: string;
      listingUid: string;
      perspective:
        | 'sent'
        | 'received';
      status:
        | 'new'
        | 'read';
      buyerName: string;
      propertyAddress: string;
      createdAt: string;
      readAt: string | null;
    }
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
          `${activity.buyerName} contacted you about ` +
          `${activity.propertyAddress}. ` +
          `Reference: ${activity.inquiryReferenceNumber}`,

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
        `Reference: ${activity.inquiryReferenceNumber}`,

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