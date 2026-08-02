import { inject, Injectable } from '@angular/core';

import {
  Listing,
  ListingFeatures
} from '../models/listing.model';

import {
  ListingRepository
} from '../repositories/listing.repository';

export interface CreateListingDraftInput {
  sellerUid: string;

  address: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    zipCode: string;
    county: string;
  };

  propertyDetails: {
    propertyType: Listing['propertyType'];
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    yearBuilt: number;
    lotSize: number | null;
    description: string;
  };

  features: ListingFeatures;

  pricing: {
    listPrice: number;
  };

  featuredListing: boolean;

  promotion?: {
    code: string;
    type: 'fixed' | 'percentage';
    value: number;
    discountAmount: number;
  };

  certificationAccepted: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ListingService {
  private readonly repository = inject(ListingRepository);

  async createDraft(
    input: CreateListingDraftInput
  ): Promise<string> {

    if (!input.certificationAccepted) {
      throw new Error(
        'Seller certification must be accepted before continuing.'
      );
    }

    const listing: Omit<
      Listing,
      'Uid' | 'createdAt' | 'updatedAt'
    > = {
      sellerUid: input.sellerUid,

      addressLine1: input.address.addressLine1,
      addressLine2: input.address.addressLine2 || undefined,
      city: input.address.city,
      state: input.address.state,
      zipCode: input.address.zipCode,
      county: input.address.county,

      listPrice: input.pricing.listPrice,

      propertyType: input.propertyDetails.propertyType,
      bedrooms: input.propertyDetails.bedrooms,
      bathrooms: input.propertyDetails.bathrooms,
      squareFeet: input.propertyDetails.squareFeet,
      lotSize: input.propertyDetails.lotSize ?? undefined,
      yearBuilt: input.propertyDetails.yearBuilt,
      description: input.propertyDetails.description,

      features: input.features,

      primaryPhotoUrl: undefined,
      photoUrls: [],
      photos: [],

      featuredListing: input.featuredListing,

      promotion: input.promotion,

      certification: {
        accepted: true,
        acceptedAt: new Date()
      },

      workflow: {
        identityVerified: false,
        paymentCompleted: false,
        published: false
      },

      status: 'draft',
      draftStep: 'review',
      completionPercent: 100,

      daysOnMarket: 0,
      views: 0,
      favorites: 0
    };

    return this.repository.createDraft(listing);
  }

  async getListing(
    listingUid: string
  ): Promise<Listing | null> {
    return this.repository.getByUid(listingUid);
  }

  async updateDraft(
    listingUid: string,
    changes: Partial<Listing>
  ): Promise<void> {
    await this.repository.updateDraft(
      listingUid,
      changes
    );
  }
}