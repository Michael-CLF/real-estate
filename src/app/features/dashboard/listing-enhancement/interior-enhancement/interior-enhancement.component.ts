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

interface LivingSpaceFeature {
  id: string;
  label: string;
  description?: string;
}

@Component({
  selector: 'app-living-spaces-enhancement',
  standalone: true,
  imports: [],
  templateUrl: './interior-enhancement.component.html',
  styleUrl: './interior-enhancement.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LivingSpacesEnhancementComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly listingService = inject(ListingService);

  private currentEnhancements: ListingEnhancements = {};

  readonly livingSpaceFeatures: readonly LivingSpaceFeature[] = [
    {
      id: 'openFloorPlan',
      label: 'Open Floor Plan',
      description:
        'The main living areas flow together with minimal interior walls.',
    },
    {
      id: 'formalLivingRoom',
      label: 'Formal Living Room',
    },
    {
      id: 'familyRoom',
      label: 'Family Room',
    },
    {
      id: 'greatRoom',
      label: 'Great Room',
      description:
        'A large central living space combining multiple everyday functions.',
    },
    {
      id: 'formalDiningRoom',
      label: 'Formal Dining Room',
    },
    {
      id: 'homeOffice',
      label: 'Dedicated Home Office',
    },
    {
      id: 'bonusRoom',
      label: 'Bonus Room',
    },
    {
      id: 'loft',
      label: 'Loft',
    },
    {
      id: 'sunroom',
      label: 'Sunroom',
    },
    {
      id: 'library',
      label: 'Library',
    },
    {
      id: 'mediaRoom',
      label: 'Media Room',
    },
    {
      id: 'homeTheater',
      label: 'Home Theater',
    },
    {
      id: 'gameRoom',
      label: 'Game Room',
    },
    {
      id: 'exerciseRoom',
      label: 'Exercise Room / Home Gym',
    },
    {
      id: 'craftRoom',
      label: 'Craft or Hobby Room',
    },
    {
      id: 'mudroom',
      label: 'Mudroom',
    },
    {
      id: 'finishedBasement',
      label: 'Finished Basement',
    },
    {
      id: 'walkOutBasement',
      label: 'Walk-Out Basement',
    },
    {
      id: 'wetBar',
      label: 'Wet Bar',
    },
    {
      id: 'builtInShelving',
      label: 'Built-In Shelving',
    },
    {
      id: 'fireplace',
      label: 'Fireplace',
    },
    {
      id: 'multipleFireplaces',
      label: 'Multiple Fireplaces',
    },
    {
      id: 'vaultedCeilings',
      label: 'Vaulted Ceilings',
    },
    {
      id: 'trayCeilings',
      label: 'Tray Ceilings',
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
          this.currentEnhancements.interior ?? [],
        ),
      );
    } catch (error: unknown) {
      console.error(
        'Unable to load living-space enhancements:',
        error,
      );

      this.saveError.set(
        'We could not load the saved living-space details.',
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

    const interiorSelections =
      Array.from(this.selectedFeatureIds());

    const updatedEnhancements: ListingEnhancements = {
      ...this.currentEnhancements,
      interior: interiorSelections,
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
        'Unable to save living-space enhancements:',
        error,
      );

      this.saveError.set(
        'We could not save these living-space details. Please try again.',
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
}