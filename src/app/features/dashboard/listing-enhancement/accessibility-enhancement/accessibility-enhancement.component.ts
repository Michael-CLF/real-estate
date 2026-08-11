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

import { AuthService } from '../../../../core/authentication/services/auth.service';
import { ListingEnhancements } from '../../../../core/domains/listings/models/listing.model';
import { ListingService } from '../../../../core/domains/listings/services/listing.service';

interface AccessibilityFeature {
  id: string;
  label: string;
  description?: string;
  category:
    | 'entrance'
    | 'interior'
    | 'bathroom'
    | 'kitchen'
    | 'mobility'
    | 'sensory';
}

@Component({
  selector: 'app-accessibility-enhancement',
  standalone: true,
  imports: [],
  templateUrl: './accessibility-enhancement.component.html',
  styleUrl: './accessibility-enhancement.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessibilityEnhancementComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly listingService = inject(ListingService);

  private currentEnhancements: ListingEnhancements = {};

  readonly entranceFeatures: readonly AccessibilityFeature[] = [
    {
      id: 'stepFreeEntrance',
      label: 'Step-Free Entrance',
      description:
        'At least one exterior entrance can be accessed without using steps.',
      category: 'entrance',
    },
    {
      id: 'wheelchairAccessibleEntrance',
      label: 'Wheelchair-Accessible Entrance',
      category: 'entrance',
    },
    {
      id: 'entranceRamp',
      label: 'Entrance Ramp',
      category: 'entrance',
    },
    {
      id: 'coveredAccessibleEntrance',
      label: 'Covered Accessible Entrance',
      category: 'entrance',
    },
    {
      id: 'wideEntryDoor',
      label: 'Wide Entry Door',
      description:
        'The primary entry door provides additional clearance for mobility devices.',
      category: 'entrance',
    },
    {
      id: 'lowThresholdEntrance',
      label: 'Low-Threshold Entrance',
      category: 'entrance',
    },
    {
      id: 'levelEntryFromGarage',
      label: 'Level Entry from Garage',
      category: 'entrance',
    },
    {
      id: 'accessibleParkingRoute',
      label: 'Accessible Route from Parking',
      category: 'entrance',
    },
    {
      id: 'handrailsAtEntrance',
      label: 'Entrance Handrails',
      category: 'entrance',
    },
    {
      id: 'automaticEntryDoor',
      label: 'Automatic Entry Door',
      category: 'entrance',
    },
  ];

  readonly interiorFeatures: readonly AccessibilityFeature[] = [
    {
      id: 'singleLevelLiving',
      label: 'Single-Level Living',
      description:
        'Essential living areas are located on one accessible level.',
      category: 'interior',
    },
    {
      id: 'firstFloorBedroom',
      label: 'First-Floor Bedroom',
      category: 'interior',
    },
    {
      id: 'firstFloorFullBathroom',
      label: 'First-Floor Full Bathroom',
      category: 'interior',
    },
    {
      id: 'wideInteriorDoorways',
      label: 'Wide Interior Doorways',
      category: 'interior',
    },
    {
      id: 'wideHallways',
      label: 'Wide Hallways',
      category: 'interior',
    },
    {
      id: 'openFloorPlan',
      label: 'Open Floor Plan',
      category: 'interior',
    },
    {
      id: 'levelInteriorTransitions',
      label: 'Level Interior Transitions',
      description:
        'Flooring transitions have minimal or no raised thresholds.',
      category: 'interior',
    },
    {
      id: 'accessibleLightSwitches',
      label: 'Accessible Light Switches',
      category: 'interior',
    },
    {
      id: 'accessibleElectricalOutlets',
      label: 'Accessible Electrical Outlets',
      category: 'interior',
    },
    {
      id: 'leverDoorHandles',
      label: 'Lever-Style Door Handles',
      category: 'interior',
    },
    {
      id: 'lowPileFlooring',
      label: 'Low-Pile or Mobility-Friendly Flooring',
      category: 'interior',
    },
    {
      id: 'nonSlipFlooring',
      label: 'Non-Slip Flooring',
      category: 'interior',
    },
  ];

  readonly bathroomFeatures: readonly AccessibilityFeature[] = [
    {
      id: 'accessibleBathroom',
      label: 'Wheelchair-Accessible Bathroom',
      category: 'bathroom',
    },
    {
      id: 'rollInShower',
      label: 'Roll-In Shower',
      category: 'bathroom',
    },
    {
      id: 'curblessShower',
      label: 'Curbless Shower',
      category: 'bathroom',
    },
    {
      id: 'walkInTub',
      label: 'Walk-In Tub',
      category: 'bathroom',
    },
    {
      id: 'showerSeat',
      label: 'Built-In Shower Seat',
      category: 'bathroom',
    },
    {
      id: 'bathroomGrabBars',
      label: 'Bathroom Grab Bars',
      category: 'bathroom',
    },
    {
      id: 'reinforcedBathroomWalls',
      label: 'Reinforced Walls for Grab Bars',
      description:
        'Bathroom walls are reinforced to support current or future grab bars.',
      category: 'bathroom',
    },
    {
      id: 'handheldShowerhead',
      label: 'Handheld Showerhead',
      category: 'bathroom',
    },
    {
      id: 'accessibleVanity',
      label: 'Accessible Vanity',
      category: 'bathroom',
    },
    {
      id: 'raisedToilet',
      label: 'Comfort-Height Toilet',
      category: 'bathroom',
    },
    {
      id: 'accessibleBathroomControls',
      label: 'Accessible Bathroom Controls',
      category: 'bathroom',
    },
    {
      id: 'antiScaldFixtures',
      label: 'Anti-Scald Fixtures',
      category: 'bathroom',
    },
  ];

  readonly kitchenFeatures: readonly AccessibilityFeature[] = [
    {
      id: 'accessibleKitchen',
      label: 'Wheelchair-Accessible Kitchen',
      category: 'kitchen',
    },
    {
      id: 'loweredCountertops',
      label: 'Lowered Countertops',
      category: 'kitchen',
    },
    {
      id: 'adjustableCountertops',
      label: 'Adjustable-Height Countertops',
      category: 'kitchen',
    },
    {
      id: 'accessibleSink',
      label: 'Accessible Kitchen Sink',
      category: 'kitchen',
    },
    {
      id: 'kneeClearanceAtSink',
      label: 'Knee Clearance at Sink',
      category: 'kitchen',
    },
    {
      id: 'accessibleAppliances',
      label: 'Accessible Appliances',
      category: 'kitchen',
    },
    {
      id: 'sideOpeningOven',
      label: 'Side-Opening Oven',
      category: 'kitchen',
    },
    {
      id: 'frontControlRange',
      label: 'Front-Control Range',
      category: 'kitchen',
    },
    {
      id: 'pullOutShelving',
      label: 'Pull-Out Cabinet Shelving',
      category: 'kitchen',
    },
    {
      id: 'loweredStorage',
      label: 'Lowered Storage',
      category: 'kitchen',
    },
    {
      id: 'leverKitchenFaucet',
      label: 'Lever-Handle Kitchen Faucet',
      category: 'kitchen',
    },
    {
      id: 'openKitchenTurningSpace',
      label: 'Open Kitchen Turning Space',
      category: 'kitchen',
    },
  ];

  readonly mobilityFeatures: readonly AccessibilityFeature[] = [
    {
      id: 'residentialElevator',
      label: 'Residential Elevator',
      category: 'mobility',
    },
    {
      id: 'wheelchairLift',
      label: 'Wheelchair Lift',
      category: 'mobility',
    },
    {
      id: 'stairLift',
      label: 'Stair Lift',
      category: 'mobility',
    },
    {
      id: 'accessibleStaircase',
      label: 'Accessible Staircase',
      category: 'mobility',
    },
    {
      id: 'dualStairHandrails',
      label: 'Dual Stair Handrails',
      category: 'mobility',
    },
    {
      id: 'lowRiseStairs',
      label: 'Low-Rise Stairs',
      category: 'mobility',
    },
    {
      id: 'accessibleGarage',
      label: 'Accessible Garage',
      category: 'mobility',
    },
    {
      id: 'oversizedGarageBay',
      label: 'Oversized Garage Bay',
      description:
        'The garage provides additional side clearance for accessible vehicle entry.',
      category: 'mobility',
    },
    {
      id: 'accessiblePatio',
      label: 'Accessible Patio or Deck',
      category: 'mobility',
    },
    {
      id: 'accessibleOutdoorPath',
      label: 'Accessible Outdoor Path',
      category: 'mobility',
    },
    {
      id: 'agingInPlaceDesign',
      label: 'Aging-in-Place Design',
      category: 'mobility',
    },
    {
      id: 'universalDesign',
      label: 'Universal Design Features',
      description:
        'The home incorporates features intended to serve people with a wide range of abilities.',
      category: 'mobility',
    },
  ];

  readonly sensoryFeatures: readonly AccessibilityFeature[] = [
    {
      id: 'visualDoorbell',
      label: 'Visual Doorbell Alert',
      category: 'sensory',
    },
    {
      id: 'visualSmokeAlarms',
      label: 'Visual Smoke Alarms',
      category: 'sensory',
    },
    {
      id: 'visualCarbonMonoxideAlarms',
      label: 'Visual Carbon Monoxide Alarms',
      category: 'sensory',
    },
    {
      id: 'audibleSecurityAlerts',
      label: 'Audible Security Alerts',
      category: 'sensory',
    },
    {
      id: 'voiceActivatedControls',
      label: 'Voice-Activated Controls',
      category: 'sensory',
    },
    {
      id: 'smartHomeAccessibility',
      label: 'Accessible Smart-Home Controls',
      category: 'sensory',
    },
    {
      id: 'highContrastFeatures',
      label: 'High-Contrast Interior Features',
      category: 'sensory',
    },
    {
      id: 'enhancedInteriorLighting',
      label: 'Enhanced Interior Lighting',
      category: 'sensory',
    },
    {
      id: 'motionActivatedLighting',
      label: 'Motion-Activated Lighting',
      category: 'sensory',
    },
    {
      id: 'easyReadThermostat',
      label: 'Easy-Read Thermostat',
      category: 'sensory',
    },
    {
      id: 'accessibleSecuritySystem',
      label: 'Accessible Security System',
      category: 'sensory',
    },
  ];

  readonly selectedFeatureIds = signal<ReadonlySet<string>>(new Set());

  readonly isLoading = signal(true);
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

    if (this.isLoading()) {
      return 'Loading saved selections...';
    }

    if (this.saveError()) {
      return this.saveError() ?? 'Unable to save';
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
    const listingUid = this.route.snapshot.paramMap.get('listingUid');

    if (!listingUid) {
      this.saveError.set('The selected listing could not be identified.');
      this.isLoading.set(false);
      return;
    }

    try {
      const listing =
        await this.listingService.getPublishedListing(listingUid);

      if (!listing) {
        this.saveError.set('The selected listing could not be found.');
        return;
      }

      this.currentEnhancements = listing.enhancements ?? {};

      this.selectedFeatureIds.set(
        new Set(this.currentEnhancements.accessibility ?? []),
      );

      this.hasChanges.set(false);
    } catch (error: unknown) {
      console.error('Unable to load accessibility features:', error);

      this.saveError.set(
        'We could not load the saved accessibility features.',
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  isSelected(featureId: string): boolean {
    return this.selectedFeatureIds().has(featureId);
  }

  toggleFeature(featureId: string): void {
    if (this.isLoading() || this.isSaving()) {
      return;
    }

    const updatedSelections = new Set(this.selectedFeatureIds());

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
    if (
      this.isLoading() ||
      this.isSaving() ||
      this.selectedFeatureIds().size === 0
    ) {
      return;
    }

    this.selectedFeatureIds.set(new Set());
    this.hasChanges.set(true);
    this.saveError.set(null);
    this.lastSavedAt.set(null);
  }

  async saveSection(): Promise<void> {
    if (
      this.isLoading() ||
      this.isSaving() ||
      !this.hasChanges()
    ) {
      return;
    }

    const listingUid =
      this.route.snapshot.paramMap.get('listingUid');

    const sellerUid = this.authService.currentUserUid;

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
      accessibility: Array.from(this.selectedFeatureIds()),
    };

    try {
      await this.listingService.updatePublishedListing(
        listingUid,
        sellerUid,
        {
          enhancements: updatedEnhancements,
        },
      );

      this.currentEnhancements = updatedEnhancements;
      this.hasChanges.set(false);
      this.lastSavedAt.set(new Date());
    } catch (error: unknown) {
      console.error('Unable to save accessibility features:', error);

      this.saveError.set(
        'We could not save these accessibility features. Please try again.',
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

    await this.router.navigate(['/listings', listingUid]);
  }
}