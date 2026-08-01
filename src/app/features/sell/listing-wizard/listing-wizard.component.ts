import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

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

import { ReviewStepComponent } from './components/review-step/review-step.component';

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

  protected onStepValidityChange(step: number, isValid: boolean): void {
    this.stepValidity.update(validity => ({
      ...validity,
      [step]: isValid
    }));
  }

  protected onAddressChange(value: AddressFormValue): void {
    this.addressData.set(value);
    this.invalidateCertification();
  }

  protected onPropertyDetailsChange(value: PropertyDetailsFormValue): void {
    this.propertyDetailsData.set(value);
    this.invalidateCertification();
  }

  protected onPropertyFeaturesChange(value: PropertyFeaturesStepValue): void {
    this.propertyFeaturesData.set(value);
    this.invalidateCertification();
  }

  protected onPhotosChange(photos: ListingPhoto[]): void {
    this.photosData.set(photos);
    this.invalidateCertification();
  }

  protected onPricingChange(value: PricingFormValue): void {
    this.pricingData.set(value);
    this.invalidateCertification();
  }

  protected isCurrentStepValid(): boolean {
    return this.stepValidity()[this.currentStep()] ?? false;
  }

  protected previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(step => step - 1);
      this.scrollToTop();
    }
  }

  protected nextStep(): void {
    if (!this.isCurrentStepValid()) {
      return;
    }

    if (this.currentStep() < this.steps.length) {
      this.currentStep.update(step => step + 1);
      this.scrollToTop();
    }
  }

  protected goToStep(step: number): void {
    if (step < this.currentStep()) {
      this.currentStep.set(step);
      this.scrollToTop();
    }
  }

  private invalidateCertification(): void {
    this.stepValidity.update(validity => ({
      ...validity,
      6: false
    }));
  }

  private scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}