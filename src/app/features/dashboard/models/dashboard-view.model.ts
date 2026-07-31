import { Listing } from '../../../core/domains/listings/models/listing.model';
import { Showing } from '../../../core/domains/transactions/models/showing.model';
import { Activity } from './activity.model';
import { DashboardMetrics } from './dashboard-metrics.model';

export interface DashboardViewModel {
  showWelcome: boolean;

  draftListings: Listing[];
  activeListings: Listing[];

  summary: DashboardMetrics;

  upcomingShowing: Showing | null;

  recentActivity: Activity[];
}