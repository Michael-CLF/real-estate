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

interface KitchenFeature {
  id: string;
  label: string;
  description?: string;
}

@Component({
  selector: 'app-kitchen-enhancement',
  standalone: true,
  imports: [],
  templateUrl: './kitchen-enhancement.component.html',
  styleUrl: './kitchen-enhancement.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitchenEnhancementComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly listingService = inject(ListingService);

  private currentEnhancements: ListingEnhancements = {};

  readonly kitchenFeatures: readonly KitchenFeature[] = [
    {
      id: 'kitchenIsland',
      label: 'Kitchen Island',
      description: 'A freestanding or built-in central workspace.',
    },
    {
      id: 'walkInPantry',
      label: 'Walk-In Pantry',
      description: 'A dedicated pantry large enough to enter.',
    },
    {
      id: 'butlersPantry',
      label: "Butler's Pantry",
      description: 'A separate preparation or storage area near the kitchen.',
    },
    {
      id: 'stainlessSteelAppliances',
      label: 'Stainless-Steel Appliances',
    },
    {
      id: 'gasRange',
      label: 'Gas Range',
    },
    {
      id: 'doubleOven',
      label: 'Double Oven',
    },
    {
      id: 'stoneCountertops',
      label: 'Quartz / Stone Countertops',
    },
    {
      id: 'softCloseCabinetry',
      label: 'Soft-Close Cabinetry',
    },
    {
      id: 'breakfastNook',
      label: 'Breakfast Nook',
    },
    {
      id: 'farmhouseSink',
      label: 'Farmhouse / Apron-Front Sink',
    },
    {
      id: 'potFiller',
      label: 'Pot Filler',
    },
    {
      id: 'wineRefrigerator',
      label: 'Wine Refrigerator',
    },
    {
      id: 'underCabinetLighting',
      label: 'Under-Cabinet Lighting',
    },
    {
      id: 'waterFiltration',
      label: 'Water Filtration',
    },
    {
      id: 'instantHotWater',
      label: 'Instant Hot Water',
    },
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

  async ngOnInit(): Promise<void> {
    const listingUid =
      this.route.snapshot.paramMap.get('listingUid');

    if (!listingUid) {
      this.saveError.set(
        'The selected listing could not be identified.',
      );

      this.isLoading.set(false);
      return;
    }

    try {
      const listing =
        await this.listingService.getPublishedListing(
          listingUid,
        );

      if (!listing) {
        this.saveError.set(
          'The selected listing could not be found.',
        );

        return;
      }

      this.currentEnhancements =
        listing.enhancements ?? {};

      this.selectedFeatureIds.set(
        new Set(
          this.currentEnhancements.kitchen ?? [],
        ),
      );
    } catch (error: unknown) {
      console.error(
        'Unable to load kitchen enhancements:',
        error,
      );

      this.saveError.set(
        'We could not load the saved kitchen details.',
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
        'The selected listing could not be identified.',
      );

      return;
    }

    if (!sellerUid) {
      this.saveError.set(
        'You must be signed in to update this listing.',
      );

      return;
    }

    this.isSaving.set(true);
    this.saveError.set(null);

    const kitchenSelections =
      Array.from(this.selectedFeatureIds());

    const updatedEnhancements: ListingEnhancements = {
      ...this.currentEnhancements,
      kitchen: kitchenSelections,
    };

    try {
      await this.listingService.updatePublishedListing(
        listingUid,
        sellerUid,
        {
          enhancements: updatedEnhancements,
        },
      );

      this.currentEnhancements =
        updatedEnhancements;

      this.hasChanges.set(false);
      this.lastSavedAt.set(new Date());
    } catch (error: unknown) {
      console.error(
        'Unable to save kitchen enhancements:',
        error,
      );

      this.saveError.set(
        'We could not save these kitchen details. Please try again.',
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
        'The selected listing could not be identified.',
      );

      return;
    }

    await this.router.navigate([
      '/sell/listings',
      listingUid,
      'enhancements',
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

  trackFeature(
    _index: number,
    feature: KitchenFeature,
  ): string {
    return feature.id;
  }
}