import {
  inject,
  Injectable
} from '@angular/core';

import {
  Listing,
  ListingDraft,
  ListingDraftStep,
  ListingFeatures,
  ListingPhotoReference
} from '../models/listing.model';

import {
  ListingRepository
} from '../repositories/listing.repository';


export interface SaveAddressStepInput {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
}


export interface SavePropertyDetailsStepInput {
  propertyType: Listing['propertyType'];
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  yearBuilt: number;
  lotSize?: number;
  description?: string;
}


export interface SavePricingStepInput {
  listPrice: number;
}


@Injectable({
  providedIn: 'root'
})
export class ListingService {

  private readonly repository =
    inject(ListingRepository);


  async createInitialDraft(
    sellerUid: string
  ): Promise<string> {
    if (!sellerUid) {
      throw new Error(
        'An authenticated seller is required to create a listing draft.'
      );
    }

    return this.repository.createInitialDraft({
      sellerUid,

      featuredListing: false,

      certification: {
        accepted: false
      },

      progress: {
        currentStep: 'address',
        completedSteps: [],
        completionPercent: 0,
        contentStatus: 'in_progress'
      },

      publication: {
        status: 'content_incomplete',
        identityStatus: 'not_started',
        paymentStatus: 'not_started'
      }
    });
  }


  async getSellerDraft(
    listingUid: string,
    sellerUid: string
  ): Promise<ListingDraft | null> {
    if (!listingUid || !sellerUid) {
      return null;
    }

    const draft =
      await this.repository.getDraftByUid(
        listingUid
      );

    if (!draft) {
      return null;
    }

    if (draft.sellerUid !== sellerUid) {
      throw new Error(
        'You do not have permission to access this listing draft.'
      );
    }

    if (
      draft.publication.status ===
      'published'
    ) {
      throw new Error(
        'This listing has already been published and is no longer an editable draft.'
      );
    }

    return draft;
  }

  async getSellerDrafts(
    sellerUid: string
  ): Promise<ListingDraft[]> {
    if (!sellerUid) {
      return [];
    }

    return this.repository
      .getDraftsBySellerUid(
        sellerUid
      );
  }


  async saveAddressStep(
    listingUid: string,
    sellerUid: string,
    address: SaveAddressStepInput
  ): Promise<void> {
    await this.requireSellerDraft(
      listingUid,
      sellerUid
    );

    await this.repository.updateDraft(
      listingUid,
      {
        address: {
          addressLine1:
            address.addressLine1.trim(),

          addressLine2:
            address.addressLine2?.trim() ||
            undefined,

          city:
            address.city.trim(),

          state:
            address.state.trim(),

          zipCode:
            address.zipCode.trim(),

          county:
            address.county.trim()
        },

        progress: this.buildProgress(
          'property_details',
          'address',
          [
            'address'
          ]
        )
      }
    );
  }


  async savePropertyDetailsStep(
    listingUid: string,
    sellerUid: string,
    propertyDetails:
      SavePropertyDetailsStepInput,
    existingCompletedSteps:
      ListingDraftStep[] = []
  ): Promise<void> {
    await this.requireSellerDraft(
      listingUid,
      sellerUid
    );

    await this.repository.updateDraft(
      listingUid,
      {
        propertyDetails: {
          propertyType:
            propertyDetails.propertyType,

          bedrooms:
            propertyDetails.bedrooms,

          bathrooms:
            propertyDetails.bathrooms,

          squareFeet:
            propertyDetails.squareFeet,

          yearBuilt:
            propertyDetails.yearBuilt,

          lotSize:
            propertyDetails.lotSize,

          description:
            propertyDetails.description
              ?.trim() ||
            undefined
        },

        progress: this.buildProgress(
          'property_features',
          'property_details',
          [
            ...existingCompletedSteps,
            'address',
            'property_details'
          ]
        )
      }
    );
  }


  async saveFeaturesStep(
    listingUid: string,
    sellerUid: string,
    features: ListingFeatures,
    existingCompletedSteps:
      ListingDraftStep[] = []
  ): Promise<void> {
    await this.requireSellerDraft(
      listingUid,
      sellerUid
    );

    await this.repository.updateDraft(
      listingUid,
      {
        features,

        progress: this.buildProgress(
          'photos',
          'property_features',
          [
            ...existingCompletedSteps,
            'address',
            'property_details',
            'property_features'
          ]
        )
      }
    );
  }


  async updateDraftPhotos(
    listingUid: string,
    sellerUid: string,
    photos: ListingPhotoReference[],
    existingCompletedSteps:
      ListingDraftStep[] = []
  ): Promise<void> {
    await this.requireSellerDraft(
      listingUid,
      sellerUid
    );

    if (photos.length === 0) {
      throw new Error(
        'At least one listing photo is required.'
      );
    }

    const orderedPhotos = [
      ...photos
    ].sort(
      (firstPhoto, secondPhoto) =>
        firstPhoto.sortOrder -
        secondPhoto.sortOrder
    );

    const primaryPhoto =
      orderedPhotos.find(
        photo => photo.isPrimary
      ) ??
      orderedPhotos[0];

    const normalizedPhotos =
      orderedPhotos.map(
        (photo, index) => ({
          ...photo,

          sortOrder: index,

          isPrimary:
            photo.id === primaryPhoto.id
        })
      );

    await this.repository.updateDraft(
      listingUid,
      {
        photos: normalizedPhotos,

        photoUrls:
          normalizedPhotos.map(
            photo => photo.fullImageUrl
          ),

        primaryPhotoUrl:
          primaryPhoto.fullImageUrl,

        progress: this.buildProgress(
          'pricing',
          'photos',
          [
            ...existingCompletedSteps,
            'address',
            'property_details',
            'property_features',
            'photos'
          ]
        )
      }
    );
  }


  async savePricingStep(
    listingUid: string,
    sellerUid: string,
    pricing: SavePricingStepInput,
    featuredListing: boolean,
    existingCompletedSteps:
      ListingDraftStep[] = []
  ): Promise<void> {
    await this.requireSellerDraft(
      listingUid,
      sellerUid
    );

    await this.repository.updateDraft(
      listingUid,
      {
        pricing: {
          listPrice:
            pricing.listPrice
        },

        featuredListing,

        progress: this.buildProgress(
          'review',
          'pricing',
          [
            ...existingCompletedSteps,
            'address',
            'property_details',
            'property_features',
            'photos',
            'pricing'
          ]
        )
      }
    );
  }


  async completeListingContent(
    listingUid: string,
    sellerUid: string,
    certificationAccepted: boolean,
    existingCompletedSteps:
      ListingDraftStep[] = []
  ): Promise<void> {
    const draft =
      await this.requireSellerDraft(
        listingUid,
        sellerUid
      );

    if (!certificationAccepted) {
      throw new Error(
        'Seller certification must be accepted before continuing.'
      );
    }

    this.validateCompleteDraft(draft);

    const identityVerified =
      draft.publication.identityStatus ===
      'verified';

    await this.repository.updateDraft(
      listingUid,
      {
        certification: {
          accepted: true,
          acceptedAt: new Date()
        },

        progress: {
          currentStep: 'review',
          lastCompletedStep: 'review',

          completedSteps:
            this.normalizeCompletedSteps([
              ...existingCompletedSteps,
              'address',
              'property_details',
              'property_features',
              'photos',
              'pricing',
              'review'
            ]),

          completionPercent: 100,
          contentStatus: 'complete'
        },

        publication: {
          ...draft.publication,

          status:
            identityVerified
              ? 'payment_required'
              : 'identity_required'
        }
      }
    );
  }


  async updateDraft(
    listingUid: string,
    sellerUid: string,
    changes: Partial<ListingDraft>
  ): Promise<void> {
    await this.requireSellerDraft(
      listingUid,
      sellerUid
    );

    const protectedChanges = {
      ...changes
    };

    delete protectedChanges.Uid;
    delete protectedChanges.sellerUid;
    delete protectedChanges.createdAt;
    delete protectedChanges.updatedAt;
    delete protectedChanges.lastSavedAt;

    await this.repository.updateDraft(
      listingUid,
      protectedChanges
    );
  }


  async getPublishedListing(
    listingUid: string
  ): Promise<Listing | null> {
    return this.repository
      .getPublishedListingByUid(
        listingUid
      );
  }


  /*
   * Temporary compatibility method.
   *
   * Existing marketplace code may still call
   * getListing(). It now reads only from the
   * published listings collection.
   */
  async getListing(
    listingUid: string
  ): Promise<Listing | null> {
    return this.getPublishedListing(
      listingUid
    );
  }


  private async requireSellerDraft(
    listingUid: string,
    sellerUid: string
  ): Promise<ListingDraft> {
    const draft =
      await this.getSellerDraft(
        listingUid,
        sellerUid
      );

    if (!draft) {
      throw new Error(
        'The listing draft could not be found.'
      );
    }

    return draft;
  }


  private buildProgress(
    currentStep: ListingDraftStep,
    lastCompletedStep: ListingDraftStep,
    completedSteps: ListingDraftStep[]
  ): ListingDraft['progress'] {
    const normalizedSteps =
      this.normalizeCompletedSteps(
        completedSteps
      );

    return {
      currentStep,
      lastCompletedStep,
      completedSteps:
        normalizedSteps,

      completionPercent:
        this.calculateCompletionPercent(
          normalizedSteps
        ),

      contentStatus:
        normalizedSteps.includes('review')
          ? 'complete'
          : 'in_progress'
    };
  }


  private normalizeCompletedSteps(
    completedSteps: ListingDraftStep[]
  ): ListingDraftStep[] {
    const workflowOrder:
      ListingDraftStep[] = [
        'address',
        'property_details',
        'property_features',
        'photos',
        'pricing',
        'review'
      ];

    const uniqueSteps =
      new Set(completedSteps);

    return workflowOrder.filter(
      step => uniqueSteps.has(step)
    );
  }


  private calculateCompletionPercent(
    completedSteps: ListingDraftStep[]
  ): number {
    const totalSteps = 6;

    return Math.round(
      (
        completedSteps.length /
        totalSteps
      ) * 100
    );
  }


  private validateCompleteDraft(
    draft: ListingDraft
  ): void {
    if (!draft.address) {
      throw new Error(
        'The listing address is incomplete.'
      );
    }

    if (!draft.propertyDetails) {
      throw new Error(
        'The property details are incomplete.'
      );
    }

    if (!draft.features) {
      throw new Error(
        'The property features are incomplete.'
      );
    }

    if (
      !draft.photos ||
      draft.photos.length === 0
    ) {
      throw new Error(
        'At least one listing photo is required.'
      );
    }

    if (!draft.primaryPhotoUrl) {
      throw new Error(
        'A primary listing photo is required.'
      );
    }

    if (
      !draft.pricing ||
      draft.pricing.listPrice <= 0
    ) {
      throw new Error(
        'A valid listing price is required.'
      );
    }
  }
}