import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal
} from '@angular/core';

import {
  ActivatedRoute,
  Router,
} from '@angular/router';

import {
  AuthService,
} from '../../../../core/authentication/services/auth.service';

import {
  ListingEnhancements,
} from '../../../../core/domains/listings/models/listing.model';

import {
  ListingService,
} from '../../../../core/domains/listings/services/listing.service';

interface OutdoorLivingFeature {
  id: string;
  label: string;
  description?: string;
  category:
  | 'patioDeck'
  | 'porch'
  | 'entertaining'
  | 'poolSpa'
  | 'landscaping'
  | 'recreation';
}

interface OutdoorLivingFeatureGroup {
  id: string;
  title: string;
  description: string;
  icon: string;
  features:
  readonly OutdoorLivingFeature[];
}

@Component({
  selector: 'app-outdoor-living-enhancement',
  standalone: true,
  imports: [],
  templateUrl: './outdoor-living-enhancement.component.html',
  styleUrl: './outdoor-living-enhancement.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutdoorLivingEnhancementComponent
  implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly listingService = inject(ListingService);

  readonly wizardMode =
    input(false);

  readonly wizardListingUid =
    input<string | null>(null);

  readonly initialEnhancements =
    input<ListingEnhancements>({});

  readonly enhancementsChange =
    output<ListingEnhancements>();

  readonly returnRequested =
    output<void>();

  private currentEnhancements: ListingEnhancements = {};

  readonly patioDeckFeatures: readonly OutdoorLivingFeature[] = [
    {
      id: 'balcony',
      label: 'Balcony',
      category: 'patioDeck',
    },
    {
      id: 'compositeDeck',
      label: 'Composite Deck',
      description:
        'The deck uses composite or similarly low-maintenance materials.',
      category: 'patioDeck',
    },
    {
      id: 'concretePatio',
      label: 'Concrete Patio',
      category: 'patioDeck',
    },
    {
      id: 'coveredDeck',
      label: 'Covered Deck',
      category: 'patioDeck',
    },
    {
      id: 'coveredPatio',
      label: 'Covered Patio',
      category: 'patioDeck',
    },
    {
      id: 'deck',
      label: 'Deck',
      category: 'patioDeck',
    },
    {
      id: 'gazebo',
      label: 'Gazebo',
      category: 'patioDeck',
    },
    {
      id: 'multiLevelDeck',
      label: 'Multi-Level Deck',
      category: 'patioDeck',
    },
    {
      id: 'patio',
      label: 'Patio',
      category: 'patioDeck',
    },
    {
      id: 'paverPatio',
      label: 'Paver Patio',
      category: 'patioDeck',
    },
    {
      id: 'pergola',
      label: 'Pergola',
      category: 'patioDeck',
    },
    {
      id: 'rooftopDeck',
      label: 'Rooftop Deck',
      category: 'patioDeck',
    },
    {
      id: 'screenedPatio',
      label: 'Screened Patio',
      category: 'patioDeck',
    },
    {
      id: 'stonePatio',
      label: 'Stone Patio',
      category: 'patioDeck',
    },
    {
      id: 'terrace',
      label: 'Terrace',
      category: 'patioDeck',
    },
    {
      id: 'woodDeck',
      label: 'Wood Deck',
      category: 'patioDeck',
    },
  ];

  readonly porchFeatures: readonly OutdoorLivingFeature[] = [
    {
      id: 'coveredFrontPorch',
      label: 'Covered Front Porch',
      category: 'porch',
    },
    {
      id: 'enclosedPorch',
      label: 'Enclosed Porch',
      category: 'porch',
    },
    {
      id: 'fourSeasonRoom',
      label: 'Four-Season Room',
      category: 'porch',
    },
    {
      id: 'frontPorch',
      label: 'Front Porch',
      category: 'porch',
    },
    {
      id: 'porch',
      label: 'Porch',
      category: 'porch',
    },
    {
      id: 'porchSwing',
      label: 'Porch Swing',
      category: 'porch',
    },
    {
      id: 'rearPorch',
      label: 'Rear Porch',
      category: 'porch',
    },
    {
      id: 'screenedPorch',
      label: 'Screened Porch',
      category: 'porch',
    },
    {
      id: 'sidePorch',
      label: 'Side Porch',
      category: 'porch',
    },
    {
      id: 'sleepingPorch',
      label: 'Sleeping Porch',
      category: 'porch',
    },
    {
      id: 'sunroom',
      label: 'Sunroom',
      description:
        'An enclosed living area designed to provide abundant natural light and outdoor views.',
      category: 'porch',
    },
    {
      id: 'threeSeasonRoom',
      label: 'Three-Season Room',
      category: 'porch',
    },
    {
      id: 'wraparoundPorch',
      label: 'Wraparound Porch',
      category: 'porch',
    },
  ];

  readonly entertainingFeatures: readonly OutdoorLivingFeature[] = [
    {
      id: 'builtInGrill',
      label: 'Built-In Grill',
      category: 'entertaining',
    },
    {
      id: 'builtInOutdoorSeating',
      label: 'Built-In Outdoor Seating',
      category: 'entertaining',
    },
    {
      id: 'exteriorLighting',
      label: 'Exterior Entertaining Lights',
      category: 'entertaining',
    },
    {
      id: 'firePit',
      label: 'Fire Pit',
      category: 'entertaining',
    },
    {
      id: 'gasFirePit',
      label: 'Gas Fire Pit',
      category: 'entertaining',
    },
    {
      id: 'outdoorBar',
      label: 'Outdoor Bar',
      category: 'entertaining',
    },
    {
      id: 'outdoorCeilingFans',
      label: 'Outdoor Ceiling Fans',
      category: 'entertaining',
    },
    {
      id: 'outdoorCooktop',
      label: 'Outdoor Cooktop',
      category: 'entertaining',
    },
    {
      id: 'outdoorDiningArea',
      label: 'Outdoor Dining Area',
      category: 'entertaining',
    },
    {
      id: 'outdoorFireplace',
      label: 'Outdoor Fireplace',
      category: 'entertaining',
    },
    {
      id: 'outdoorHeaters',
      label: 'Outdoor Heaters',
      category: 'entertaining',
    },
    {
      id: 'outdoorKitchen',
      label: 'Outdoor Kitchen',
      category: 'entertaining',
    },
    {
      id: 'outdoorLivingRoom',
      label: 'Outdoor Living Room',
      description:
        'A defined exterior gathering space arranged for seating and entertaining.',
      category: 'entertaining',
    },
    {
      id: 'outdoorPizzaOven',
      label: 'Outdoor Pizza Oven',
      category: 'entertaining',
    },
    {
      id: 'outdoorRefrigerator',
      label: 'Outdoor Refrigerator',
      category: 'entertaining',
    },
    {
      id: 'outdoorSink',
      label: 'Outdoor Sink',
      category: 'entertaining',
    },
    {
      id: 'outdoorSpeakers',
      label: 'Outdoor Speakers',
      category: 'entertaining',
    },
    {
      id: 'outdoorTelevision',
      label: 'Outdoor Television',
      category: 'entertaining',
    },
  ];

  readonly poolSpaFeatures: readonly OutdoorLivingFeature[] = [
    {
      id: 'aboveGroundPool',
      label: 'Above-Ground Pool',
      category: 'poolSpa',
    },
    {
      id: 'automaticPoolCover',
      label: 'Automatic Pool Cover',
      category: 'poolSpa',
    },
    {
      id: 'builtInSpa',
      label: 'Built-In Spa',
      category: 'poolSpa',
    },
    {
      id: 'divingBoard',
      label: 'Diving Board',
      category: 'poolSpa',
    },
    {
      id: 'heatedPool',
      label: 'Heated Pool',
      category: 'poolSpa',
    },
    {
      id: 'hotTub',
      label: 'Hot Tub',
      category: 'poolSpa',
    },
    {
      id: 'inGroundPool',
      label: 'In-Ground Pool',
      category: 'poolSpa',
    },
    {
      id: 'infinityPool',
      label: 'Infinity Pool',
      category: 'poolSpa',
    },
    {
      id: 'lapPool',
      label: 'Lap Pool',
      category: 'poolSpa',
    },
    {
      id: 'sauna',
      label: 'Outdoor Sauna',
      category: 'poolSpa',
    },
    {
      id: 'outdoorShower',
      label: 'Outdoor Shower',
      category: 'poolSpa',
    },
    {
      id: 'plungePool',
      label: 'Plunge Pool',
      category: 'poolSpa',
    },
    {
      id: 'poolDeck',
      label: 'Pool Deck',
      category: 'poolSpa',
    },
    {
      id: 'poolHouse',
      label: 'Pool House',
      category: 'poolSpa',
    },
    {
      id: 'poolSafetyFence',
      label: 'Pool Safety Fence',
      category: 'poolSpa',
    },
    {
      id: 'poolSlide',
      label: 'Pool Slide',
      category: 'poolSpa',
    },
    {
      id: 'poolWaterfall',
      label: 'Pool Waterfall',
      category: 'poolSpa',
    },
    {
      id: 'saltwaterPool',
      label: 'Saltwater Pool',
      category: 'poolSpa',
    },
    {
      id: 'swimmingPool',
      label: 'Swimming Pool',
      category: 'poolSpa',
    },
  ];

  readonly landscapingFeatures: readonly OutdoorLivingFeature[] = [
    {
      id: 'waterFeature',
      label: 'Decorative Water Feature',
      category: 'landscaping',
    },
    {
      id: 'dripIrrigation',
      label: 'Drip Irrigation',
      category: 'landscaping',
    },
    {
      id: 'flowerGardens',
      label: 'Flower Gardens',
      category: 'landscaping',
    },
    {
      id: 'fruitTrees',
      label: 'Fruit Trees',
      category: 'landscaping',
    },
    {
      id: 'gardenPaths',
      label: 'Garden Paths',
      category: 'landscaping',
    },
    {
      id: 'greenhouse',
      label: 'Greenhouse',
      category: 'landscaping',
    },
    {
      id: 'irrigationSystem',
      label: 'Irrigation System',
      category: 'landscaping',
    },
    {
      id: 'koiPond',
      label: 'Koi Pond',
      category: 'landscaping',
    },
    {
      id: 'landscapeLighting',
      label: 'Landscape Lighting',
      category: 'landscaping',
    },
    {
      id: 'lowMaintenanceLandscaping',
      label: 'Low-Maintenance Landscaping',
      category: 'landscaping',
    },
    {
      id: 'matureLandscaping',
      label: 'Mature Landscaping',
      category: 'landscaping',
    },
    {
      id: 'matureTrees',
      label: 'Mature Trees',
      category: 'landscaping',
    },
    {
      id: 'nativeLandscaping',
      label: 'Native Landscaping',
      category: 'landscaping',
    },
    {
      id: 'privacyLandscaping',
      label: 'Privacy Landscaping',
      description:
        'Trees, hedges, or plantings create additional privacy around outdoor areas.',
      category: 'landscaping',
    },
    {
      id: 'professionallyLandscaped',
      label: 'Professionally Landscaped',
      category: 'landscaping',
    },
    {
      id: 'rainGarden',
      label: 'Rain Garden',
      category: 'landscaping',
    },
    {
      id: 'raisedGardenBeds',
      label: 'Raised Garden Beds',
      category: 'landscaping',
    },
    {
      id: 'vegetableGarden',
      label: 'Vegetable Garden',
      category: 'landscaping',
    },
  ];

  readonly recreationFeatures: readonly OutdoorLivingFeature[] = [
    {
      id: 'basketballCourt',
      label: 'Basketball Court',
      category: 'recreation',
    },
    {
      id: 'boatOrRvParking',
      label: 'Boat or RV Parking',
      category: 'recreation',
    },
    {
      id: 'trampolineArea',
      label: 'Dedicated Trampoline Area',
      category: 'recreation',
    },
    {
      id: 'workshop',
      label: 'Detached Workshop',
      category: 'recreation',
    },
    {
      id: 'dogRun',
      label: 'Dog Run',
      category: 'recreation',
    },
    {
      id: 'fencedYard',
      label: 'Fenced Yard',
      category: 'recreation',
    },
    {
      id: 'horseshoePit',
      label: 'Horseshoe Pit',
      category: 'recreation',
    },
    {
      id: 'outdoorStorage',
      label: 'Outdoor Storage',
      category: 'recreation',
    },
    {
      id: 'pickleballCourt',
      label: 'Pickleball Court',
      category: 'recreation',
    },
    {
      id: 'playground',
      label: 'Playground',
      category: 'recreation',
    },
    {
      id: 'playset',
      label: 'Playset',
      category: 'recreation',
    },
    {
      id: 'privacyFence',
      label: 'Privacy Fence',
      category: 'recreation',
    },
    {
      id: 'privateDock',
      label: 'Private Dock',
      category: 'recreation',
    },
    {
      id: 'walkingTrail',
      label: 'Private Walking Trail',
      category: 'recreation',
    },
    {
      id: 'puttingGreen',
      label: 'Putting Green',
      category: 'recreation',
    },
    {
      id: 'sportCourt',
      label: 'Sport Court',
      category: 'recreation',
    },
    {
      id: 'storageShed',
      label: 'Storage Shed',
      category: 'recreation',
    },
    {
      id: 'tennisCourt',
      label: 'Tennis Court',
      category: 'recreation',
    },
  ];

  readonly featureGroups:
    readonly OutdoorLivingFeatureGroup[] = [
      {
        id: 'landscaping',
        title: 'Landscaping and Gardens',
        description:
          'Identify landscaping, gardens, irrigation, mature plantings, and decorative outdoor features.',
        icon: 'fa-solid fa-seedling',
        features:
          this.landscapingFeatures
      },
      {
        id: 'outdoor-entertaining',
        title:
          'Outdoor Cooking and Entertaining',
        description:
          'Select permanent cooking, dining, seating, lighting, heating, and entertainment features.',
        icon: 'fa-solid fa-fire-burner',
        features:
          this.entertainingFeatures
      },
      {
        id: 'patios-decks',
        title:
          'Patios, Decks and Terraces',
        description:
          'Identify the property’s finished outdoor surfaces, decks, balconies, pergolas, and other exterior gathering areas.',
        icon:
          'fa-solid fa-table-cells-large',
        features:
          this.patioDeckFeatures
      },
      {
        id: 'pools-spas',
        title: 'Pools and Spas',
        description:
          'Select installed pools, spas, pool structures, safety features, and related amenities.',
        icon:
          'fa-solid fa-person-swimming',
        features:
          this.poolSpaFeatures
      },
      {
        id: 'porches',
        title: 'Porches and Sunrooms',
        description:
          'Select covered, screened, enclosed, or conditioned spaces that connect the home’s interior and exterior living areas.',
        icon:
          'fa-solid fa-house-chimney-window',
        features:
          this.porchFeatures
      },
      {
        id: 'recreation',
        title:
          'Recreation, Fencing and Storage',
        description:
          'Identify fenced areas, recreation spaces, outdoor storage, workshops, parking, trails, and waterfront access.',
        icon:
          'fa-solid fa-basketball',
        features:
          this.recreationFeatures
      }
    ];

  readonly selectedFeatureIds =
    signal<ReadonlySet<string>>(new Set());

  readonly hasChanges = signal(false);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly lastSavedAt = signal<Date | null>(null);

  readonly selectedFeatureCount = computed(
    () => this.selectedFeatureIds().size,
  );

  readonly saveStatusText = computed(() => {
    if (this.isLoading()) {
      return 'Loading saved details...';
    }

    if (this.isSaving()) {
      return 'Saving...';
    }

    if (this.saveError()) {
      return 'Unable to save';
    }

    if (this.hasChanges()) {
      return 'Unsaved changes';
    }

    if (this.lastSavedAt()) {
      return 'All changes saved';
    }

    return '';
  });

  async ngOnInit():
    Promise<void> {
    if (this.wizardMode()) {
      this.currentEnhancements = {
        ...this.initialEnhancements()
      };

      this.selectedFeatureIds.set(
        new Set(
          this.currentEnhancements
            .outdoorLiving ?? []
        )
      );

      this.hasChanges.set(false);
      this.saveError.set(null);
      this.isLoading.set(false);

      return;
    }

    const listingUid =
      this.route.snapshot.paramMap.get(
        'listingUid'
      );

    if (!listingUid) {
      this.saveError.set(
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
        this.saveError.set(
          'The selected listing could not be found.'
        );

        return;
      }

      this.currentEnhancements =
        listing.enhancements ?? {};

      this.selectedFeatureIds.set(
        new Set(
          this.currentEnhancements
            .outdoorLiving ?? []
        )
      );
    } catch (error: unknown) {
      console.error(
        'Unable to load outdoor living enhancements:',
        error
      );

      this.saveError.set(
        'We could not load the saved outdoor living details.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  isSelected(featureId: string): boolean {
    return this.selectedFeatureIds().has(featureId);
  }

  toggleFeature(featureId: string): void {
    const updatedSelections =
      new Set(this.selectedFeatureIds());

    if (updatedSelections.has(featureId)) {
      updatedSelections.delete(featureId);
    } else {
      updatedSelections.add(featureId);
    }

    this.selectedFeatureIds.set(updatedSelections);
    this.hasChanges.set(true);
    this.saveError.set(null);
    this.lastSavedAt.set(null);
  }

  clearSelections(): void {
    if (this.selectedFeatureIds().size === 0) {
      return;
    }

    this.selectedFeatureIds.set(new Set());
    this.hasChanges.set(true);
    this.saveError.set(null);
    this.lastSavedAt.set(null);
  }

  async saveSection():
    Promise<void> {
    if (
      this.isSaving() ||
      this.isLoading() ||
      !this.hasChanges()
    ) {
      return;
    }

    const listingUid =
      this.wizardMode()
        ? this.wizardListingUid()
        : this.route.snapshot
          .paramMap.get(
            'listingUid'
          );

    const sellerUid =
      this.authService.currentUserUid;

    if (!listingUid) {
      this.saveError.set(
        'The selected listing could not be identified.'
      );

      return;
    }

    if (!sellerUid) {
      this.saveError.set(
        'You must be signed in to update this listing.'
      );

      return;
    }

    this.isSaving.set(true);
    this.saveError.set(null);

    const outdoorLivingSelections =
      Array.from(
        this.selectedFeatureIds()
      ).sort();

    const updatedEnhancements:
      ListingEnhancements = {
      ...this.currentEnhancements,
      outdoorLiving:
        outdoorLivingSelections
    };

    try {
      if (this.wizardMode()) {
        await this.listingService
          .updateDraft(
            listingUid,
            sellerUid,
            {
              enhancements:
                updatedEnhancements
            }
          );
      } else {
        await this.listingService
          .updatePublishedListing(
            listingUid,
            sellerUid,
            {
              enhancements:
                updatedEnhancements
            }
          );
      }

      this.currentEnhancements =
        updatedEnhancements;

      this.hasChanges.set(false);
      this.lastSavedAt.set(
        new Date()
      );

      if (this.wizardMode()) {
        this.enhancementsChange.emit(
          updatedEnhancements
        );
      }
    } catch (error: unknown) {
      console.error(
        'Unable to save outdoor living enhancements:',
        error
      );

      this.saveError.set(
        'We could not save these outdoor living details. Please try again.'
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  async returnToEnhancements():
    Promise<void> {
    if (this.wizardMode()) {
      this.returnRequested.emit();
      return;
    }

    const listingUid =
      this.route.snapshot.paramMap.get(
        'listingUid'
      );

    if (!listingUid) {
      this.saveError.set(
        'The selected listing could not be identified.'
      );

      return;
    }

    await this.router.navigate([
      '/sell/listings',
      listingUid,
      'enhancements'
    ]);
  }

  async viewListing(): Promise<void> {
    const listingUid =
      this.route.snapshot.paramMap.get('listingUid');

    if (!listingUid) {
      this.saveError.set(
        'The selected listing could not be identified.',
      );

      return;
    }

    await this.router.navigate([
      '/listings',
      listingUid,
    ]);
  }
}