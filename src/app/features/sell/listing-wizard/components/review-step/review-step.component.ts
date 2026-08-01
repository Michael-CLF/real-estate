import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal
} from '@angular/core';

import {
  AddressFormValue
} from '../address-step/address-step.component';

import {
  PropertyDetailsFormValue
} from '../property-details-step/property-details-step.component';

import {
  PropertyFeaturesStepValue
} from '../property-features-step/property-features-step.component';

import {
  ListingPhoto
} from '../photos-step/photos-step.component';

import {
  PricingFormValue
} from '../pricing-step/pricing-step.component';

@Component({
  selector: 'app-review-step',
  standalone: true,
  imports: [],
  templateUrl: './review-step.component.html',
  styleUrl: './review-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReviewStepComponent {
  readonly address = input<AddressFormValue | null>(null);
  readonly propertyDetails = input<PropertyDetailsFormValue | null>(null);
  readonly features = input<PropertyFeaturesStepValue | null>(null);
  readonly photos = input<ListingPhoto[]>([]);
  readonly pricing = input<PricingFormValue | null>(null);

  readonly editStep = output<number>();
  readonly promoCodeChange = output<string>();

  readonly featuredListingChange = output<boolean>();
  readonly certificationChange = output<boolean>();
  readonly validityChange = output<boolean>();

  protected readonly promoCode = signal('');
  protected readonly featuredListing = signal(false);
  protected readonly certificationAccepted = signal(false);

  protected edit(step: number): void {
    this.editStep.emit(step);
  }

  protected onPromoCodeInput(value: string): void {
    const normalizedValue = value.trim().toUpperCase();

    this.promoCode.set(normalizedValue);
    this.promoCodeChange.emit(normalizedValue);
  }
  protected applyPromoCode(): void {
    const code = this.promoCode().trim();

    if (!code) {
      return;
    }

    this.promoCodeChange.emit(code);
  }

  protected get formattedAddress(): string {
    const address = this.address();

    if (!address) {
      return '—';
    }

    const line2 = address.addressLine2
      ? ` ${address.addressLine2}`
      : '';

    return `${address.addressLine1}${line2}, ${address.city}, ${address.state} ${address.zipCode}`;
  }

  protected get formattedPropertyType(): string {
    const propertyType = this.propertyDetails()?.propertyType;

    if (!propertyType) {
      return '—';
    }

    const labels: Record<string, string> = {
      condo: 'Condo',
      land: 'Land',
      mobile: 'Mobile Home',
      multi_family: 'Multi-Family',
      pud: 'PUD',
      single_family: 'Single Family',
      townhome: 'Townhome'
    };

    return labels[propertyType] ?? propertyType;
  }

  protected get formattedPrice(): string {
    const price = this.pricing()?.listPrice;

    if (!price) {
      return '—';
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  }

  protected get pricePerSquareFoot(): string {
    const price = this.pricing()?.listPrice;
    const squareFeet = this.propertyDetails()?.squareFeet;

    if (!price || !squareFeet) {
      return '—';
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price / squareFeet);
  }

  protected get selectedFeatures(): string[] {
    const featureData = this.features();

    if (
      !featureData ||
      featureData.mode === 'skip' ||
      featureData.mode === 'unselected'
    ) {
      return [];
    }

    const labels: Record<string, string> = {
      kitchenIsland: 'Kitchen Island',
      pantry: 'Pantry',
      stoneCountertops: 'Granite / Quartz Countertops',
      stainlessAppliances: 'Stainless Appliances',
      gasRange: 'Gas Range',
      doubleOven: 'Double Oven',
      fireplace: 'Fireplace',
      hardwoodFloors: 'Hardwood Floors',
      vaultedCeilings: 'Vaulted Ceilings',
      homeOffice: 'Home Office',
      bonusRoom: 'Bonus Room',
      basement: 'Basement',
      walkInCloset: 'Walk-In Closet',
      ensuiteBath: 'Ensuite Bath',
      doubleVanity: 'Double Vanity',
      soakingTub: 'Soaking Tub',
      separateShower: 'Separate Shower',
      deck: 'Deck',
      patio: 'Patio',
      porch: 'Porch',
      fencedYard: 'Fenced Yard',
      pool: 'Pool',
      outdoorKitchen: 'Outdoor Kitchen',
      attachedGarage: 'Attached Garage',
      detachedGarage: 'Detached Garage',
      carport: 'Carport',
      evCharging: 'EV Charging',
      centralHvac: 'Central HVAC',
      heatPump: 'Heat Pump',
      gasHeat: 'Gas Heat',
      centralAir: 'Central Air',
      solarPanels: 'Solar Panels',
      generator: 'Generator',
      smartThermostat: 'Smart Thermostat'
    };

    return Object.entries(featureData.features)
      .filter(([, selected]) => selected)
      .map(([key]) => labels[key] ?? key);
  }

  protected get primaryPhoto(): ListingPhoto | null {
    const photos = this.photos();

    return photos.find(photo => photo.isPrimary) ?? photos[0] ?? null;
  }

  protected formatNumber(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '—';
    }
    return new Intl.NumberFormat('en-US').format(value);
  }

  protected toggleFeaturedListing(): void {
    const selected = !this.featuredListing();

    this.featuredListing.set(selected);
    this.featuredListingChange.emit(selected);
  }
protected onCertificationChange(checked: boolean): void {
  this.certificationAccepted.set(checked);
  this.certificationChange.emit(checked);
  this.validityChange.emit(checked);
}
}