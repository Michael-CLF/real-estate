import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  AuthService
} from '../../../../core/authentication/services/auth.service';

import {
  ListingEnhancements
} from '../../../../core/domains/listings/models/listing.model';

import {
  ListingService
} from '../../../../core/domains/listings/services/listing.service';

interface ConstructionFeature {
  id: string;
  label: string;
  description?: string;
  category:
  | 'architecture'
  | 'construction'
  | 'exterior'
  | 'foundation'
  | 'roof'
  | 'improvements';
}

@Component({
  selector: 'app-construction-enhancement',
  standalone: true,
  imports: [],
  templateUrl: './construction-enhancement.component.html',
  styleUrl: './construction-enhancement.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructionEnhancementComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly listingService = inject(ListingService);
   private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private currentEnhancements: ListingEnhancements = {};

  readonly isLoading = signal(true);

  readonly architecturalStyles: readonly ConstructionFeature[] = [
    {
      id: 'traditional',
      label: 'Traditional',
      category: 'architecture',
    },
    {
      id: 'colonial',
      label: 'Colonial',
      category: 'architecture',
    },
    {
      id: 'craftsman',
      label: 'Craftsman',
      category: 'architecture',
    },
    {
      id: 'ranch',
      label: 'Ranch',
      category: 'architecture',
    },
    {
      id: 'contemporary',
      label: 'Contemporary',
      category: 'architecture',
    },
    {
      id: 'modern',
      label: 'Modern',
      category: 'architecture',
    },
    {
      id: 'midCenturyModern',
      label: 'Mid-Century Modern',
      category: 'architecture',
    },
    {
      id: 'farmhouse',
      label: 'Farmhouse',
      category: 'architecture',
    },
    {
      id: 'modernFarmhouse',
      label: 'Modern Farmhouse',
      category: 'architecture',
    },
    {
      id: 'capeCod',
      label: 'Cape Cod',
      category: 'architecture',
    },
    {
      id: 'victorian',
      label: 'Victorian',
      category: 'architecture',
    },
    {
      id: 'tudor',
      label: 'Tudor',
      category: 'architecture',
    },
    {
      id: 'mediterranean',
      label: 'Mediterranean',
      category: 'architecture',
    },
    {
      id: 'spanish',
      label: 'Spanish',
      category: 'architecture',
    },
    {
      id: 'frenchCountry',
      label: 'French Country',
      category: 'architecture',
    },
    {
      id: 'coastal',
      label: 'Coastal',
      category: 'architecture',
    },
    {
      id: 'cottage',
      label: 'Cottage',
      category: 'architecture',
    },
    {
      id: 'logHome',
      label: 'Log Home',
      category: 'architecture',
    },
    {
      id: 'splitLevel',
      label: 'Split-Level',
      category: 'architecture',
    },
    {
      id: 'aFrame',
      label: 'A-Frame',
      category: 'architecture',
    },
  ];

  readonly constructionTypes: readonly ConstructionFeature[] = [
    {
      id: 'siteBuilt',
      label: 'Site-Built Home',
      category: 'construction',
    },
    {
      id: 'modular',
      label: 'Modular Construction',
      category: 'construction',
    },
    {
      id: 'manufactured',
      label: 'Manufactured Home',
      category: 'construction',
    },
    {
      id: 'prefabricated',
      label: 'Prefabricated Construction',
      category: 'construction',
    },
    {
      id: 'timberFrame',
      label: 'Timber-Frame Construction',
      category: 'construction',
    },
    {
      id: 'postAndBeam',
      label: 'Post-and-Beam Construction',
      category: 'construction',
    },
    {
      id: 'steelFrame',
      label: 'Steel-Frame Construction',
      category: 'construction',
    },
    {
      id: 'concreteConstruction',
      label: 'Concrete Construction',
      category: 'construction',
    },
    {
      id: 'insulatedConcreteForms',
      label: 'Insulated Concrete Forms',
      description:
        'Exterior walls constructed with reinforced insulated concrete forms.',
      category: 'construction',
    },
    {
      id: 'structuralInsulatedPanels',
      label: 'Structural Insulated Panels',
      category: 'construction',
    },
  ];

  readonly exteriorMaterials: readonly ConstructionFeature[] = [
    {
      id: 'brickExterior',
      label: 'Brick Exterior',
      category: 'exterior',
    },
    {
      id: 'stoneExterior',
      label: 'Stone Exterior',
      category: 'exterior',
    },
    {
      id: 'stuccoExterior',
      label: 'Stucco Exterior',
      category: 'exterior',
    },
    {
      id: 'fiberCementSiding',
      label: 'Fiber-Cement Siding',
      category: 'exterior',
    },
    {
      id: 'vinylSiding',
      label: 'Vinyl Siding',
      category: 'exterior',
    },
    {
      id: 'woodSiding',
      label: 'Wood Siding',
      category: 'exterior',
    },
    {
      id: 'engineeredWoodSiding',
      label: 'Engineered-Wood Siding',
      category: 'exterior',
    },
    {
      id: 'metalSiding',
      label: 'Metal Siding',
      category: 'exterior',
    },
    {
      id: 'boardAndBatten',
      label: 'Board-and-Batten Siding',
      category: 'exterior',
    },
    {
      id: 'cedarShingles',
      label: 'Cedar Shingles or Shakes',
      category: 'exterior',
    },
    {
      id: 'logExterior',
      label: 'Log Exterior',
      category: 'exterior',
    },
    {
      id: 'mixedMaterialExterior',
      label: 'Mixed-Material Exterior',
      category: 'exterior',
    },
  ];

  readonly foundationFeatures: readonly ConstructionFeature[] = [
    {
      id: 'concreteSlab',
      label: 'Concrete Slab',
      category: 'foundation',
    },
    {
      id: 'crawlSpace',
      label: 'Crawl Space',
      category: 'foundation',
    },
    {
      id: 'encapsulatedCrawlSpace',
      label: 'Encapsulated Crawl Space',
      category: 'foundation',
    },
    {
      id: 'fullBasement',
      label: 'Full Basement',
      category: 'foundation',
    },
    {
      id: 'partialBasement',
      label: 'Partial Basement',
      category: 'foundation',
    },
    {
      id: 'walkOutFoundation',
      label: 'Walk-Out Foundation',
      category: 'foundation',
    },
    {
      id: 'pierAndBeam',
      label: 'Pier-and-Beam Foundation',
      category: 'foundation',
    },
    {
      id: 'raisedFoundation',
      label: 'Raised Foundation',
      category: 'foundation',
    },
    {
      id: 'reinforcedFoundation',
      label: 'Reinforced Foundation',
      category: 'foundation',
    },
    {
      id: 'foundationDrainageSystem',
      label: 'Foundation Drainage System',
      category: 'foundation',
    },
    {
      id: 'sumpPump',
      label: 'Sump Pump',
      category: 'foundation',
    },
  ];

  readonly roofFeatures: readonly ConstructionFeature[] = [
    {
      id: 'architecturalShingles',
      label: 'Architectural Shingles',
      category: 'roof',
    },
    {
      id: 'asphaltShingles',
      label: 'Asphalt Shingles',
      category: 'roof',
    },
    {
      id: 'metalRoof',
      label: 'Metal Roof',
      category: 'roof',
    },
    {
      id: 'standingSeamMetalRoof',
      label: 'Standing-Seam Metal Roof',
      category: 'roof',
    },
    {
      id: 'tileRoof',
      label: 'Tile Roof',
      category: 'roof',
    },
    {
      id: 'slateRoof',
      label: 'Slate Roof',
      category: 'roof',
    },
    {
      id: 'woodShakeRoof',
      label: 'Wood-Shake Roof',
      category: 'roof',
    },
    {
      id: 'flatRoof',
      label: 'Flat Roof',
      category: 'roof',
    },
    {
      id: 'roofUnderlayment',
      label: 'Upgraded Roof Underlayment',
      category: 'roof',
    },
    {
      id: 'roofVentilation',
      label: 'Enhanced Roof Ventilation',
      category: 'roof',
    },
    {
      id: 'impactResistantRoof',
      label: 'Impact-Resistant Roofing',
      category: 'roof',
    },
  ];

  readonly structuralImprovements: readonly ConstructionFeature[] = [
    {
      id: 'newConstruction',
      label: 'New Construction',
      category: 'improvements',
    },
    {
      id: 'recentlyRenovated',
      label: 'Recently Renovated',
      category: 'improvements',
    },
    {
      id: 'majorAddition',
      label: 'Major Addition',
      description:
        'The home includes a substantial permitted addition to the original structure.',
      category: 'improvements',
    },
    {
      id: 'reinforcedStructure',
      label: 'Reinforced Structure',
      category: 'improvements',
    },
    {
      id: 'hurricaneStraps',
      label: 'Hurricane Straps or Ties',
      category: 'improvements',
    },
    {
      id: 'stormResistantConstruction',
      label: 'Storm-Resistant Construction',
      category: 'improvements',
    },
    {
      id: 'earthquakeReinforcement',
      label: 'Earthquake Reinforcement',
      category: 'improvements',
    },
    {
      id: 'fireResistantConstruction',
      label: 'Fire-Resistant Construction',
      category: 'improvements',
    },
    {
      id: 'soundproofing',
      label: 'Enhanced Soundproofing',
      category: 'improvements',
    },
    {
      id: 'energyEfficientConstruction',
      label: 'Energy-Efficient Construction',
      category: 'improvements',
    },
    {
      id: 'highPerformanceInsulation',
      label: 'High-Performance Insulation',
      category: 'improvements',
    },
    {
      id: 'sprayFoamInsulation',
      label: 'Spray-Foam Insulation',
      category: 'improvements',
    },
    {
      id: 'sealedBuildingEnvelope',
      label: 'Sealed Building Envelope',
      category: 'improvements',
    },
  ];

  readonly selectedFeatureIds = signal<ReadonlySet<string>>(new Set());

  readonly hasChanges = signal(false);
  readonly isSaving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly lastSavedAt = signal<Date | null>(null);

  readonly selectedFeatureCount = computed(
    () => this.selectedFeatureIds().size,
  );

  readonly saveStatusText = computed(() => {
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

  async ngOnInit(): Promise<void> {
    const listingUid =
      this.route.snapshot.paramMap.get('listingUid');

    if (!listingUid) {
      this.saveError.set(
        'The selected listing could not be identified.'
      );

      this.isLoading.set(false);
      return;
    }

    try {
      const listing =
        await this.listingService.getPublishedListing(
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
          this.currentEnhancements.construction ?? []
        )
      );
    } catch (error: unknown) {
      console.error(
        'Unable to load construction enhancements:',
        error
      );

      this.saveError.set(
        'We could not load the saved construction details.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  isSelected(featureId: string): boolean {
    return this.selectedFeatureIds().has(featureId);
  }

  toggleFeature(featureId: string): void {
    const updatedSelections = new Set(this.selectedFeatureIds());

    if (updatedSelections.has(featureId)) {
      updatedSelections.delete(featureId);
    } else {
      updatedSelections.add(featureId);
    }

    this.selectedFeatureIds.set(updatedSelections);
    this.hasChanges.set(true);
    this.saveError.set(null);
  }

  clearSelections(): void {
    if (this.selectedFeatureIds().size === 0) {
      return;
    }

    this.selectedFeatureIds.set(new Set());
    this.hasChanges.set(true);
    this.saveError.set(null);
  }

  async saveSection(): Promise<void> {
    if (this.isSaving() || this.isLoading()) {
      return;
    }

    const listingUid =
      this.route.snapshot.paramMap.get('listingUid');

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

    const constructionSelections =
      Array.from(this.selectedFeatureIds());

    const updatedEnhancements: ListingEnhancements = {
      ...this.currentEnhancements,
      construction: constructionSelections
    };

    try {
      await this.listingService.updatePublishedListing(
        listingUid,
        sellerUid,
        {
          enhancements: updatedEnhancements
        }
      );

      this.currentEnhancements =
        updatedEnhancements;

      this.hasChanges.set(false);
      this.lastSavedAt.set(new Date());
    } catch (error: unknown) {
      console.error(
        'Unable to save construction enhancements:',
        error
      );

      this.saveError.set(
        'We could not save these construction details. Please try again.'
      );
    } finally {
      this.isSaving.set(false);
    }
  }

 async returnToEnhancements(): Promise<void> {
  const listingUid =
    this.route.snapshot.paramMap.get('listingUid');

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
      'The selected listing could not be identified.'
    );

    return;
  }

  await this.router.navigate([
    '/listings',
    listingUid
  ]);
}
}