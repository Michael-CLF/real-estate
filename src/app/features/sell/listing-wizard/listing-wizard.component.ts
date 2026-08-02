import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal
} from '@angular/core';

import { auth } from '../../../core/infrastructure/firebase/firebase';

import {
  ListingFeatures
} from '../../../core/domains/listings/models/listing.model';

import {
  ListingService
} from '../../../core/domains/listings/services/listing.service';

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
    ReviewStepComponent
  ],
  templateUrl: './listing-wizard.component.html',
  styleUrl: './listing-wizard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListingWizardComponent {
  private readonly listingService = inject(ListingService);

  protected readonly currentStep = signal(1);

  protected readonly photosData = signal<ListingPhoto[]>([]);

  protected readonly pricingData =
    signal<PricingFormValue | null>(null);

  protected readonly addressData =
    signal<AddressFormValue | null>(null);

  protected readonly propertyDetailsData =
    signal<PropertyDetailsFormValue | null>(null);

  protected readonly propertyFeaturesData =
    signal<PropertyFeaturesStepValue | null>(null);

  protected readonly featuredListing =
    signal(false);

  protected readonly appliedPromotion =
    signal<ValidDiscountCodeResult | null>(null);

  protected readonly certificationAccepted =
    signal(false);

  protected readonly isSaving =
    signal(false);

  protected readonly saveError =
    signal('');

  protected readonly createdListingUid =
    signal<string | null>(null);

  protected readonly stepValidity = signal<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false
  });

  protected readonly steps: WizardStep[] = [
    { number: 1, label: 'Address' },
    { number: 2, label: 'Property Details' },
    { number: 3, label: 'Features' },
    { number: 4, label: 'Photos' },
    { number: 5, label: 'Pricing' },
    { number: 6, label: 'Review' }
  ];

  protected onStepValidityChange(
    step: number,
    isValid: boolean
  ): void {
    this.stepValidity.update(validity => ({
      ...validity,
      [step]: isValid
    }));
  }

  protected onAddressChange(
    value: AddressFormValue
  ): void {
    this.addressData.set(value);
    this.invalidateCertification();
  }

  protected onPropertyDetailsChange(
    value: PropertyDetailsFormValue
  ): void {
    this.propertyDetailsData.set(value);
    this.invalidateCertification();
  }

  protected onPropertyFeaturesChange(
    value: PropertyFeaturesStepValue
  ): void {
    this.propertyFeaturesData.set(value);
    this.invalidateCertification();
  }

  protected onPhotosChange(
    photos: ListingPhoto[]
  ): void {
    this.photosData.set(photos);
    this.invalidateCertification();
  }

  protected onPricingChange(
    value: PricingFormValue
  ): void {
    this.pricingData.set(value);
    this.invalidateCertification();
  }

  protected onFeaturedListingChange(
    selected: boolean
  ): void {
    this.featuredListing.set(selected);

    /*
     * The purchase subtotal changed, so any previously
     * validated promotion should no longer be persisted.
     */
    this.appliedPromotion.set(null);
  }

  protected onPromotionApplied(
    promotion: ValidDiscountCodeResult | null
  ): void {
    this.appliedPromotion.set(promotion);
  }

  protected onCertificationChange(
    accepted: boolean
  ): void {
    this.certificationAccepted.set(accepted);

    this.onStepValidityChange(
      6,
      accepted
    );
  }

  protected isCurrentStepValid(): boolean {
    return this.stepValidity()[this.currentStep()] ?? false;
  }

  protected previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(
        step => step - 1
      );

      this.scrollToTop();
    }
  }

  protected nextStep(): void {
    if (!this.isCurrentStepValid()) {
      return;
    }

    if (this.currentStep() < this.steps.length) {
      this.currentStep.update(
        step => step + 1
      );

      this.scrollToTop();
    }
  }

  protected goToStep(step: number): void {
    if (step < this.currentStep()) {
      this.currentStep.set(step);
      this.scrollToTop();
    }
  }

  protected get authenticationStatus(): string {
    const user = auth.currentUser;

    if (!user) {
      return 'NOT SIGNED IN';
    }

    return `SIGNED IN — UID: ${user.uid}`;
  }

  protected async saveListing(): Promise<void> {
    if (
      this.isSaving() ||
      !this.isCurrentStepValid()
    ) {
      return;
    }

    this.saveError.set('');

    const user = auth.currentUser;

    if (!user) {
      this.saveError.set(
        'You must be signed in before creating a listing.'
      );
      return;
    }

    const address =
      this.addressData();

    const propertyDetails =
      this.propertyDetailsData();

    const propertyFeatures =
      this.propertyFeaturesData();

    const pricing =
      this.pricingData();

    if (
      !address ||
      !propertyDetails ||
      !propertyFeatures ||
      !pricing
    ) {
      this.saveError.set(
        'Some listing information is missing. Please review each step before continuing.'
      );
      return;
    }

    if (!this.certificationAccepted()) {
      this.saveError.set(
        'You must accept the seller certification before continuing.'
      );
      return;
    }

    if (!propertyDetails.propertyType) {
      this.saveError.set(
        'Please select a property type before continuing.'
      );
      return;
    }

    if (
      propertyDetails.bedrooms === null ||
      propertyDetails.bathrooms === null ||
      propertyDetails.squareFeet === null ||
      propertyDetails.yearBuilt === null
    ) {
      this.saveError.set(
        'Some required property details are missing. Please review the Property Details step.'
      );
      return;
    }

    if (
      propertyFeatures.mode === 'unselected'
    ) {
      this.saveError.set(
        'Please complete the property features step.'
      );
      return;
    }

    if (
      pricing.listPrice === null ||
      pricing.listPrice <= 0
    ) {
      this.saveError.set(
        'Please enter a valid listing price before continuing.'
      );
      return;
    }

    const features: ListingFeatures =
      propertyFeatures.mode === 'skip'
        ? this.emptyFeatures()
        : propertyFeatures.features;

    const promotion =
      this.appliedPromotion();

    this.isSaving.set(true);

    try {
      const listingUid =
        await this.listingService.createDraft({
          sellerUid: user.uid,

          address: {
            addressLine1:
              address.addressLine1,

            addressLine2:
              address.addressLine2,

            city:
              address.city,

            state:
              address.state,

            zipCode:
              address.zipCode,

            county:
              address.county
          },

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
          },

          features,

          pricing: {
            listPrice:
              pricing.listPrice
          },

          featuredListing:
            this.featuredListing(),

          promotion:
            promotion
              ? {
                code:
                  promotion.code,

                type:
                  promotion.type,

                value:
                  promotion.value,

                discountAmount:
                  promotion.discountAmount
              }
              : undefined,

          certificationAccepted:
            this.certificationAccepted()
        });

      this.createdListingUid.set(
        listingUid
      );

      console.log(
        'Draft listing created:',
        listingUid
      );

    } catch (error) {
      console.error(
        'Failed to create draft listing.',
        error
      );

      this.saveError.set(
        'We could not save your listing. Please try again.'
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  private invalidateCertification(): void {
    this.certificationAccepted.set(false);

    this.stepValidity.update(validity => ({
      ...validity,
      6: false
    }));
  }

  private emptyFeatures(): ListingFeatures {
    return {
      kitchenIsland: false,
      pantry: false,
      stoneCountertops: false,
      stainlessAppliances: false,
      gasRange: false,
      doubleOven: false,

      fireplace: false,
      hardwoodFloors: false,
      vaultedCeilings: false,
      homeOffice: false,
      bonusRoom: false,
      basement: false,

      walkInCloset: false,
      ensuiteBath: false,
      doubleVanity: false,
      soakingTub: false,
      separateShower: false,

      deck: false,
      patio: false,
      porch: false,
      fencedYard: false,
      pool: false,
      outdoorKitchen: false,

      attachedGarage: false,
      detachedGarage: false,
      carport: false,
      evCharging: false,

      centralHvac: false,
      heatPump: false,
      gasHeat: false,
      centralAir: false,
      solarPanels: false,
      generator: false,
      smartThermostat: false
    };
  }

  private scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}