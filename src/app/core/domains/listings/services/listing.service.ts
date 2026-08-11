import {
  inject,
  Injectable
} from '@angular/core';

import {
  Listing,
  ListingAccessibility,
  ListingBathroomFeatures,
  ListingCommunityAmenities,
  ListingConstruction,
  ListingDraft,
  ListingDraftAddress,
  ListingDraftPricing,
  ListingDraftPropertyDetails,
  ListingDraftStep,
  ListingFeatures,
  ListingHoa,
  ListingInterior,
  ListingKitchen,
  ListingParcelAndTaxes,
  ListingParking,
  ListingPhotoReference,
  ListingRooms,
  ListingSchools,
  ListingSystems,
  ListingUtilities
} from '../models/listing.model';

import {
  ListingDraftChanges,
  ListingRepository,
  PublishedListingChanges
} from '../repositories/listing.repository';

export type SaveAddressStepInput =
  ListingDraftAddress;

export type SavePropertyDetailsStepInput =
  ListingDraftPropertyDetails;

export type SavePricingStepInput =
  ListingDraftPricing;

@Injectable({
  providedIn: 'root'
})
export class ListingService {
  private readonly repository =
    inject(ListingRepository);

  private readonly workflowOrder:
    ListingDraftStep[] = [
      'address',
      'property_details',
      'property_features',
      'photos',
      'pricing',
      'review'
    ];

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
      .getDraftsBySellerUid(sellerUid);
  }

  async saveAddressStep(
    listingUid: string,
    sellerUid: string,
    address: SaveAddressStepInput,
    existingCompletedSteps:
      ListingDraftStep[] = []
  ): Promise<void> {
    await this.saveSection(
      listingUid,
      sellerUid,
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
            address.county.trim(),

          latitude:
            address.latitude,

          longitude:
            address.longitude
        }
      },
      'address',
      'property_details',
      existingCompletedSteps
    );
  }

  async savePropertyDetailsStep(
    listingUid: string,
    sellerUid: string,
    propertyDetails:
      SavePropertyDetailsStepInput,
    hoa: ListingHoa,
    existingCompletedSteps:
      ListingDraftStep[] = []
  ): Promise<void> {
    await this.saveSection(
      listingUid,
      sellerUid,
      {
        propertyDetails: {
          ...propertyDetails,

          description:
            propertyDetails.description
              ?.trim() ||
            undefined
        },

        hoa
      },
      'property_details',
      'property_features',
      existingCompletedSteps
    );
  }

  async saveConstructionStep(
    listingUid: string,
    sellerUid: string,
    construction: ListingConstruction,
    existingCompletedSteps:
      ListingDraftStep[] = []
  ): Promise<void> {
    await this.saveSection(
      listingUid,
      sellerUid,
      { construction },
      'construction',
      'interior',
      existingCompletedSteps
    );
  }

  async saveInteriorStep(
    listingUid: string,
    sellerUid: string,
    interior: ListingInterior,
    existingCompletedSteps:
      ListingDraftStep[] = []
  ): Promise<void> {
    await this.saveSection(
      listingUid,
      sellerUid,
      { interior },
      'interior',
      'rooms',
      existingCompletedSteps
    );
  }

  async saveRoomsStep(
    listingUid: string,
    sellerUid: string,
    rooms: ListingRooms,
    existingCompletedSteps:
      ListingDraftStep[] = []
  ): Promise<void> {
    await this.saveSection(
      listingUid,
      sellerUid,
      { rooms },
      'rooms',
      'kitchen_bathrooms',
      existingCompletedSteps
    );
  }

  async saveKitchenAndBathroomsStep(
    listingUid: string,
    sellerUid: string,
    kitchen: ListingKitchen,
    bathrooms: ListingBathroomFeatures,
    existingCompletedSteps:
      ListingDraftStep[] = []
  ): Promise<void> {
    await this.saveSection(
      listingUid,
      sellerUid,
      {
        kitchen,
        bathrooms
      },
      'kitchen_bathrooms',
      'parking',
      existingCompletedSteps
    );
  }

  async saveParkingStep(
    listingUid: string,
    sellerUid: string,
    parking: ListingParking,
    existingCompletedSteps:
      ListingDraftStep[] = []
  ): Promise<void> {
    await this.saveSection(
      listingUid,
      sellerUid,
      { parking },
      'parking',
      'systems_utilities',
      existingCompletedSteps
    );
  }

  async saveSystemsAndUtilitiesStep(
    listingUid: string,
    sellerUid: string,
    systems: ListingSystems,
    utilities: ListingUtilities,
    existingCompletedSteps:
      ListingDraftStep[] = []
  ): Promise<void> {
    await this.saveSection(
      listingUid,
      sellerUid,
      {
        systems,
        utilities
      },
      'systems_utilities',
      'hoa_community',
      existingCompletedSteps
    );
  }

  async saveHoaAndCommunityStep(
    listingUid: string,
    sellerUid: string,
    hoa: ListingHoa,
    communityAmenities:
      ListingCommunityAmenities,
    existingCompletedSteps:
      ListingDraftStep[] = []
  ): Promise<void> {
    await this.saveSection(
      listingUid,
      sellerUid,
      {
        hoa,
        communityAmenities
      },
      'hoa_community',
      'accessibility',
      existingCompletedSteps
    );
  }

  async saveAccessibilityStep(
    listingUid: string,
    sellerUid: string,
    accessibility:
      ListingAccessibility,
    existingCompletedSteps:
      ListingDraftStep[] = []
  ): Promise<void> {
    await this.saveSection(
      listingUid,
      sellerUid,
      { accessibility },
      'accessibility',
      'schools',
      existingCompletedSteps
    );
  }

  async saveSchoolsStep(
    listingUid: string,
    sellerUid: string,
    schools: ListingSchools,
    existingCompletedSteps:
      ListingDraftStep[] = []
  ): Promise<void> {
    await this.saveSection(
      listingUid,
      sellerUid,
      { schools },
      'schools',
      'parcel_taxes',
      existingCompletedSteps
    );
  }

  async saveParcelAndTaxesStep(
    listingUid: string,
    sellerUid: string,
    parcelAndTaxes:
      ListingParcelAndTaxes,
    existingCompletedSteps:
      ListingDraftStep[] = []
  ): Promise<void> {
    await this.saveSection(
      listingUid,
      sellerUid,
      { parcelAndTaxes },
      'parcel_taxes',
      'property_features',
      existingCompletedSteps
    );
  }

  async saveFeaturesStep(
    listingUid: string,
    sellerUid: string,
    features: ListingFeatures,
    existingCompletedSteps:
      ListingDraftStep[] = []
  ): Promise<void> {
    await this.saveSection(
      listingUid,
      sellerUid,
      { features },
      'property_features',
      'photos',
      existingCompletedSteps
    );
  }

  async updateDraftPhotos(
    listingUid: string,
    sellerUid: string,
    photos: ListingPhotoReference[],
    existingCompletedSteps:
      ListingDraftStep[] = []
  ): Promise<void> {
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

    const selectedPrimaryPhoto =
      orderedPhotos.find(
        photo => photo.isPrimary
      ) ?? orderedPhotos[0];

    const normalizedPhotos =
      orderedPhotos.map(
        (photo, index) => ({
          ...photo,
          sortOrder: index,

          isPrimary:
            photo.id ===
            selectedPrimaryPhoto.id
        })
      );

    const primaryPhoto =
      normalizedPhotos.find(
        photo => photo.isPrimary
      )!;

    await this.saveSection(
      listingUid,
      sellerUid,
      {
        photos: normalizedPhotos,

        photoUrls:
          normalizedPhotos.map(
            photo => photo.fullImageUrl
          ),

        primaryPhotoUrl:
          primaryPhoto.fullImageUrl
      },
      'photos',
      'pricing',
      existingCompletedSteps
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
    if (pricing.listPrice <= 0) {
      throw new Error(
        'A valid listing price is required.'
      );
    }

    await this.saveSection(
      listingUid,
      sellerUid,
      {
        pricing: {
          listPrice:
            pricing.listPrice
        },

        featuredListing
      },
      'pricing',
      'review',
      existingCompletedSteps
    );
  }

  async completeListingContent(
    listingUid: string,
    sellerUid: string,
    certificationAccepted: boolean
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

          completedSteps: [
            ...this.workflowOrder
          ],

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
    changes: ListingDraftChanges
  ): Promise<void> {
    await this.requireSellerDraft(
      listingUid,
      sellerUid
    );

    await this.repository.updateDraft(
      listingUid,
      changes
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

  async updatePublishedListing(
    listingUid: string,
    sellerUid: string,
    changes: PublishedListingChanges
  ): Promise<void> {
    if (!listingUid) {
      throw new Error(
        'A listing identifier is required.'
      );
    }

    if (!sellerUid) {
      throw new Error(
        'An authenticated seller is required to update a published listing.'
      );
    }

    const listing =
      await this.repository.getPublishedListingByUid(
        listingUid
      );

    if (!listing) {
      throw new Error(
        'The published listing could not be found.'
      );
    }

    if (listing.sellerUid !== sellerUid) {
      throw new Error(
        'You do not have permission to update this listing.'
      );
    }

    await this.repository.updatePublishedListing(
      listingUid,
      changes
    );
  }

  async getListing(
    listingUid: string
  ): Promise<Listing | null> {
    return this.getPublishedListing(
      listingUid
    );
  }

  private async saveSection(
    listingUid: string,
    sellerUid: string,
    changes: ListingDraftChanges,
    completedStep: ListingDraftStep,
    nextStep: ListingDraftStep,
    existingCompletedSteps:
      ListingDraftStep[]
  ): Promise<void> {
    await this.requireSellerDraft(
      listingUid,
      sellerUid
    );

    await this.repository.updateDraft(
      listingUid,
      {
        ...changes,

        progress: this.buildProgress(
          nextStep,
          completedStep,
          [
            ...existingCompletedSteps,
            completedStep
          ]
        )
      }
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
    const uniqueSteps =
      new Set(completedSteps);

    return this.workflowOrder.filter(
      step => uniqueSteps.has(step)
    );
  }

  private calculateCompletionPercent(
    completedSteps: ListingDraftStep[]
  ): number {
    return Math.round(
      (
        completedSteps.length /
        this.workflowOrder.length
      ) * 100
    );
  }

  private validateCompleteDraft(
    draft: ListingDraft
  ): void {
    const requiredSections: Array<{
      value: unknown;
      message: string;
    }> = [
        {
          value: draft.address,
          message:
            'The listing address is incomplete.'
        },
        {
          value: draft.propertyDetails,
          message:
            'The property details are incomplete.'
        },
        {
          value: draft.features,
          message:
            'The property features are incomplete.'
        }
      ];

    const missingSection =
      requiredSections.find(
        section => !section.value
      );

    if (missingSection) {
      throw new Error(
        missingSection.message
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