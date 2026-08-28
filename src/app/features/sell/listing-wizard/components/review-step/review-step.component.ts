import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  signal
} from '@angular/core';

import {
  DecimalPipe
} from '@angular/common';

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
  imports: [
    DecimalPipe
  ],
  templateUrl:
    './review-step.component.html',
  styleUrl:
    './review-step.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class ReviewStepComponent {
  readonly address =
    input<AddressFormValue | null>(
      null
    );

  readonly propertyDetails =
    input<PropertyDetailsFormValue | null>(
      null
    );

  readonly features =
    input<PropertyFeaturesStepValue | null>(
      null
    );

  readonly photos =
    input<ListingPhoto[]>([]);

  readonly pricing =
    input<PricingFormValue | null>(
      null
    );

  readonly initialFeaturedListing =
    input(false);

  readonly editStep =
    output<number>();

  readonly featuredListingChange =
    output<boolean>();

  readonly certificationChange =
    output<boolean>();

  readonly validityChange =
    output<boolean>();

  protected readonly featuredListing =
    signal(false);

  protected readonly certificationAccepted =
    signal(false);


  constructor() {
    effect(() => {
      this.featuredListing.set(
        this.initialFeaturedListing()
      );
    });
  }


  protected edit(
    step: number
  ): void {
    this.editStep.emit(
      step
    );
  }


  protected get formattedAddress():
    string {
    const address =
      this.address();

    if (!address) {
      return '—';
    }

    const line2 =
      address.addressLine2
        ? ` ${address.addressLine2}`
        : '';

    return (
      `${address.addressLine1}` +
      `${line2}, ` +
      `${address.city}, ` +
      `${address.state} ` +
      `${address.zipCode}`
    );
  }


  protected get formattedPropertyType():
    string {
    const propertyType =
      this.propertyDetails()
        ?.propertyType;

    if (!propertyType) {
      return '—';
    }

    const labels:
      Record<string, string> = {
      condo:
        'Condo',

      land:
        'Land',

      mobile:
        'Mobile Home',

      multi_family:
        'Multi-Family',

      pud:
        'PUD',

      single_family:
        'Single Family',

      townhome:
        'Townhome'
    };

    return (
      labels[propertyType] ??
      propertyType
    );
  }


  protected get formattedPrice():
    string {
    const price =
      this.pricing()
        ?.listPrice;

    if (!price) {
      return '—';
    }

    return new Intl.NumberFormat(
      'en-US',
      {
        style:
          'currency',

        currency:
          'USD',

        maximumFractionDigits:
          0
      }
    ).format(
      price
    );
  }


  protected get pricePerSquareFoot():
    string {
    const price =
      this.pricing()
        ?.listPrice;

    const squareFeet =
      this.propertyDetails()
        ?.squareFeet;

    if (
      !price ||
      !squareFeet
    ) {
      return '—';
    }

    return new Intl.NumberFormat(
      'en-US',
      {
        style:
          'currency',

        currency:
          'USD',

        minimumFractionDigits:
          2,

        maximumFractionDigits:
          2
      }
    ).format(
      price /
      squareFeet
    );
  }


  protected get selectedFeatures():
    string[] {
    const featureData =
      this.features();

    if (
      !featureData ||
      featureData.mode ===
      'unselected'
    ) {
      return [];
    }

    const sectionLabels:
      Record<
        string,
        string
      > = {
      accessibility:
        'Accessibility',

      bedroomsBathrooms:
        'Bedrooms & Bathrooms',

      communityAmenities:
        'Community Amenities',

      construction:
        'Construction & Exterior',

      interior:
        'Interior & Living Spaces',

      kitchen:
        'Kitchen',

      outdoorLiving:
        'Outdoor Living',

      parkingStorage:
        'Parking & Storage',

      systemsUtilities:
        'Systems, Utilities & Efficiency',

      technologySecurity:
        'Technology & Security'
    };

    return Object.entries(
      featureData.enhancements
    )
      .filter(
        (
          [
            ,
            selectedValues
          ]
        ) =>
          Array.isArray(
            selectedValues
          ) &&
          selectedValues.length > 0
      )
      .map(
        (
          [
            sectionKey,
            selectedValues
          ]
        ) => {
          const sectionLabel =
            sectionLabels[
            sectionKey
            ] ??
            sectionKey;

          const selectionCount =
            selectedValues.length;

          return (
            `${sectionLabel} ` +
            `(${selectionCount})`
          );
        }
      )
      .sort(
        (
          firstSection,
          secondSection
        ) =>
          firstSection.localeCompare(
            secondSection
          )
      );
  }

  protected get primaryPhoto():
    ListingPhoto |
    null {
    const photos =
      this.photos();

    return (
      photos.find(
        photo =>
          photo.isPrimary
      ) ??
      photos[0] ??
      null
    );
  }


  protected formatNumber(
    value:
      number |
      null |
      undefined
  ): string {
    if (
      value === null ||
      value === undefined
    ) {
      return '—';
    }

    return new Intl.NumberFormat(
      'en-US'
    ).format(
      value
    );
  }


  protected toggleFeaturedListing():
    void {
    const selected =
      !this.featuredListing();

    this.featuredListing.set(
      selected
    );

    this.featuredListingChange.emit(
      selected
    );
  }


  protected onCertificationChange(
    checked: boolean
  ): void {
    this.certificationAccepted.set(
      checked
    );

    this.certificationChange.emit(
      checked
    );

    this.validityChange.emit(
      checked
    );
  }
}