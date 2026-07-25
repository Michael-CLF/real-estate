import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import {
  PropertySummary,
  PropertySummaryCardComponent
} from '../property-summary-card/property-summary-card.component';

import {
  ListingMetric,
  ListingMetricsCardComponent
} from '../dashboard/listing-metrics-card/listing-metrics-card.component';

import {
  NextStep,
  NextStepsCardComponent
} from '../dashboard/next-steps-card/next-steps-card.component';

import {
  UpcomingShowing,
  UpcomingShowingCardComponent
} from '../dashboard/upcoming-showing-card/upcoming-showing-card.component';

import {
  LatestOffer,
  LatestOfferCardComponent
} from '../dashboard/latest-offer-card/latest-offer-card.component';

import {
  ActivityItem,
  ActivityCardComponent
} from '../dashboard/activity-card/activity-card.component';

import { SellerDashboardService } from '../dashboard/services/seller-dashboard.service';
import { DashboardViewModel } from '../../../models/dashboard-view.model';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [
    PropertySummaryCardComponent,
    ListingMetricsCardComponent,
    NextStepsCardComponent,
    UpcomingShowingCardComponent,
    LatestOfferCardComponent,
    ActivityCardComponent
  ],
  templateUrl: './seller-dashboard.component.html',
  styleUrl: './seller-dashboard.component.scss'
})
export class SellerDashboardComponent implements OnInit {

  private readonly dashboardService = inject(SellerDashboardService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  dashboard: DashboardViewModel | null = null;

  propertySummary: PropertySummary | null = null;
  listingMetrics: ListingMetric[] = [];
  nextSteps: NextStep[] = [];
  upcomingShowing: UpcomingShowing | null = null;
  latestOffer: LatestOffer | null = null;
  recentActivity: ActivityItem[] = [];

  loading = true;
  errorMessage = '';

 async ngOnInit(): Promise<void> {
  try {
    this.dashboard = await this.dashboardService.getDashboard();

    console.log('Dashboard data:', this.dashboard);

    this.buildDashboardDisplayData();
  } catch (error) {
    console.error('Unable to load seller dashboard:', error);
    this.errorMessage = 'The seller dashboard could not be loaded.';
  } finally {
    this.loading = false;
    this.changeDetector.detectChanges();
  }
}

  private buildDashboardDisplayData(): void {
    if (!this.dashboard) {
      return;
    }

    this.propertySummary = this.mapProperty(this.dashboard.property);
    this.listingMetrics = this.mapMetrics(this.dashboard);
    this.nextSteps = this.buildNextSteps(this.dashboard.property);
    this.upcomingShowing = this.mapShowing(this.dashboard.nextShowing);
    this.latestOffer = this.mapOffer(this.dashboard.latestOffer);
    this.recentActivity = this.mapActivity(this.dashboard.activity);
  }

  private mapProperty(property: unknown): PropertySummary | null {
    if (!property) {
      return null;
    }

    const listing = this.asRecord(property);

    return {
      addressLine1: this.readString(
        listing,
        ['addressLine1', 'streetAddress', 'address'],
        'Address not provided'
      ),
      city: this.readString(listing, ['city']),
      state: this.readString(listing, ['state']),
      zipCode: this.readString(listing, ['zipCode', 'zip']),
      listPrice: this.readNumber(
        listing,
        ['listPrice', 'price', 'listingPrice']
      ),
      status: this.readString(
        listing,
        ['status', 'listingStatus'],
        'Draft'
      ),
      daysOnMarket: this.readNumber(
        listing,
        ['daysOnMarket', 'marketDays']
      ),
      imageUrl: this.readNullableString(
        listing,
        ['imageUrl', 'featuredImageUrl', 'primaryImageUrl']
      )
    };
  }

  private mapMetrics(dashboard: DashboardViewModel): ListingMetric[] {
    const metrics = this.asRecord(dashboard.metrics);

    return [
      {
        label: 'Listing Views',
        value: this.readNumber(metrics, ['listingViews', 'views']),
        helperText: 'Total property page views'
      },
      {
        label: 'Favorites',
        value: this.readNumber(metrics, ['favorites']),
        helperText: 'Buyers who saved this listing'
      },
      {
        label: 'Showing Requests',
        value: this.readNumber(
          metrics,
          ['showingRequests', 'showings']
        ),
        helperText: 'Requested property showings'
      },
      {
        label: 'Active Offers',
        value: this.readNumber(
          metrics,
          ['activeOffers', 'offers']
        ),
        helperText: 'Offers awaiting a decision'
      }
    ];
  }

  private buildNextSteps(property: unknown): NextStep[] {
    if (!property) {
      return [
        {
          title: 'Create your property listing',
          description:
            'Add the property details needed to begin marketing your home.',
          action: 'Create Listing',
          required: true
        }
      ];
    }

    const listing = this.asRecord(property);
    const status = this.readString(
      listing,
      ['status', 'listingStatus']
    ).toLowerCase();

    const imageUrl = this.readNullableString(
      listing,
      ['imageUrl', 'featuredImageUrl', 'primaryImageUrl']
    );

    const steps: NextStep[] = [];

    if (!imageUrl) {
      steps.push({
        title: 'Add property photos',
        description:
          'Listings with clear, professional photos generally receive more buyer attention.',
        action: 'Upload Photos',
        required: true
      });
    }

    if (status === 'draft' || status === 'incomplete') {
      steps.push({
        title: 'Complete your listing',
        description:
          'Review the property information and complete any missing listing details.',
        action: 'Manage Listing',
        required: true
      });
    }

    if (status !== 'active' && status !== 'published') {
      steps.push({
        title: 'Publish your listing',
        description:
          'Make the property visible to buyers after confirming that the information is accurate.',
        action: 'Review Listing',
        required: false
      });
    }

    if (steps.length === 0) {
      steps.push({
        title: 'Review listing performance',
        description:
          'Monitor buyer activity, showing requests, and offers from your dashboard.',
        action: 'View Performance',
        required: false
      });
    }

    return steps;
  }

  private mapShowing(showing: unknown): UpcomingShowing | null {
    if (!showing) {
      return null;
    }

    const item = this.asRecord(showing);

    return {
      buyerName: this.readString(
        item,
        ['buyerName', 'buyerDisplayName'],
        'Prospective buyer'
      ),
      date: this.readDate(
        item,
        ['date', 'showingDate', 'scheduledAt']
      ),
      agentName: this.readString(
        item,
        ['agentName', 'buyerAgentName'],
        'No agent listed'
      )
    };
  }

  private mapOffer(offer: unknown): LatestOffer | null {
    if (!offer) {
      return null;
    }

    const item = this.asRecord(offer);

    return {
      buyerName: this.readString(
        item,
        ['buyerName', 'buyerDisplayName'],
        'Prospective buyer'
      ),
      amount: this.readNumber(
        item,
        ['amount', 'offerAmount', 'purchasePrice']
      ),
      submittedDate: this.readDate(
        item,
        ['submittedDate', 'submittedAt', 'createdAt']
      ),
      financing: this.readString(
        item,
        ['financing', 'financingType'],
        'Not specified'
      ),
      contingencies: this.readContingencyCount(item)
    };
  }

  private mapActivity(activity: unknown[]): ActivityItem[] {
    return activity.map(item => {
      const record = this.asRecord(item);

      return {
        title: this.readString(
          record,
          ['title', 'activityTitle'],
          'Listing activity'
        ),
        description: this.readString(
          record,
          ['description', 'message']
        ),
        timestamp: this.readDate(
          record,
          ['timestamp', 'createdAt', 'activityDate']
        )
      };
    });
  }

  private readContingencyCount(record: Record<string, unknown>): number {
    const value =
      record['contingencies'] ??
      record['contingencyCount'];

    if (Array.isArray(value)) {
      return value.length;
    }

    return this.toNumber(value);
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (typeof value === 'object' && value !== null) {
      return value as Record<string, unknown>;
    }

    return {};
  }

  private readString(
    record: Record<string, unknown>,
    keys: string[],
    fallback = ''
  ): string {
    for (const key of keys) {
      const value = record[key];

      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }

    return fallback;
  }

  private readNullableString(
    record: Record<string, unknown>,
    keys: string[]
  ): string | null {
    const value = this.readString(record, keys);

    return value || null;
  }

  private readNumber(
    record: Record<string, unknown>,
    keys: string[]
  ): number {
    for (const key of keys) {
      const value = record[key];

      if (value !== undefined && value !== null) {
        return this.toNumber(value);
      }
    }

    return 0;
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value.replace(/[$,]/g, ''));

      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  }

  private readDate(
    record: Record<string, unknown>,
    keys: string[]
  ): Date {
    for (const key of keys) {
      const value = record[key];
      const date = this.toDate(value);

      if (date) {
        return date;
      }
    }

    return new Date();
  }

  private toDate(value: unknown): Date | null {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);

      return Number.isNaN(date.getTime()) ? null : date;
    }

    if (typeof value === 'object' && value !== null) {
      const timestamp = value as {
        toDate?: () => Date;
        seconds?: number;
      };

      if (typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
      }

      if (typeof timestamp.seconds === 'number') {
        return new Date(timestamp.seconds * 1000);
      }
    }

    return null;
  }
}