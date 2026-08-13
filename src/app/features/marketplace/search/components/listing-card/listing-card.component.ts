import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input
} from '@angular/core';

import {
  CurrencyPipe
} from '@angular/common';

import {
  RouterLink
} from '@angular/router';

import {
  MarketplaceListingSummary
} from '../../../../../core/domains/marketplace/models/listing-search-filters.model';

import {
  ListingBadgeService
} from '../../../../../core/domains/listings/services/listing-badge.service';

import {
  ListingBadgesComponent
} from '../../../listings/components/listing-badges/listing-badges.component';

@Component({
  selector: 'app-listing-card',
  standalone: true,
  imports: [
    CurrencyPipe,
    RouterLink,
    ListingBadgesComponent
  ],
  templateUrl: './listing-card.component.html',
  styleUrl: './listing-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListingCardComponent {
  private readonly listingBadgeService =
    inject(ListingBadgeService);

  readonly listing =
    input.required<MarketplaceListingSummary>();

  readonly badges = computed(() =>
    this.listingBadgeService.getBadges(
      this.listing()
    )
  );

  readonly propertyFacts = computed(() => {
    const listing = this.listing();
    const facts: string[] = [];

    if (listing.bedrooms !== undefined) {
      facts.push(
        `${listing.bedrooms} ${
          listing.bedrooms === 1
            ? 'bed'
            : 'beds'
        }`
      );
    }

    if (listing.bathrooms !== undefined) {
      facts.push(
        `${listing.bathrooms} ${
          listing.bathrooms === 1
            ? 'bath'
            : 'baths'
        }`
      );
    }

    if (listing.squareFeet !== undefined) {
      facts.push(
        `${listing.squareFeet.toLocaleString()} sq. ft.`
      );
    }

    return facts;
  });

  readonly accessibleImageText = computed(() => {
    const listing = this.listing();

    return (
      `${listing.title} in ` +
      `${listing.city}, ` +
      listing.stateAbbreviation
    );
  });
}