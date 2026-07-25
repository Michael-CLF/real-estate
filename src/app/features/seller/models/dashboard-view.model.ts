import { Listing } from './listing.model';
import { DashboardMetrics } from './dashboard-metrics.model';
import { Showing } from './showing.model';
import { Offer } from './offer.model';
import { Activity } from './activity.model';

export interface DashboardViewModel {
  property: Listing | null;
  metrics: DashboardMetrics;
  nextShowing: Showing | null;
  latestOffer: Offer | null;
  activity: Activity[];
}