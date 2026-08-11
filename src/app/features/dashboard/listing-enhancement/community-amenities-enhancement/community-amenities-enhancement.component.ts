import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  AuthService,
} from '../../../../core/authentication/services/auth.service';
import {
  ListingEnhancements,
} from '../../../../core/domains/listings/models/listing.model';
import {
  ListingService,
} from '../../../../core/domains/listings/services/listing.service';

interface CommunityAmenity {
  id: string;
  label: string;
  description?: string;
  category:
    | 'recreation'
    | 'outdoor'
    | 'neighborhood'
    | 'water'
    | 'services';
}

@Component({
  selector: 'app-community-amenities-enhancement',
  standalone: true,
  imports: [],
  templateUrl: './community-amenities-enhancement.component.html',
  styleUrl: './community-amenities-enhancement.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityAmenitiesEnhancementComponent
  implements OnInit
{
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly listingService = inject(ListingService);

  private currentEnhancements: ListingEnhancements = {};

  readonly recreationAmenities: readonly CommunityAmenity[] = [
    {
      id: 'communityPool',
      label: 'Community Pool',
      category: 'recreation',
    },
    {
      id: 'indoorPool',
      label: 'Indoor Pool',
      category: 'recreation',
    },
    {
      id: 'clubhouse',
      label: 'Clubhouse',
      category: 'recreation',
    },
    {
      id: 'fitnessCenter',
      label: 'Fitness Center',
      category: 'recreation',
    },
    {
      id: 'tennisCourts',
      label: 'Tennis Courts',
      category: 'recreation',
    },
    {
      id: 'pickleballCourts',
      label: 'Pickleball Courts',
      category: 'recreation',
    },
    {
      id: 'basketballCourts',
      label: 'Basketball Courts',
      category: 'recreation',
    },
    {
      id: 'volleyballCourts',
      label: 'Volleyball Courts',
      category: 'recreation',
    },
    {
      id: 'golfCourse',
      label: 'Golf Course',
      category: 'recreation',
    },
    {
      id: 'playground',
      label: 'Playground',
      category: 'recreation',
    },
    {
      id: 'gameRoom',
      label: 'Community Game Room',
      category: 'recreation',
    },
    {
      id: 'communityEventSpace',
      label: 'Community Event Space',
      category: 'recreation',
    },
  ];

  readonly outdoorAmenities: readonly CommunityAmenity[] = [
    {
      id: 'walkingTrails',
      label: 'Walking Trails',
      category: 'outdoor',
    },
    {
      id: 'bikingTrails',
      label: 'Biking Trails',
      category: 'outdoor',
    },
    {
      id: 'communityPark',
      label: 'Community Park',
      category: 'outdoor',
    },
    {
      id: 'dogPark',
      label: 'Dog Park',
      category: 'outdoor',
    },
    {
      id: 'communityGarden',
      label: 'Community Garden',
      category: 'outdoor',
    },
    {
      id: 'picnicArea',
      label: 'Picnic Area',
      category: 'outdoor',
    },
    {
      id: 'sportsFields',
      label: 'Sports Fields',
      category: 'outdoor',
    },
    {
      id: 'greenSpace',
      label: 'Community Green Space',
      category: 'outdoor',
    },
  ];

  readonly neighborhoodAmenities: readonly CommunityAmenity[] = [
    {
      id: 'gatedCommunity',
      label: 'Gated Community',
      category: 'neighborhood',
    },
    {
      id: 'guardedEntrance',
      label: 'Guarded Entrance',
      category: 'neighborhood',
    },
    {
      id: 'sidewalks',
      label: 'Sidewalks',
      category: 'neighborhood',
    },
    {
      id: 'streetLights',
      label: 'Street Lights',
      category: 'neighborhood',
    },
    {
      id: 'treeLinedStreets',
      label: 'Tree-Lined Streets',
      category: 'neighborhood',
    },
    {
      id: 'communityFirePit',
      label: 'Community Fire Pit',
      category: 'neighborhood',
    },
    {
      id: 'activeAdultCommunity',
      label: 'Active Adult Community',
      description:
        'The property is located within a community designed for residents aged 55 or older.',
      category: 'neighborhood',
    },
  ];

  readonly waterAmenities: readonly CommunityAmenity[] = [
    {
      id: 'lakeAccess',
      label: 'Lake Access',
      category: 'water',
    },
    {
      id: 'beachAccess',
      label: 'Beach Access',
      category: 'water',
    },
    {
      id: 'riverAccess',
      label: 'River Access',
      category: 'water',
    },
    {
      id: 'communityDock',
      label: 'Community Dock',
      category: 'water',
    },
    {
      id: 'boatRamp',
      label: 'Boat Ramp',
      category: 'water',
    },
    {
      id: 'marina',
      label: 'Marina',
      category: 'water',
    },
    {
      id: 'boatStorage',
      label: 'Community Boat Storage',
      category: 'water',
    },
  ];

  readonly communityServices: readonly CommunityAmenity[] = [
    {
      id: 'lawnMaintenance',
      label: 'Community Lawn Maintenance',
      category: 'services',
    },
    {
      id: 'exteriorMaintenance',
      label: 'Exterior Maintenance Included',
      category: 'services',
    },
    {
      id: 'snowRemoval',
      label: 'Snow Removal',
      category: 'services',
    },
    {
      id: 'trashPickup',
      label: 'Trash Pickup Included',
      category: 'services',
    },
    {
      id: 'communitySecurity',
      label: 'Community Security',
      category: 'services',
    },
    {
      id: 'onsiteManagement',
      label: 'On-Site Community Management',
      category: 'services',
    },
  ];

  readonly selectedAmenityIds =
    signal<ReadonlySet<string>>(new Set());

  readonly hasChanges = signal(false);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly lastSavedAt = signal<Date | null>(null);

  readonly selectedAmenityCount = computed(
    () => this.selectedAmenityIds().size,
  );

  readonly selectedRecreationCount = computed(() =>
    this.countSelectedAmenities(this.recreationAmenities),
  );

  readonly selectedOutdoorCount = computed(() =>
    this.countSelectedAmenities(this.outdoorAmenities),
  );

  readonly selectedNeighborhoodCount = computed(() =>
    this.countSelectedAmenities(this.neighborhoodAmenities),
  );

  readonly selectedWaterCount = computed(() =>
    this.countSelectedAmenities(this.waterAmenities),
  );

  readonly selectedServicesCount = computed(() =>
    this.countSelectedAmenities(this.communityServices),
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

      this.selectedAmenityIds.set(
        new Set(
          this.currentEnhancements.communityAmenities ?? [],
        ),
      );
    } catch (error: unknown) {
      console.error(
        'Unable to load community amenities:',
        error,
      );

      this.saveError.set(
        'We could not load the saved community amenities.',
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  isSelected(amenityId: string): boolean {
    return this.selectedAmenityIds().has(amenityId);
  }

  toggleAmenity(amenityId: string): void {
    const updatedSelections =
      new Set(this.selectedAmenityIds());

    if (updatedSelections.has(amenityId)) {
      updatedSelections.delete(amenityId);
    } else {
      updatedSelections.add(amenityId);
    }

    this.selectedAmenityIds.set(updatedSelections);
    this.hasChanges.set(true);
    this.saveError.set(null);
    this.lastSavedAt.set(null);
  }

  clearSelections(): void {
    if (this.selectedAmenityIds().size === 0) {
      return;
    }

    this.selectedAmenityIds.set(new Set());
    this.hasChanges.set(true);
    this.saveError.set(null);
    this.lastSavedAt.set(null);
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

    const updatedEnhancements: ListingEnhancements = {
      ...this.currentEnhancements,
      communityAmenities: Array.from(
        this.selectedAmenityIds(),
      ),
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
        'Unable to save community amenities:',
        error,
      );

      this.saveError.set(
        'We could not save these community amenities. Please try again.',
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

  private countSelectedAmenities(
    amenities: readonly CommunityAmenity[],
  ): number {
    const selectedIds = this.selectedAmenityIds();

    return amenities.filter(
      (amenity) => selectedIds.has(amenity.id),
    ).length;
  }
}