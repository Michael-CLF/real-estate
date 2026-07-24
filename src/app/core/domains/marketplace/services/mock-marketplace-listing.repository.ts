import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import {
  ListingSearchFilters,
  ListingSearchResult,
  MarketplaceListingSummary
} from '../models/listing-search-filters.model';
import { MarketplaceListing } from '../models/marketplace-listing.model';
import { MarketplaceListingRepository } from '../repositories/marketplace-listing.repository';

@Injectable()
export class MockMarketplaceListingRepository
  extends MarketplaceListingRepository {

  private readonly listings: MarketplaceListing[] = [
    {
      id: 'raleigh-modern-home-001',
      sellerId: 'seller-demo-001',

      status: 'published',
      propertyType: 'single_family',

      title: 'Modern Home Near Downtown Raleigh',
      description:
        'A well-maintained modern home with an open floor plan, updated kitchen, spacious primary suite, and convenient access to downtown Raleigh.',

      price: 489000,

      bedrooms: 4,
      bathrooms: 3,
      squareFeet: 2460,
      lotSizeAcres: 0.28,
      yearBuilt: 2019,

      address: {
        addressLine1: '125 Example Street',
        city: 'Raleigh',
        state: 'North Carolina',
        stateAbbreviation: 'NC',
        stateSlug: 'north-carolina',
        postalCode: '27609',
        county: 'Wake'
      },

      location: {
        latitude: 35.8226,
        longitude: -78.6382
      },

      photos: [],
      featuredPhotoUrl:
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
      photoCount: 24,

      favoriteCount: 18,
      viewCount: 246,
      inquiryCount: 7,

      publishedAt: new Date('2026-07-20T14:00:00'),
      createdAt: new Date('2026-07-18T10:00:00'),
      updatedAt: new Date('2026-07-20T14:00:00')
    },
    {
      id: 'wake-forest-traditional-home-002',
      sellerId: 'seller-demo-002',

      status: 'published',
      propertyType: 'single_family',

      title: 'Spacious Home in Wake Forest',
      description:
        'A spacious traditional home with a large backyard, flexible living areas, updated finishes, and convenient access to local shopping and schools.',

      price: 565000,

      bedrooms: 5,
      bathrooms: 3.5,
      squareFeet: 3180,
      lotSizeAcres: 0.41,
      yearBuilt: 2017,

      address: {
        addressLine1: '842 Example Drive',
        city: 'Wake Forest',
        state: 'North Carolina',
        stateAbbreviation: 'NC',
        stateSlug: 'north-carolina',
        postalCode: '27587',
        county: 'Wake'
      },

      location: {
        latitude: 35.9799,
        longitude: -78.5097
      },

      photos: [],
      featuredPhotoUrl:
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
      photoCount: 31,

      favoriteCount: 11,
      viewCount: 178,
      inquiryCount: 5,

      publishedAt: new Date('2026-07-18T15:30:00'),
      createdAt: new Date('2026-07-16T09:15:00'),
      updatedAt: new Date('2026-07-18T15:30:00')
    },
    {
      id: 'durham-townhouse-003',
      sellerId: 'seller-demo-001',

      status: 'published',
      propertyType: 'townhouse',

      title: 'Contemporary Durham Townhouse',
      description:
        'A contemporary townhouse with modern finishes, low-maintenance living, attached garage, and convenient access to downtown Durham.',

      price: 389000,

      bedrooms: 3,
      bathrooms: 2.5,
      squareFeet: 1840,
      yearBuilt: 2021,

      address: {
        addressLine1: '416 Example Avenue',
        city: 'Durham',
        state: 'North Carolina',
        stateAbbreviation: 'NC',
        stateSlug: 'north-carolina',
        postalCode: '27701',
        county: 'Durham'
      },

      location: {
        latitude: 35.994,
        longitude: -78.8986
      },

      photos: [],
      featuredPhotoUrl:
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3',
      photoCount: 19,

      favoriteCount: 9,
      viewCount: 132,
      inquiryCount: 3,

      publishedAt: new Date('2026-07-15T12:00:00'),
      createdAt: new Date('2026-07-14T08:00:00'),
      updatedAt: new Date('2026-07-15T12:00:00')
    }
  ];

  override searchListings(
    filters: ListingSearchFilters
  ): Observable<ListingSearchResult> {
    const page = Math.max(filters.page ?? 1, 1);
    const pageSize = Math.max(filters.pageSize ?? 12, 1);

    let filteredListings = this.listings.filter(
      listing => listing.status === 'published'
    );

    if (filters.stateSlug) {
      filteredListings = filteredListings.filter(
        listing => listing.address.stateSlug === filters.stateSlug
      );
    }

    if (filters.city) {
      const city = filters.city.trim().toLowerCase();

      filteredListings = filteredListings.filter(
        listing => listing.address.city.toLowerCase() === city
      );
    }

    if (filters.postalCode) {
      filteredListings = filteredListings.filter(
        listing => listing.address.postalCode === filters.postalCode
      );
    }

    if (filters.propertyTypes?.length) {
      filteredListings = filteredListings.filter(
        listing => filters.propertyTypes?.includes(listing.propertyType)
      );
    }

    if (filters.minimumPrice !== undefined) {
      filteredListings = filteredListings.filter(
        listing => listing.price >= filters.minimumPrice!
      );
    }

    if (filters.maximumPrice !== undefined) {
      filteredListings = filteredListings.filter(
        listing => listing.price <= filters.maximumPrice!
      );
    }

    if (filters.minimumBedrooms !== undefined) {
      filteredListings = filteredListings.filter(
        listing =>
          (listing.bedrooms ?? 0) >= filters.minimumBedrooms!
      );
    }

    if (filters.minimumBathrooms !== undefined) {
      filteredListings = filteredListings.filter(
        listing =>
          (listing.bathrooms ?? 0) >= filters.minimumBathrooms!
      );
    }

    filteredListings = this.sortListings(
      filteredListings,
      filters.sort ?? 'newest'
    );

    const totalCount = filteredListings.length;
    const totalPages = Math.max(
      Math.ceil(totalCount / pageSize),
      1
    );

    const startIndex = (page - 1) * pageSize;
    const pageListings = filteredListings.slice(
      startIndex,
      startIndex + pageSize
    );

    return of({
      listings: pageListings.map(
        listing => this.toListingSummary(listing)
      ),
      totalCount,
      page,
      pageSize,
      totalPages
    });
  }

  override getListingById(
    listingId: string
  ): Observable<MarketplaceListing | null> {
    const listing = this.listings.find(
      currentListing => currentListing.id === listingId
    );

    return of(listing ?? null);
  }

  override getListingsBySellerId(
    sellerId: string
  ): Observable<MarketplaceListing[]> {
    return of(
      this.listings.filter(
        listing => listing.sellerId === sellerId
      )
    );
  }

  override getFeaturedListings(
    limit: number
  ): Observable<MarketplaceListing[]> {
    return of(
      [...this.listings]
        .filter(listing => listing.status === 'published')
        .sort(
          (firstListing, secondListing) =>
            secondListing.favoriteCount -
            firstListing.favoriteCount
        )
        .slice(0, Math.max(limit, 0))
    );
  }

  private sortListings(
    listings: MarketplaceListing[],
    sort: ListingSearchFilters['sort']
  ): MarketplaceListing[] {
    const sortedListings = [...listings];

    switch (sort) {
      case 'price_low_to_high':
        return sortedListings.sort(
          (firstListing, secondListing) =>
            firstListing.price - secondListing.price
        );

      case 'price_high_to_low':
        return sortedListings.sort(
          (firstListing, secondListing) =>
            secondListing.price - firstListing.price
        );

      case 'bedrooms_high_to_low':
        return sortedListings.sort(
          (firstListing, secondListing) =>
            (secondListing.bedrooms ?? 0) -
            (firstListing.bedrooms ?? 0)
        );

      case 'square_feet_high_to_low':
        return sortedListings.sort(
          (firstListing, secondListing) =>
            (secondListing.squareFeet ?? 0) -
            (firstListing.squareFeet ?? 0)
        );

      case 'newest':
      default:
        return sortedListings.sort(
          (firstListing, secondListing) =>
            (secondListing.publishedAt?.getTime() ?? 0) -
            (firstListing.publishedAt?.getTime() ?? 0)
        );
    }
  }

  private toListingSummary(
    listing: MarketplaceListing
  ): MarketplaceListingSummary {
    return {
      id: listing.id,
      sellerId: listing.sellerId,

      title: listing.title,
      propertyType: listing.propertyType,

      price: listing.price,

      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      squareFeet: listing.squareFeet,

      city: listing.address.city,
      stateAbbreviation: listing.address.stateAbbreviation,
      postalCode: listing.address.postalCode,

      featuredPhotoUrl: listing.featuredPhotoUrl,

      favoriteCount: listing.favoriteCount,

      publishedAt: listing.publishedAt
    };
  }
}