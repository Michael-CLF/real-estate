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

interface BedroomBathroomFeature {
  id: string;
  label: string;
  description?: string;
  category: 'bedrooms' | 'bathrooms';
}

@Component({
  selector: 'app-bedrooms-bathrooms-enhancement',
  standalone: true,
  imports: [],
  templateUrl: './bedrooms-bathrooms-enhancement.component.html',
  styleUrl: './bedrooms-bathrooms-enhancement.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BedroomsBathroomsEnhancementComponent
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

  readonly bedroomFeatures: readonly BedroomBathroomFeature[] = [
    {
      id: 'ensuiteBedroom',
      label: 'Additional Ensuite Bedroom',
      description:
        'A secondary bedroom with its own private bathroom.',
      category: 'bedrooms',
    },
    {
      id: 'customClosetSystem',
      label: 'Custom Closet System',
      category: 'bedrooms',
    },
    {
      id: 'dualPrimarySuites',
      label: 'Dual Primary Suites',
      category: 'bedrooms',
    },
    {
      id: 'guestSuite',
      label: 'Guest Suite',
      category: 'bedrooms',
    },
    {
      id: 'mainFloorPrimaryBedroom',
      label: 'Main-Floor Primary Bedroom',
      description:
        'The primary bedroom is located on the main living level.',
      category: 'bedrooms',
    },
    {
      id: 'multipleWalkInClosets',
      label: 'Multiple Walk-In Closets',
      category: 'bedrooms',
    },
    {
      id: 'sittingArea',
      label: 'Primary Bedroom Sitting Area',
      category: 'bedrooms',
    },
    {
      id: 'privateBalcony',
      label: 'Private Bedroom Balcony',
      category: 'bedrooms',
    },
    {
      id: 'splitBedroomLayout',
      label: 'Split-Bedroom Layout',
      description:
        'The primary bedroom is separated from the other bedrooms.',
      category: 'bedrooms',
    },
    {
      id: 'walkInCloset',
      label: 'Walk-In Closet',
      category: 'bedrooms',
    },
  ];

  readonly bathroomFeatures: readonly BedroomBathroomFeature[] = [
    {
      id: 'linenStorage',
      label: 'Built-In Linen Storage',
      category: 'bathrooms',
    },
    {
      id: 'doubleVanity',
      label: 'Double Vanity',
      category: 'bathrooms',
    },
    {
      id: 'framelessGlassShower',
      label: 'Frameless Glass Shower',
      category: 'bathrooms',
    },
    {
      id: 'heatedBathroomFloors',
      label: 'Heated Bathroom Floors',
      category: 'bathrooms',
    },
    {
      id: 'jettedTub',
      label: 'Jetted Tub',
      category: 'bathrooms',
    },
    {
      id: 'makeupVanity',
      label: 'Makeup Vanity',
      category: 'bathrooms',
    },
    {
      id: 'multipleShowerHeads',
      label: 'Multiple Shower Heads',
      category: 'bathrooms',
    },
    {
      id: 'primaryEnsuiteBathroom',
      label: 'Primary Ensuite Bathroom',
      category: 'bathrooms',
    },
    {
      id: 'privateWaterCloset',
      label: 'Private Water Closet',
      category: 'bathrooms',
    },
    {
      id: 'rainfallShower',
      label: 'Rainfall Shower',
      category: 'bathrooms',
    },
    {
      id: 'separateShower',
      label: 'Separate Shower',
      category: 'bathrooms',
    },
    {
      id: 'separateTubAndShower',
      label: 'Separate Tub and Shower',
      category: 'bathrooms',
    },
    {
      id: 'soakingTub',
      label: 'Soaking Tub',
      category: 'bathrooms',
    },
    {
      id: 'walkInShower',
      label: 'Walk-In Shower',
      category: 'bathrooms',
    },
  ];

  readonly selectedFeatureIds =
    signal<ReadonlySet<string>>(new Set());

  readonly hasChanges = signal(false);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly lastSavedAt = signal<Date | null>(null);

  readonly selectedBedroomCount = computed(
    () =>
      this.bedroomFeatures.filter((feature) =>
        this.selectedFeatureIds().has(feature.id),
      ).length,
  );

  readonly selectedBathroomCount = computed(
    () =>
      this.bathroomFeatures.filter((feature) =>
        this.selectedFeatureIds().has(feature.id),
      ).length,
  );

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
            .bedroomsBathrooms ?? []
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
            .bedroomsBathrooms ?? []
        )
      );

      this.hasChanges.set(false);
    } catch (error: unknown) {
      console.error(
        'Unable to load bedroom and bathroom enhancements:',
        error
      );

      this.saveError.set(
        'We could not load the saved bedroom and bathroom details.'
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
  }

  clearSelections(): void {
    if (this.selectedFeatureIds().size === 0) {
      return;
    }

    this.selectedFeatureIds.set(new Set());
    this.hasChanges.set(true);
    this.saveError.set(null);
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
          .paramMap
          .get('listingUid');

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

    const updatedEnhancements:
      ListingEnhancements = {
      ...this.currentEnhancements,

      bedroomsBathrooms:
        Array.from(
          this.selectedFeatureIds()
        ).sort(
          (
            firstId,
            secondId
          ) =>
            firstId.localeCompare(
              secondId
            )
        )
    };

    this.isSaving.set(true);
    this.saveError.set(null);

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
        'Unable to save bedroom and bathroom enhancements:',
        error
      );

      this.saveError.set(
        'We could not save these bedroom and bathroom details. Please try again.'
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