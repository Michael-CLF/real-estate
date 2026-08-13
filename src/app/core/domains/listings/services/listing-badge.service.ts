import { Injectable } from '@angular/core';

import {
  ListingBadge,
  ListingBadgeSource
} from '../models/listing-badge.model';

@Injectable({
  providedIn: 'root'
})
export class ListingBadgeService {
  private readonly newListingDays = 7;
  private readonly hotPropertyMinimumViews = 250;
  private readonly hotPropertyMinimumFavorites = 10;
  private readonly hotPropertyMinimumInquiries = 5;

  getBadges(
    listing: ListingBadgeSource,
    now: Date = new Date()
  ): ListingBadge[] {
    const badges: ListingBadge[] = [];

    if (listing.featuredListing === true) {
      badges.push({
        type: 'featured',
        label: 'Featured',
        icon: 'fa-solid fa-star',
        tone: 'gold',
        priority: 100
      });
    }

    if (this.isComingSoon(listing)) {
      badges.push({
        type: 'coming-soon',
        label: 'Coming Soon',
        icon: 'fa-solid fa-clock',
        tone: 'navy',
        priority: 90
      });
    }

    if (this.isPriceReduced(listing)) {
      badges.push({
        type: 'price-reduced',
        label: 'Price Reduced',
        icon: 'fa-solid fa-arrow-trend-down',
        tone: 'green',
        priority: 80
      });
    }

    if (this.isNewListing(listing, now)) {
      badges.push({
        type: 'new-listing',
        label: 'New Listing',
        icon: 'fa-solid fa-sparkles',
        tone: 'teal',
        priority: 70
      });
    }

    if (this.isHotProperty(listing)) {
      badges.push({
        type: 'hot-property',
        label: 'Hot Property',
        icon: 'fa-solid fa-fire',
        tone: 'coral',
        priority: 60
      });
    }

    return badges.sort(
      (firstBadge, secondBadge) =>
        secondBadge.priority - firstBadge.priority
    );
  }

  private isComingSoon(
    listing: ListingBadgeSource
  ): boolean {
    return listing.status === 'coming_soon';
  }

  private isPriceReduced(
    listing: ListingBadgeSource
  ): boolean {
    return listing.originalPrice !== undefined &&
      listing.originalPrice > listing.price;
  }

  private isNewListing(
    listing: ListingBadgeSource,
    now: Date
  ): boolean {
    if (
      !listing.publishedAt ||
      this.isComingSoon(listing)
    ) {
      return false;
    }

    const ageInMilliseconds =
      now.getTime() - listing.publishedAt.getTime();

    const maximumAgeInMilliseconds =
      this.newListingDays * 24 * 60 * 60 * 1000;

    return ageInMilliseconds >= 0 &&
      ageInMilliseconds <= maximumAgeInMilliseconds;
  }

  private isHotProperty(
    listing: ListingBadgeSource
  ): boolean {
    return (listing.viewCount ?? 0) >=
        this.hotPropertyMinimumViews ||
      (listing.favoriteCount ?? 0) >=
        this.hotPropertyMinimumFavorites ||
      (listing.inquiryCount ?? 0) >=
        this.hotPropertyMinimumInquiries;
  }
}