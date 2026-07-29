import { Injectable, inject } from '@angular/core';
import { AuthState } from '../../../../../../core/authentication/auth.state';

import { FirestoreService } from '../../../../../../core/firebase/firestore.service';

import { Listing } from '../../../../models/listing.model';
import { Offer } from '../../../../models/offer.model';
import { Showing } from '../../../../models/showing.model';
import { Activity } from '../../../../models/activity.model';
import { DashboardMetrics } from '../../../../models/dashboard-metrics.model';
import { DashboardViewModel } from '../../../../models/dashboard-view.model';

@Injectable({
  providedIn: 'root'
})
export class SellerDashboardService {

  private readonly firestore = inject(FirestoreService);
  private readonly authState = inject(AuthState);
  private readonly companyId = 'realestateos-main';

  async getDashboard(): Promise<DashboardViewModel> {

    const currentUserId = this.authState.uid;

    if (!currentUserId) {
      throw new Error('No authenticated seller.');
    }

    const listings = (
      await this.firestore.getAll<Listing>(
        `companies/${this.companyId}/listings`
      )
    ).filter(listing => listing.sellerId === currentUserId);

    const offers = await this.firestore.getAll<Offer>(
      `companies/${this.companyId}/offers`
    );

    const showings = await this.firestore.getAll<Showing>(
      `companies/${this.companyId}/showings`
    );

    const activity = await this.firestore.getAll<Activity>(
      `companies/${this.companyId}/activity`
    );

    const property = listings.length ? listings[0] : null;

    const latestOffer =
      offers
        .sort((a, b) =>
          new Date(b.submittedAt).getTime() -
          new Date(a.submittedAt).getTime()
        )[0] ?? null;

    const nextShowing =
      showings
        .filter(s =>
          new Date(s.showingDate) >= new Date()
        )
        .sort((a, b) =>
          new Date(a.showingDate).getTime() -
          new Date(b.showingDate).getTime()
        )[0] ?? null;

    const metrics: DashboardMetrics = {
      listingViews: property?.views ?? 0,
      favorites: property?.favorites ?? 0,
      showingRequests: showings.length,
      activeOffers: offers.filter(o =>
        o.status === 'new' ||
        o.status === 'reviewing' ||
        o.status === 'countered'
      ).length,
      updatedAt: new Date()
    };

    return {
      property,
      metrics,
      nextShowing,
      latestOffer,
      activity: activity
        .sort((a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
        )
        .slice(0, 10)
    };

  }

}