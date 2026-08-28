import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal
} from '@angular/core';

import {
  ListingEnhancements,
  ListingSchools
} from '../../../../../core/domains/listings/models/listing.model';

import {
  AccessibilityEnhancementComponent
} from '../../../../dashboard/listing-enhancement/accessibility-enhancement/accessibility-enhancement.component';

import {
  BedroomsBathroomsEnhancementComponent
} from '../../../../dashboard/listing-enhancement/bedrooms-bathrooms-enhancement/bedrooms-bathrooms-enhancement.component';

import {
  CommunityAmenitiesEnhancementComponent
} from '../../../../dashboard/listing-enhancement/community-amenities-enhancement/community-amenities-enhancement.component';

import {
  ConstructionEnhancementComponent
} from '../../../../dashboard/listing-enhancement/construction-enhancement/construction-enhancement.component';

import {
  LivingSpacesEnhancementComponent
} from '../../../../dashboard/listing-enhancement/interior-enhancement/interior-enhancement.component';

import {
  KitchenEnhancementComponent
} from '../../../../dashboard/listing-enhancement/kitchen-enhancement/kitchen-enhancement.component';

import {
  OutdoorLivingEnhancementComponent
} from '../../../../dashboard/listing-enhancement/outdoor-living-enhancement/outdoor-living-enhancement.component';

import {
  ParkingStorageEnhancementComponent
} from '../../../../dashboard/listing-enhancement/parking-storage-enhancement/parking-storage-enhancement.component';

import {
  SystemUtilitiesEnhancementComponent
} from '../../../../dashboard/listing-enhancement/systems-utilities-enhancement/systems-utilities-enhancement.component';

import {
  TechnologySecurityEnhancementComponent
} from '../../../../dashboard/listing-enhancement/technology-security-enhancement/technology-security-enhancement.component';

import {
  SchoolsEnhancementComponent
} from '../../../../dashboard/listing-enhancement/schools-enhancement/schools-enhancement.component';

export type PropertyFeaturesMode =
  | 'unselected'
  | 'add'
  | 'skip';

export type EnhancementSectionId =
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

export interface PropertyFeaturesStepValue {
  mode: PropertyFeaturesMode;
  enhancements: ListingEnhancements;
  schools?: ListingSchools;
}

interface EnhancementSection {
  id: EnhancementSectionId;
  title: string;
  description: string;
  icon: string;
  enhancementKey?:
  keyof ListingEnhancements;
}

@Component({
  selector:
    'app-property-features-step',

  standalone: true,

  imports: [
    AccessibilityEnhancementComponent,
    BedroomsBathroomsEnhancementComponent,
    CommunityAmenitiesEnhancementComponent,
    ConstructionEnhancementComponent,
    KitchenEnhancementComponent,
    LivingSpacesEnhancementComponent,
    OutdoorLivingEnhancementComponent,
    ParkingStorageEnhancementComponent,
    SystemUtilitiesEnhancementComponent,
    TechnologySecurityEnhancementComponent,
    SchoolsEnhancementComponent,
  ],

  templateUrl:
    './property-features-step.component.html',

  styleUrl:
    './property-features-step.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class PropertyFeaturesStepComponent {
  readonly initialValue =
    input<PropertyFeaturesStepValue | null>(
      null
    );

  readonly listingUid =
    input<string | null>(null);

  readonly schoolsCompleted =
    input(false);

  readonly valueChange =
    output<PropertyFeaturesStepValue>();

  readonly validityChange =
    output<boolean>();

  protected readonly mode =
    signal<PropertyFeaturesMode>(
      'unselected'
    );

  protected readonly enhancements =
    signal<ListingEnhancements>({});

  protected readonly schools =
    signal<ListingSchools | null>(
      null
    );

  protected readonly activeSection =
    signal<EnhancementSectionId | null>(
      null
    );

  protected readonly sections:
    readonly EnhancementSection[] = [
      {
        id: 'accessibility',
        title: 'Accessibility',
        description:
          'Describe accessibility and aging-in-place features available in the home.',
        icon:
          'fa-solid fa-universal-access',
        enhancementKey:
          'accessibility'
      },
      {
        id: 'bedrooms-bathrooms',
        title: 'Bedrooms & Bathrooms',
        description:
          'Add bedroom, primary-suite, closet, vanity, tub, shower, and bathroom details.',
        icon:
          'fa-solid fa-bed',
        enhancementKey:
          'bedroomsBathrooms'
      },
      {
        id: 'community-amenities',
        title: 'Community Amenities',
        description:
          'Add shared amenities such as pools, clubhouses, trails, fitness facilities, and gated access.',
        icon:
          'fa-solid fa-people-roof',
        enhancementKey:
          'communityAmenities'
      },
      {
        id: 'construction',
        title: 'Construction & Exterior',
        description:
          'Add architectural style, exterior materials, roofing, foundation, and structural details.',
        icon:
          'fa-solid fa-house-chimney',
        enhancementKey:
          'construction'
      },
      {
        id: 'interior',
        title: 'Interior & Living Spaces',
        description:
          'Highlight flooring, fireplaces, living areas, offices, bonus rooms, and interior finishes.',
        icon:
          'fa-solid fa-couch',
        enhancementKey:
          'interior'
      },
      {
        id: 'kitchen',
        title: 'Kitchen',
        description:
          'Showcase countertops, appliances, cabinetry, pantry space, lighting, and other kitchen features.',
        icon:
          'fa-solid fa-kitchen-set',
        enhancementKey:
          'kitchen'
      },
      {
        id: 'outdoor-living',
        title: 'Outdoor Living',
        description:
          'Highlight decks, patios, porches, pools, spas, outdoor kitchens, gardens, and recreation areas.',
        icon:
          'fa-solid fa-umbrella-beach',
        enhancementKey:
          'outdoorLiving'
      },
      {
        id: 'parking-storage',
        title: 'Parking & Storage',
        description:
          'Describe the garage, carport, driveway, EV charging, workshop, and storage options.',
        icon:
          'fa-solid fa-car',
        enhancementKey:
          'parkingStorage'
      },
      {
        id: 'schools',
        title: 'Nearby Schools',
        description:
          'Add assigned elementary, middle, and high school information for buyers to review.',
        icon:
          'fa-solid fa-school'
      },
      {
        id: 'systems-utilities',
        title:
          'Systems, Utilities & Efficiency',
        description:
          'Add heating, cooling, water, sewer, energy-efficiency, solar, and generator information.',
        icon:
          'fa-solid fa-bolt',
        enhancementKey:
          'systemsUtilities'
      },
      {
        id: 'technology-security',
        title: 'Technology & Security',
        description:
          'Identify smart-home technology, structured wiring, security, automation, and connected features.',
        icon:
          'fa-solid fa-house-signal',
        enhancementKey:
          'technologySecurity'
      }
    ];

  protected readonly completedSectionCount =
    computed(
      () =>
        this.sections.filter(
          section =>
            this.sectionCompleted(
              section
            )
        ).length
    );

  protected readonly totalSectionCount =
    computed(
      () =>
        this.sections.length
    );

  protected readonly progressPercentage =
    computed(() => {
      const total =
        this.totalSectionCount();

      if (total === 0) {
        return 0;
      }

      return Math.round(
        (
          this.completedSectionCount() /
          total
        ) * 100
      );
    });

  constructor() {
    effect(() => {
      const initialValue =
        this.initialValue();

      if (!initialValue) {
        this.mode.set(
          'unselected'
        );

        this.enhancements.set({});
        this.schools.set(null);

        this.validityChange.emit(
          false
        );

        return;
      }

      this.mode.set(
        initialValue.mode
      );

      this.enhancements.set({
        ...initialValue.enhancements
      });

      this.schools.set(
        initialValue.schools
          ? {
            ...initialValue.schools
          }
          : null
      );

      this.validityChange.emit(
        initialValue.mode !==
        'unselected'
      );
    });
  }

  protected beginEnhancements(): void {
    this.mode.set('add');
    this.emitValue();
  }

  protected doThisLater(): void {
    this.mode.set('skip');
    this.activeSection.set(null);
    this.emitValue();
  }

  protected openSection(
    section: EnhancementSection
  ): void {
    this.mode.set('add');

    const connectedSections:
      readonly EnhancementSectionId[] = [
        'accessibility',
        'bedrooms-bathrooms',
        'community-amenities',
        'construction',
        'interior',
        'kitchen',
        'outdoor-living',
        'parking-storage',
        'schools',
        'systems-utilities',
        'technology-security'
      ];

    if (
      !connectedSections.includes(
        section.id
      )
    ) {
      return;
    }

    this.activeSection.set(
      section.id
    );

    this.emitValue();
  }

  protected onEnhancementsChange(
    enhancements:
      ListingEnhancements
  ): void {
    this.enhancements.set({
      ...enhancements
    });

    this.mode.set('add');

    this.emitValue();
  }

  protected onSchoolsChange(
    schools: ListingSchools
  ): void {
    this.schools.set({
      ...schools
    });

    this.mode.set('add');

    this.emitValue();
  }

  protected returnToSections(): void {
    this.activeSection.set(null);
  }

  protected sectionCompleted(
    section: EnhancementSection
  ): boolean {
    if (section.id === 'schools') {
      return (
        this.schoolsCompleted() ||
        this.schools() !== null
      );
    }

    if (!section.enhancementKey) {
      return false;
    }

    const selectedValues =
      this.enhancements()[
      section.enhancementKey
      ];

    return (
      Array.isArray(selectedValues) &&
      selectedValues.length > 0
    );
  }

  protected sectionStatus(
    section: EnhancementSection
  ): string {
    return this.sectionCompleted(
      section
    )
      ? 'Added'
      : 'Not Started';
  }

  protected sectionAction(
    section: EnhancementSection
  ): string {
    return this.sectionCompleted(
      section
    )
      ? 'Edit Details'
      : 'Add Details';
  }

 private emitValue(): void {
  const schools =
    this.schools();

  this.valueChange.emit({
    mode: this.mode(),

    enhancements: {
      ...this.enhancements()
    },

    ...(schools
      ? {
          schools: {
            ...schools
          }
        }
      : {})
  });

  this.validityChange.emit(
    this.mode() !==
    'unselected'
  );
}
}