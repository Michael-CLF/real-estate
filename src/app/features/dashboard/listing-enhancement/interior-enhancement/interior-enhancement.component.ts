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

  readonly livingSpaceFeatures: readonly LivingSpaceFeature[] = [
    {
      id: 'basement',
      label: 'Basement',
    },
    {
      id: 'bonusRoom',
      label: 'Bonus Room',
    },
    {
      id: 'builtInShelving',
      label: 'Built-In Shelving',
    },
    {
      id: 'craftRoom',
      label: 'Craft or Hobby Room',
    },
    {
      id: 'homeOffice',
      label: 'Dedicated Home Office',
    },
    {
      id: 'exerciseRoom',
      label: 'Exercise Room / Home Gym',
    },
    {
      id: 'familyRoom',
      label: 'Family Room',
    },
    {
      id: 'finishedBasement',
      label: 'Finished Basement',
    },
    {
      id: 'fireplace',
      label: 'Fireplace',
    },
    {
      id: 'formalDiningRoom',
      label: 'Formal Dining Room',
    },
    {
      id: 'formalLivingRoom',
      label: 'Formal Living Room',
    },
    {
      id: 'gameRoom',
      label: 'Game Room',
    },
    {
      id: 'greatRoom',
      label: 'Great Room',
      description:
        'A large central living space combining multiple everyday functions.',
    },
    {
      id: 'hardwoodFloors',
      label: 'Hardwood Floors',
    },
    {
      id: 'homeTheater',
      label: 'Home Theater',
    },
    {
      id: 'library',
      label: 'Library',
    },
    {
      id: 'loft',
      label: 'Loft',
    },
    {
      id: 'mediaRoom',
      label: 'Media Room',
    },
    {
      id: 'mudroom',
      label: 'Mudroom',
    },
    {
      id: 'multipleFireplaces',
      label: 'Multiple Fireplaces',
    },
    {
      id: 'openFloorPlan',
      label: 'Open Floor Plan',
      description:
        'The main living areas flow together with minimal interior walls.',
    },
    {
      id: 'sunroom',
      label: 'Sunroom',
    },
    {
      id: 'trayCeilings',
      label: 'Tray Ceilings',
    },
    {
      id: 'vaultedCeilings',
      label: 'Vaulted Ceilings',
    },
    {
      id: 'walkOutBasement',
      label: 'Walk-Out Basement',
    },
    {
      id: 'wetBar',
      label: 'Wet Bar',
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

  async ngOnInit():
    Promise<void> {
    if (this.wizardMode()) {
      this.currentEnhancements = {
        ...this.initialEnhancements()
      };

      this.selectedFeatureIds.set(
        new Set(
          this.currentEnhancements
            .interior ?? []
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
            .interior ?? []
        )
      );

      this.hasChanges.set(false);
    } catch (error: unknown) {
      console.error(
        'Unable to load living-space enhancements:',
        error
      );

      this.saveError.set(
        'We could not load the saved living-space details.'
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

      interior:
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
        'Unable to save living-space enhancements:',
        error
      );

      this.saveError.set(
        'We could not save these living-space details. Please try again.'
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