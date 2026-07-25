export interface DashboardMetrics {
  listingViews: number;
  favorites: number;
  showingRequests: number;
  activeOffers: number;
  savedSearches?: number;
  profileViews?: number;
  unreadMessages?: number;
  documentsPending?: number;
  updatedAt: Date;
}