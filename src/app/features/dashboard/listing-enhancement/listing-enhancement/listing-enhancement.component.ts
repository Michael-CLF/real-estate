import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  Listing,
  ListingEnhancements
} from '../../../../core/domains/listings/models/listing.model';

import {
  ListingService
} from '../../../../core/domains/listings/services/listing.service';

type EnhancementStatus =
  | 'not-started'
  | 'in-progress'
  | 'added';

type EnhancementSectionId =
  | 'accessibility'
  | 'bedrooms-bathrooms'
  | 'community-amenities'
  | 'construction'
  | 'interior'
  | 'kitchen'
  | 'outdoor-living'
  | 'parking-storage'
  | 'schools'
  | 'systems-utilities'
  | 'technology-security';

interface EnhancementSection {
  id: EnhancementSectionId;
  title: string;
  description: string;
  icon: string;
  status: EnhancementStatus;
}

@Component({
  selector:
    'app-listing-enhancement',

  standalone:
    true,

  imports: [
    CommonModule
  ],

  templateUrl:
    './listing-enhancement.component.html',

  styleUrl:
    './listing-enhancement.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class ListingEnhancementComponent
  implements OnInit {

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly listingService =
    inject(ListingService);

  readonly listingAddress =
    signal('Your property');

  readonly isLoading =
    signal(true);

  readonly loadError =
    signal<string | null>(null);

  readonly enhancementSections =
    signal<EnhancementSection[]>([
      {
        id: 'accessibility',
        title: 'Accessibility',
        description:
          'Describe objective accessibility and aging-in-place features available in the home.',
        icon:
          'fa-solid fa-universal-access',
        status: 'not-started'
      },
      {
        id: 'bedrooms-bathrooms',
        title: 'Bedrooms & Bathrooms',
        description:
          'Add primary-suite, closet, vanity, tub, shower, and bathroom comfort details.',
        icon:
          'fa-solid fa-bed',
        status: 'not-started'
      },
      {
        id: 'community-amenities',
        title: 'Community Amenities',
        description:
          'Add shared amenities such as pools, clubhouses, trails, fitness facilities, and gated access.',
        icon:
          'fa-solid fa-people-roof',
        status: 'not-started'
      },
      {
        id: 'construction',
        title: 'Construction & Exterior',
        description:
          'Add architectural style, exterior materials, roofing, foundation, and structural details.',
        icon:
          'fa-solid fa-house-chimney',
        status: 'not-started'
      },
      {
        id: 'interior',
        title: 'Interior & Living Spaces',
        description:
          'Highlight flooring, fireplaces, living areas, offices, bonus rooms, and interior finishes.',
        icon:
          'fa-solid fa-couch',
        status: 'not-started'
      },
      {
        id: 'kitchen',
        title: 'Kitchen',
        description:
          'Showcase countertops, appliances, cabinetry, pantry space, lighting, and other kitchen features.',
        icon:
          'fa-solid fa-kitchen-set',
        status: 'not-started'
      },
      {
        id: 'outdoor-living',
        title: 'Outdoor Living',
        description:
          'Highlight decks, patios, porches, pools, spas, outdoor kitchens, gardens, and recreation areas.',
        icon:
          'fa-solid fa-umbrella-beach',
        status: 'not-started'
      },
      {
        id: 'parking-storage',
        title: 'Parking & Storage',
        description:
          'Describe the garage, carport, driveway, EV charging, workshop, and storage options.',
        icon:
          'fa-solid fa-car',
        status: 'not-started'
      },
      {
        id: 'schools',
        title: 'Nearby Schools',
        description:
          'Add assigned elementary, middle, and high school information for buyers to review.',
        icon:
          'fa-solid fa-school',
        status: 'not-started'
      },
      {
        id: 'systems-utilities',
        title: 'Systems, Utilities & Efficiency',
        description:
          'Add heating, cooling, water, sewer, energy-efficiency, solar, and generator information.',
        icon:
          'fa-solid fa-bolt',
        status: 'not-started'
      },
      {
        id: 'technology-security',
        title: 'Technology & Security',
        description:
          'Identify smart-home technology, structured wiring, security, automation, and connected features.',
        icon:
          'fa-solid fa-house-signal',
        status: 'not-started'
      }
    ]);

  readonly addedSectionCount =
    computed(
      () =>
        this.enhancementSections()
          .filter(
            section =>
              section.status ===
              'added'
          )
          .length
    );

  readonly totalSectionCount =
    computed(
      () =>
        this.enhancementSections()
          .length
    );

  readonly progressPercentage =
    computed(() => {
      const total =
        this.totalSectionCount();

      if (total === 0) {
        return 0;
      }

      return Math.round(
        (
          this.addedSectionCount() /
          total
        ) * 100
      );
    });

  async ngOnInit():
    Promise<void> {
    const listingUid =
      this.route.snapshot
        .paramMap
        .get('listingUid');

    if (!listingUid) {
      this.loadError.set(
        'The selected listing could not be identified.'
      );

      this.isLoading.set(false);

      return;
    }

    try {
      const listing =
        await this.listingService
          .getPublishedListing(
            listingUid
          );

      if (!listing) {
        this.loadError.set(
          'The selected listing could not be found.'
        );

        return;
      }

      this.listingAddress.set(
        this.formatListingAddress(
          listing
        )
      );

      this.applySectionStatuses(
        listing
      );

    } catch (error: unknown) {
      console.error(
        'Unable to load listing enhancement progress:',
        error
      );

      this.loadError.set(
        'We could not load the saved listing enhancements.'
      );

    } finally {
      this.isLoading.set(false);
    }
  }

  async openSection(
    section: EnhancementSection
  ): Promise<void> {
    const listingUid =
      this.route.snapshot
        .paramMap
        .get('listingUid');

    if (!listingUid) {
      return;
    }

    await this.router.navigate([
      '/sell/listings',
      listingUid,
      'enhancements',
      section.id
    ]);
  }

  async returnToDashboard():
    Promise<void> {
    await this.router.navigate([
      '/dashboard'
    ]);
  }

  statusLabel(
    status: EnhancementStatus
  ): string {
    switch (status) {
      case 'added':
        return 'Added';

      case 'in-progress':
        return 'In Progress';

      default:
        return 'Not Started';
    }
  }

  sectionActionLabel(
    status: EnhancementStatus
  ): string {
    return status ===
      'not-started'
      ? 'Add Details'
      : 'Edit Details';
  }

  trackSection(
    _index: number,
    section: EnhancementSection
  ): string {
    return section.id;
  }

  private applySectionStatuses(
    listing: Listing
  ): void {
    const enhancements =
      listing.enhancements ?? {};

    this.enhancementSections.update(
      sections =>
        sections.map(
          section => ({
            ...section,

            status:
              this.hasSectionData(
                section.id,
                enhancements,
                listing
              )
                ? 'added'
                : 'not-started'
          })
        )
    );
  }

  private hasSectionData(
    sectionId: EnhancementSectionId,
    enhancements: ListingEnhancements,
    listing: Listing
  ): boolean {
    switch (sectionId) {
      case 'accessibility':
        return this.hasArrayValues(
          enhancements.accessibility
        );

      case 'bedrooms-bathrooms':
        return this.hasArrayValues(
          enhancements
            .bedroomsBathrooms
        );

      case 'community-amenities':
        return this.hasArrayValues(
          enhancements
            .communityAmenities
        );

      case 'construction':
        return this.hasArrayValues(
          enhancements.construction
        );

      case 'interior':
        return this.hasArrayValues(
          enhancements.interior
        );

      case 'kitchen':
        return this.hasArrayValues(
          enhancements.kitchen
        );

      case 'outdoor-living':
        return this.hasArrayValues(
          enhancements.outdoorLiving
        );

      case 'parking-storage':
        return this.hasArrayValues(
          enhancements.parkingStorage
        );

      case 'schools':
        return this.hasMeaningfulValue(
          listing.schools
        );

      case 'systems-utilities':
        return this.hasArrayValues(
          enhancements.systemsUtilities
        );

      case 'technology-security':
        return this.hasArrayValues(
          enhancements
            .technologySecurity
        );
    }
  }

  private hasArrayValues(
    values:
      | string[]
      | undefined
  ): boolean {
    return (
      Array.isArray(values) &&
      values.some(
        value =>
          typeof value === 'string' &&
          value.trim().length > 0
      )
    );
  }

  private hasMeaningfulValue(
    value: unknown
  ): boolean {
    if (
      value === null ||
      value === undefined
    ) {
      return false;
    }

    if (
      typeof value === 'string'
    ) {
      return (
        value.trim().length > 0
      );
    }

    if (
      typeof value === 'number'
    ) {
      return Number.isFinite(value);
    }

    if (
      typeof value === 'boolean'
    ) {
      return value;
    }

    if (
      Array.isArray(value)
    ) {
      return value.some(
        item =>
          this.hasMeaningfulValue(
            item
          )
      );
    }

    if (
      typeof value === 'object'
    ) {
      return Object.values(
        value as
          Record<string, unknown>
      ).some(
        item =>
          this.hasMeaningfulValue(
            item
          )
      );
    }

    return false;
  }

  private formatListingAddress(
    listing: Listing
  ): string {
    const cityStatePostal = [
      listing.city,
      listing.state
    ]
      .filter(Boolean)
      .join(', ');

    return [
      listing.addressLine1,

      [
        cityStatePostal,
        listing.zipCode
      ]
        .filter(Boolean)
        .join(' ')
    ]
      .filter(Boolean)
      .join(', ') ||
      'Your property';
  }
}