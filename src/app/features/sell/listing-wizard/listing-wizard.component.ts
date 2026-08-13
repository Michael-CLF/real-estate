import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import {
  auth
} from '../../../core/infrastructure/firebase/firebase';

import {
  ListingService
} from '../../../core/domains/listings/services/listing.service';

import {
  IdentityVerificationService
} from '../../../core/domains/identity/services/identity-verification.service';

import {
  ListingDraftStep,
  ListingFeatures,
  ListingHoa
} from '../../../core/domains/listings/models/listing.model';

import {
  ValidDiscountCodeResult
} from '../../../core/domains/payments/models/discount-code.model';

import {
  AddressFormValue,
  AddressStepComponent
} from './components/address-step/address-step.component';

import {
  PropertyDetailsFormValue,
  PropertyDetailsStepComponent
} from './components/property-details-step/property-details-step.component';

import {
  PropertyFeaturesFormValue,
  PropertyFeaturesStepComponent,
  PropertyFeaturesStepValue
} from './components/property-features-step/property-features-step.component';

import {
  ListingPhoto,
  PhotosStepComponent
} from './components/photos-step/photos-step.component';

import {
  PricingFormValue,
  PricingStepComponent
} from './components/pricing-step/pricing-step.component';

import {
  ReviewStepComponent
} from './components/review-step/review-step.component';

import {
  ListingPhotoStorageService
} from '../../../core/infrastructure/listings/listing-photo-storage.service';


interface WizardStep {
  number: number;
  label: string;
}


@Component({
  selector: 'app-listing-wizard',
  standalone: true,
  imports: [
    AddressStepComponent,
    PropertyDetailsStepComponent,
    PropertyFeaturesStepComponent,
    PhotosStepComponent,
    PricingStepComponent,
    ReviewStepComponent,
    RouterLink
  ],
  templateUrl: './listing-wizard.component.html',
  styleUrl: './listing-wizard.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class ListingWizardComponent
  implements OnInit {

  private readonly listingService =
    inject(ListingService);

  private readonly identityVerificationService =
    inject(IdentityVerificationService);

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly listingPhotoStorageService =
    inject(ListingPhotoStorageService);


  protected readonly listingUid =
    signal<string | null>(null);

  protected readonly isInitializing =
    signal(true);

  protected readonly initializationError =
    signal('');

  protected readonly currentStep =
    signal(1);

  protected readonly completedSteps =
    signal<ListingDraftStep[]>([]);


  protected readonly addressData =
    signal<AddressFormValue | null>(null);

  protected readonly propertyDetailsData =
    signal<PropertyDetailsFormValue | null>(
      null
    );

  protected readonly propertyFeaturesData =
    signal<PropertyFeaturesStepValue | null>(
      null
    );

  protected readonly photosData =
    signal<ListingPhoto[]>([]);

  protected readonly pricingData =
    signal<PricingFormValue | null>(null);


  protected readonly featuredListing =
    signal(false);

  protected readonly appliedPromotion =
    signal<ValidDiscountCodeResult | null>(
      null
    );

  protected readonly certificationAccepted =
    signal(false);


  protected readonly isSaving =
    signal(false);

  protected readonly isSavingPhotos =
    signal(false);

  protected readonly saveError =
    signal('');

  protected readonly photoSaveError =
    signal('');

  protected readonly listingContentComplete =
    signal(false);


  protected readonly stepValidity =
    signal<Record<number, boolean>>({
      1: false,
      2: false,
      3: false,
      4: false,
      5: false,
      6: false
    });


  protected readonly steps: WizardStep[] = [
    {
      number: 1,
      label: 'Address'
    },
    {
      number: 2,
      label: 'Property Details'
    },
    {
      number: 3,
      label: 'Features'
    },
    {
      number: 4,
      label: 'Photos'
    },
    {
      number: 5,
      label: 'Pricing'
    },
    {
      number: 6,
      label: 'Review'
    }
  ];


  async ngOnInit(): Promise<void> {
    await this.initializeDraft();
  }


  private async initializeDraft(): Promise<void> {
    const user = auth.currentUser;

    if (!user) {
      this.initializationError.set(
        'Your authentication session could not be found. Please sign in again.'
      );

      this.isInitializing.set(false);
      return;
    }

    const routeListingUid =
      this.route.snapshot.paramMap.get(
        'listingUid'
      );

    try {
      if (routeListingUid) {
        await this.loadExistingDraft(
          routeListingUid,
          user.uid
        );

        return;
      }

      await this.createNewDraft(
        user.uid
      );
    } catch (error) {
      console.error(
        'Failed to initialize listing draft.',
        error
      );

      this.initializationError.set(
        error instanceof Error
          ? error.message
          : 'We could not open your listing draft.'
      );
    } finally {
      this.isInitializing.set(false);
    }
  }


  private async createNewDraft(
    sellerUid: string
  ): Promise<void> {
    const listingUid =
      await this.listingService
        .createInitialDraft(
          sellerUid
        );

    this.listingUid.set(
      listingUid
    );

    await this.router.navigate(
      [
        '/sell/listings',
        listingUid,
        'edit'
      ],
      {
        replaceUrl: true
      }
    );
  }


  private async loadExistingDraft(
    listingUid: string,
    sellerUid: string
  ): Promise<void> {
    const draft =
      await this.listingService
        .getSellerDraft(
          listingUid,
          sellerUid
        );

    if (!draft) {
      throw new Error(
        'This listing draft could not be found.'
      );
    }

    this.listingUid.set(
      listingUid
    );

    this.completedSteps.set([
      ...draft.progress.completedSteps
    ]);


    if (draft.address) {
      this.addressData.set({
        addressLine1:
          draft.address.addressLine1,

        addressLine2:
          draft.address.addressLine2 ?? '',

        city:
          draft.address.city,

        state:
          draft.address.state,

        zipCode:
          draft.address.zipCode,

        county:
          draft.address.county
      });

      this.setStepValidity(
        1,
        true
      );
    }


    if (draft.propertyDetails) {
      this.propertyDetailsData.set({
        propertyType:
          draft.propertyDetails.propertyType,

        bedrooms:
          draft.propertyDetails.bedrooms,

        bathrooms:
          draft.propertyDetails.fullBathrooms +
          (
            draft.propertyDetails.halfBathrooms *
            0.5
          ),

        squareFeet:
          draft.propertyDetails.squareFeet,

        yearBuilt:
          draft.propertyDetails.yearBuilt,

        lotSize:
          draft.propertyDetails.lotSize ??
          null,

        lotSizeUnit:
          draft.propertyDetails.lotSizeUnit ??
          'acres',

        description:
          draft.propertyDetails.description ??
          '',

        hoa: draft.hoa
          ? {
            hasHoa:
              draft.hoa.hasHoa,

            feeAmount:
              draft.hoa.feeAmount ??
              null,

            feeFrequency:
              draft.hoa.feeFrequency ??
              ''
          }
          : {
            hasHoa: null,
            feeAmount: null,
            feeFrequency: ''
          }
      });

      this.setStepValidity(
        2,
        true
      );
    }


    if (draft.features) {
      const restoredFeatures =
        this.toPropertyFeaturesFormValue(
          draft.features as ListingFeatures
        );

      const hasSelectedFeatures =
        Object.values(
          restoredFeatures
        ).some(
          selected => selected === true
        );

      this.propertyFeaturesData.set({
        mode:
          hasSelectedFeatures
            ? 'add'
            : 'skip',

        features:
          restoredFeatures
      });

      this.setStepValidity(
        3,
        true
      );
    }


    const restoredPhotos: ListingPhoto[] =
      [...(draft.photos ?? [])]
        .sort(
          (
            firstPhoto,
            secondPhoto
          ) =>
            firstPhoto.sortOrder -
            secondPhoto.sortOrder
        )
        .map(photo => ({
          id:
            photo.id,

          originalFileName:
            photo.originalFileName,

          fullImage: {
            blob: null,

            previewUrl:
              photo.fullImageUrl,

            width:
              photo.width,

            height:
              photo.height,

            size:
              photo.sizeBytes,

            mimeType:
              'image/webp'
          },

          thumbnail: {
            blob: null,

            previewUrl:
              photo.thumbnailUrl,

            width:
              photo.thumbnailWidth,

            height:
              photo.thumbnailHeight,

            size:
              photo.thumbnailSizeBytes,

            mimeType:
              'image/webp'
          },

          isPrimary:
            photo.isPrimary,

          storageReference:
            photo
        }));

    this.photosData.set(
      restoredPhotos
    );

    if (restoredPhotos.length > 0) {
      this.setStepValidity(
        4,
        true
      );
    }


    if (draft.pricing) {
      this.pricingData.set({
        listPrice:
          draft.pricing.listPrice
      });

      this.setStepValidity(
        5,
        true
      );
    }


    this.featuredListing.set(
      draft.featuredListing
    );

    this.currentStep.set(
      this.stepNumberFromDraftStep(
        draft.progress.currentStep
      )
    );
  }


  private stepNumberFromDraftStep(
    draftStep: ListingDraftStep
  ): number {
    switch (draftStep) {
      case 'property_details':
        return 2;

      case 'property_features':
        return 3;

      case 'photos':
        return 4;

      case 'pricing':
        return 5;

      case 'review':
        return 6;

      case 'address':
      default:
        return 1;
    }
  }


  protected onStepValidityChange(
    step: number,
    isValid: boolean
  ): void {
    this.setStepValidity(
      step,
      isValid
    );
  }


  private setStepValidity(
    step: number,
    isValid: boolean
  ): void {
    this.stepValidity.update(
      validity => ({
        ...validity,
        [step]: isValid
      })
    );
  }


  protected onAddressChange(
    value: AddressFormValue
  ): void {
    this.addressData.set(
      value
    );

    this.invalidateCertification();
  }


  protected onPropertyDetailsChange(
    value: PropertyDetailsFormValue
  ): void {
    this.propertyDetailsData.set(
      value
    );

    this.invalidateCertification();
  }


  protected onPropertyFeaturesChange(
    value: PropertyFeaturesStepValue
  ): void {
    this.propertyFeaturesData.set(
      value
    );

    this.invalidateCertification();
  }


  protected async onPhotosChange(
    photos: ListingPhoto[]
  ): Promise<void> {
    this.photosData.set(
      photos
    );

    this.invalidateCertification();

    const listingUid =
      this.listingUid();

    const user =
      auth.currentUser;

    if (
      !listingUid ||
      !user ||
      this.isSavingPhotos()
    ) {
      return;
    }

    if (photos.length === 0) {
      this.photoSaveError.set(
        'At least one listing photo is required.'
      );

      return;
    }

    this.photoSaveError.set('');
    this.isSavingPhotos.set(true);

    try {
      const references =
        await this.listingPhotoStorageService
          .uploadPhotos(
            user.uid,
            listingUid,
            photos
          );

      await this.listingService
        .updateDraftPhotos(
          listingUid,
          user.uid,
          references,
          this.completedSteps()
        );

      this.addCompletedStep(
        'photos'
      );

      const persistedPhotos =
        photos.map(photo => {
          const storageReference =
            references.find(
              reference =>
                reference.id === photo.id
            );

          if (!storageReference) {
            return photo;
          }

          this.revokeTemporaryPhotoUrls(
            photo
          );

          return {
            ...photo,

            fullImage: {
              ...photo.fullImage,

              blob: null,

              previewUrl:
                storageReference
                  .fullImageUrl
            },

            thumbnail: {
              ...photo.thumbnail,

              blob: null,

              previewUrl:
                storageReference
                  .thumbnailUrl
            },

            isPrimary:
              storageReference.isPrimary,

            storageReference
          };
        });

      this.photosData.set(
        persistedPhotos
      );
    } catch (error) {
      console.error(
        'Failed to save listing photos.',
        error
      );

      this.photoSaveError.set(
        error instanceof Error
          ? error.message
          : 'We could not save your listing photos. Please try again.'
      );
    } finally {
      this.isSavingPhotos.set(false);
    }
  }


  protected onPricingChange(
    value: PricingFormValue
  ): void {
    this.pricingData.set(
      value
    );

    this.invalidateCertification();
  }


  protected onFeaturedListingChange(
    selected: boolean
  ): void {
    this.featuredListing.set(
      selected
    );

    this.appliedPromotion.set(
      null
    );

    this.invalidateCertification();
  }


  protected onPromotionApplied(
    promotion:
      ValidDiscountCodeResult | null
  ): void {
    this.appliedPromotion.set(
      promotion
    );

    this.invalidateCertification();
  }


  protected onCertificationChange(
    accepted: boolean
  ): void {
    this.certificationAccepted.set(
      accepted
    );

    this.setStepValidity(
      6,
      accepted
    );
  }


  protected isCurrentStepValid(): boolean {
    return (
      this.stepValidity()[
      this.currentStep()
      ] ?? false
    );
  }


  protected previousStep(): void {
    if (
      this.currentStep() <= 1 ||
      this.isSaving() ||
      this.isSavingPhotos()
    ) {
      return;
    }

    this.currentStep.update(
      step => step - 1
    );

    this.scrollToTop();
  }


  protected async nextStep(): Promise<void> {
    if (
      !this.isCurrentStepValid() ||
      this.isSaving() ||
      this.isSavingPhotos()
    ) {
      return;
    }

    this.saveError.set('');
    this.isSaving.set(true);

    try {
      await this.saveCurrentStep();

      if (
        this.currentStep() <
        this.steps.length
      ) {
        this.currentStep.update(
          step => step + 1
        );

        this.scrollToTop();
      }
    } catch (error) {
      console.error(
        'Failed to save listing step.',
        error
      );

      this.saveError.set(
        error instanceof Error
          ? error.message
          : 'We could not save this step. Please try again.'
      );
    } finally {
      this.isSaving.set(false);
    }
  }


  protected goToStep(
    step: number
  ): void {
    if (
      step < this.currentStep() &&
      !this.isSaving() &&
      !this.isSavingPhotos()
    ) {
      this.currentStep.set(
        step
      );

      this.scrollToTop();
    }
  }


  private async saveCurrentStep(): Promise<void> {
    const listingUid =
      this.listingUid();

    const user =
      auth.currentUser;

    if (!listingUid || !user) {
      throw new Error(
        'Your authenticated listing session could not be found.'
      );
    }

    switch (this.currentStep()) {
      case 1: {
        const address =
          this.addressData();

        if (!address) {
          throw new Error(
            'Please complete the property address.'
          );
        }

        await this.listingService
          .saveAddressStep(
            listingUid,
            user.uid,
            address
          );

        this.addCompletedStep(
          'address'
        );

        return;
      }

      case 2: {
        const propertyDetails =
          this.propertyDetailsData();

        if (
          !propertyDetails ||
          !propertyDetails.propertyType ||
          propertyDetails.bedrooms === null ||
          propertyDetails.bathrooms === null ||
          propertyDetails.squareFeet === null ||
          propertyDetails.yearBuilt === null
        ) {
          throw new Error(
            'Please complete all required property details.'
          );
        }

        const hoa =
          propertyDetails.hoa;

        if (
          hoa?.hasHoa === null ||
          hoa?.hasHoa === undefined
        ) {
          throw new Error(
            'Please indicate whether the property has an HOA.'
          );
        }

        if (
          hoa.hasHoa &&
          (
            hoa.feeAmount === null ||
            !hoa.feeFrequency
          )
        ) {
          throw new Error(
            'Please complete the required HOA information.'
          );
        }

        const hoaDetails: ListingHoa = {
          hasHoa: hoa.hasHoa,
          includedItems: [],

          ...(hoa.hasHoa &&
            hoa.feeAmount !== null
            ? {
              feeAmount: hoa.feeAmount
            }
            : {}),

          ...(hoa.hasHoa &&
            hoa.feeFrequency
            ? {
              feeFrequency: hoa.feeFrequency
            }
            : {})
        };

        await this.listingService
          .savePropertyDetailsStep(
            listingUid,
            user.uid,
            {
              propertyType:
                propertyDetails.propertyType,

              bedrooms:
                propertyDetails.bedrooms,

              fullBathrooms:
                Math.floor(
                  propertyDetails.bathrooms
                ),

              halfBathrooms:
                propertyDetails.bathrooms % 1 === 0
                  ? 0
                  : 1,

              squareFeet:
                propertyDetails.squareFeet,

              yearBuilt:
                propertyDetails.yearBuilt,

              lotSize:
                propertyDetails.lotSize ??
                undefined,

              lotSizeUnit:
                propertyDetails.lotSize !== null
                  ? propertyDetails.lotSizeUnit
                  : undefined,

              description:
                propertyDetails.description
            },
            hoaDetails,
            this.completedSteps()
          );

        this.addCompletedStep(
          'property_details'
        );

        return;
      }

      case 3: {
        const propertyFeatures =
          this.propertyFeaturesData();

        if (
          !propertyFeatures ||
          propertyFeatures.mode ===
          'unselected'
        ) {
          throw new Error(
            'Please complete the property features step.'
          );
        }

        const features: ListingFeatures =
          propertyFeatures.mode === 'skip'
            ? this.emptyFeatures()
            : this.toListingFeatures(
              propertyFeatures.features as
              PropertyFeaturesFormValue
            );

        await this.listingService
          .saveFeaturesStep(
            listingUid,
            user.uid,
            features,
            this.completedSteps()
          );

        this.addCompletedStep(
          'property_features'
        );

        return;
      }

      case 4: {
        const photos =
          this.photosData();

        if (photos.length === 0) {
          throw new Error(
            'At least one listing photo is required.'
          );
        }

        const references =
          photos
            .map(
              photo =>
                photo.storageReference
            )
            .filter(
              reference =>
                reference !== undefined
            );

        if (
          references.length !==
          photos.length
        ) {
          throw new Error(
            'Your photos are still being saved. Please wait a moment and try again.'
          );
        }

        await this.listingService
          .updateDraftPhotos(
            listingUid,
            user.uid,
            references,
            this.completedSteps()
          );

        this.addCompletedStep(
          'photos'
        );

        return;
      }

      case 5: {
        const pricing =
          this.pricingData();

        if (
          !pricing ||
          pricing.listPrice === null ||
          pricing.listPrice <= 0
        ) {
          throw new Error(
            'Please enter a valid listing price.'
          );
        }

        await this.listingService
          .savePricingStep(
            listingUid,
            user.uid,
            {
              listPrice:
                pricing.listPrice
            },
            this.featuredListing(),
            this.completedSteps()
          );

        this.addCompletedStep(
          'pricing'
        );

        return;
      }

      default:
        return;
    }
  }


  protected async completeListing(): Promise<void> {
    if (
      this.isSaving() ||
      this.isSavingPhotos() ||
      !this.isCurrentStepValid()
    ) {
      return;
    }

    if (!this.certificationAccepted()) {
      this.saveError.set(
        'You must accept the seller certification before continuing.'
      );

      return;
    }

    const listingUid =
      this.listingUid();

    const user =
      auth.currentUser;

    if (!listingUid || !user) {
      this.saveError.set(
        'Your authenticated listing session could not be found.'
      );

      return;
    }

    this.saveError.set('');
    this.isSaving.set(true);

    try {
      await this.listingService
        .completeListingContent(
          listingUid,
          user.uid,
          true
        );

      this.addCompletedStep(
        'review'
      );

      this.listingContentComplete.set(
        true
      );

      const verification =
        await this.identityVerificationService
          .startVerification(
            listingUid
          );

      if (verification.alreadyVerified) {
        await this.router.navigate(
          [
            '/sell/listings',
            listingUid,
            'payment'
          ],
          {
            replaceUrl: true
          }
        );

        return;
      }

      if (verification.verificationUrl) {
        window.location.assign(
          verification.verificationUrl
        );

        return;
      }

      if (
        verification.status ===
        'processing'
      ) {
        await this.router.navigate(
          [
            '/sell/listings',
            listingUid,
            'verification-return'
          ],
          {
            replaceUrl: true
          }
        );

        return;
      }

      throw new Error(
        'Stripe did not provide a verification link. Please try again.'
      );
    } catch (error) {
      console.error(
        'Failed to complete the listing or start identity verification.',
        error
      );

      this.saveError.set(
        error instanceof Error
          ? error.message
          : 'We could not continue to identity verification. Please try again.'
      );
    } finally {
      this.isSaving.set(false);
    }
  }


  private addCompletedStep(
    completedStep: ListingDraftStep
  ): void {
    const workflowOrder:
      ListingDraftStep[] = [
        'address',
        'property_details',
        'property_features',
        'photos',
        'pricing',
        'review'
      ];

    this.completedSteps.update(
      completedSteps => {
        const uniqueSteps =
          new Set([
            ...completedSteps,
            completedStep
          ]);

        return workflowOrder.filter(
          step => uniqueSteps.has(step)
        );
      }
    );
  }


  private invalidateCertification(): void {
    this.certificationAccepted.set(
      false
    );

    this.setStepValidity(
      6,
      false
    );

    this.listingContentComplete.set(
      false
    );
  }


  private toPropertyFeaturesFormValue(
    features: ListingFeatures
  ): PropertyFeaturesFormValue {
    return {
      kitchenIsland: features.kitchenIsland,
      pantry: features.pantry,
      stoneCountertops: features.stoneCountertops,
      stainlessAppliances: features.stainlessAppliances,
      gasRange: features.gasRange,
      doubleOven: features.doubleOven,
      fireplace: features.fireplace,
      hardwoodFloors: features.hardwoodFloors,
      vaultedCeilings: features.vaultedCeilings,
      homeOffice: features.homeOffice,
      bonusRoom: features.bonusRoom,
      basement: features.finishedBasement,
      walkInCloset: features.walkInCloset,
      ensuiteBath: features.ensuiteBath,
      doubleVanity: features.doubleVanity,
      soakingTub: features.soakingTub,
      separateShower: features.separateTubAndShower,
      deck: features.deck,
      patio: features.patio,
      porch: features.porch,
      fencedYard: features.fencedYard,
      pool: features.pool,
      outdoorKitchen: features.outdoorKitchen,
      attachedGarage: features.attachedGarage,
      detachedGarage: features.detachedGarage,
      carport: features.carport,
      evCharging: features.evChargingStatus !== 'none',
      centralHvac: features.centralHvac,
      heatPump: features.heatPump,
      gasHeat: features.gasHeat,
      centralAir: features.centralAir,
      solarPanels: features.solarPanels,
      generator: features.generator,
      smartThermostat: features.smartThermostat
    };
  }


  private toListingFeatures(
    features: PropertyFeaturesFormValue
  ): ListingFeatures {
    return {
      ...this.emptyListingFeatures(),
      kitchenIsland: features.kitchenIsland,
      pantry: features.pantry,
      stoneCountertops: features.stoneCountertops,
      stainlessAppliances: features.stainlessAppliances,
      gasRange: features.gasRange,
      doubleOven: features.doubleOven,
      fireplace: features.fireplace,
      hardwoodFloors: features.hardwoodFloors,
      vaultedCeilings: features.vaultedCeilings,
      homeOffice: features.homeOffice,
      bonusRoom: features.bonusRoom,
      finishedBasement: features.basement,
      walkInCloset: features.walkInCloset,
      ensuiteBath: features.ensuiteBath,
      doubleVanity: features.doubleVanity,
      soakingTub: features.soakingTub,
      separateTubAndShower: features.separateShower,
      deck: features.deck,
      patio: features.patio,
      porch: features.porch,
      fencedYard: features.fencedYard,
      pool: features.pool,
      outdoorKitchen: features.outdoorKitchen,
      attachedGarage: features.attachedGarage,
      detachedGarage: features.detachedGarage,
      carport: features.carport,
      evChargingStatus: features.evCharging
        ? 'installed'
        : 'none',
      centralHvac: features.centralHvac,
      heatPump: features.heatPump,
      gasHeat: features.gasHeat,
      centralAir: features.centralAir,
      solarPanels: features.solarPanels,
      generator: features.generator,
      smartThermostat: features.smartThermostat
    };
  }


  private emptyListingFeatures(): ListingFeatures {
    return {
      kitchenIsland: false,
      pantry: false,
      stoneCountertops: false,
      softCloseCabinetry: false,
      stainlessAppliances: false,
      gasRange: false,
      doubleOven: false,
      butlersPantry: false,
      fireplace: false,
      hardwoodFloors: false,
      vaultedCeilings: false,
      homeOffice: false,
      bonusRoom: false,
      finishedBasement: false,
      mudroom: false,
      homeGym: false,
      walkInCloset: false,
      customClosets: false,
      builtInShelving: false,
      crownMolding: false,
      wetBar: false,
      mediaRoom: false,
      soundproofing: false,
      ensuiteBath: false,
      doubleVanity: false,
      soakingTub: false,
      separateTubAndShower: false,
      largeWalkInShower: false,
      deck: false,
      patio: false,
      porch: false,
      balcony: false,
      fencedYard: false,
      irrigationSystem: false,
      matureLandscaping: false,
      landscapeLighting: false,
      pool: false,
      spaHotTub: false,
      coveredOutdoorLiving: false,
      outdoorCeilingFans: false,
      outdoorHeaters: false,
      outdoorKitchen: false,
      builtInGrill: false,
      firePit: false,
      outdoorFireplace: false,
      shed: false,
      barn: false,
      workshop: false,
      guestHouse: false,
      aduReady: false,
      greenhouse: false,
      gardenArea: false,
      attachedGarage: false,
      detachedGarage: false,
      carport: false,
      garageWorkshop: false,
      rvParking: false,
      boatParking: false,
      evChargingStatus: 'none',
      centralHvac: false,
      heatPump: false,
      gasHeat: false,
      centralAir: false,
      multiZoneHvac: false,
      solarPanels: false,
      generator: false,
      smartThermostat: false,
      smartLighting: false,
      smartLocks: false,
      securitySystem: false,
      securityCameras: false,
      videoDoorbell: false,
      hardwiredEthernet: false,
      builtInSpeakers: false,
      wholeHomeAirFiltration: false,
      waterFiltrationSystem: false,
      waterSenseFixtures: false
    };
  }


  private emptyFeatures(): ListingFeatures {
    return this.emptyListingFeatures();
  }


  private revokeTemporaryPhotoUrls(
    photo: ListingPhoto
  ): void {
    if (
      photo.fullImage.blob &&
      photo.fullImage.previewUrl
        .startsWith('blob:')
    ) {
      URL.revokeObjectURL(
        photo.fullImage.previewUrl
      );
    }

    if (
      photo.thumbnail.blob &&
      photo.thumbnail.previewUrl
        .startsWith('blob:')
    ) {
      URL.revokeObjectURL(
        photo.thumbnail.previewUrl
      );
    }
  }


  private scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}