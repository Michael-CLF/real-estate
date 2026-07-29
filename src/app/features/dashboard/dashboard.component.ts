import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import {
  PropertySummary,
  PropertySummaryCardComponent
} from './components/property-summary-card/property-summary-card.component';

import {
  ListingMetric,
  ListingMetricsCardComponent
} from './components/listing-metrics-card/listing-metrics-card.component';

import {
  NextStep,
  NextStepsCardComponent
} from './components/next-steps-card/next-steps-card.component';

import {
  UpcomingShowing,
  UpcomingShowingCardComponent
} from './components/upcoming-showing-card/upcoming-showing-card.component';

import {
  LatestOffer,
  LatestOfferCardComponent
} from './components/latest-offer-card/latest-offer-card.component';

import {
  ActivityItem,
  ActivityCardComponent
} from './components/activity-card/activity-card.component';

import { DashboardViewModel } from '../../features/seller/models/dashboard-view.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    PropertySummaryCardComponent,
    ListingMetricsCardComponent,
    NextStepsCardComponent,
    UpcomingShowingCardComponent,
    LatestOfferCardComponent,
    ActivityCardComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent  {
}