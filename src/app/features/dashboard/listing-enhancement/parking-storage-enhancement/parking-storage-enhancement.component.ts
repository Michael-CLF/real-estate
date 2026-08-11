import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../../core/authentication/services/auth.service';
import { ListingEnhancements } from '../../../../core/domains/listings/models/listing.model';
import { ListingService } from '../../../../core/domains/listings/services/listing.service';

interface ParkingStorageFeature {
  id: string;
  label: string;
  description?: string;
  category:
    | 'garage'
    | 'coveredParking'
    | 'driveway'
    | 'specialtyParking'
    | 'ev'
    | 'interiorStorage'
    | 'exteriorStorage'
    | 'workshop';
}

@Component({
  selector: 'app-parking-storage-enhancement',
  standalone: true,
  imports: [],
  templateUrl: './parking-storage-enhancement.component.html',
  styleUrl: './parking-storage-enhancement.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParkingStorageEnhancementComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly listingService = inject(ListingService);

  private currentEnhancements: ListingEnhancements = {};

  readonly garageFeatures: readonly ParkingStorageFeature[] = [
    {
      id: 'attachedGarage',
      label: 'Attached Garage',
      category: 'garage',
    },
    {
      id: 'detachedGarage',
      label: 'Detached Garage',
      category: 'garage',
    },
    {
      id: 'oneCarGarage',
      label: 'One-Car Garage',
      category: 'garage',
    },
    {
      id: 'twoCarGarage',
      label: 'Two-Car Garage',
      category: 'garage',
    },
    {
      id: 'threeCarGarage',
      label: 'Three-Car Garage',
      category: 'garage',
    },
    {
      id: 'fourPlusCarGarage',
      label: 'Four-or-More-Car Garage',
      category: 'garage',
    },
    {
      id: 'tandemGarage',
      label: 'Tandem Garage',
      description:
        'A garage with parking spaces arranged one behind another.',
      category: 'garage',
    },
    {
      id: 'sideEntryGarage',
      label: 'Side-Entry Garage',
      category: 'garage',
    },
    {
      id: 'rearEntryGarage',
      label: 'Rear-Entry Garage',
      category: 'garage',
    },
    {
      id: 'frontEntryGarage',
      label: 'Front-Entry Garage',
      category: 'garage',
    },
    {
      id: 'driveUnderGarage',
      label: 'Drive-Under Garage',
      category: 'garage',
    },
    {
      id: 'basementGarage',
      label: 'Basement Garage',
      category: 'garage',
    },
    {
      id: 'oversizedGarage',
      label: 'Oversized Garage',
      category: 'garage',
    },
    {
      id: 'extraDeepGarage',
      label: 'Extra-Deep Garage',
      description:
        'The garage provides additional depth for longer vehicles, equipment, or storage.',
      category: 'garage',
    },
    {
      id: 'finishedGarage',
      label: 'Finished Garage',
      category: 'garage',
    },
    {
      id: 'insulatedGarage',
      label: 'Insulated Garage',
      category: 'garage',
    },
    {
      id: 'heatedGarage',
      label: 'Heated Garage',
      category: 'garage',
    },
    {
      id: 'airConditionedGarage',
      label: 'Air-Conditioned Garage',
      category: 'garage',
    },
    {
      id: 'garageWindows',
      label: 'Garage Windows',
      category: 'garage',
    },
    {
      id: 'garageUtilitySink',
      label: 'Garage Utility Sink',
      category: 'garage',
    },
    {
      id: 'garageFloorDrain',
      label: 'Garage Floor Drain',
      category: 'garage',
    },
    {
      id: 'epoxyGarageFloor',
      label: 'Epoxy Garage Floor',
      category: 'garage',
    },
  ];

  readonly coveredParkingFeatures: readonly ParkingStorageFeature[] = [
    {
      id: 'attachedCarport',
      label: 'Attached Carport',
      category: 'coveredParking',
    },
    {
      id: 'detachedCarport',
      label: 'Detached Carport',
      category: 'coveredParking',
    },
    {
      id: 'oneCarCarport',
      label: 'One-Car Carport',
      category: 'coveredParking',
    },
    {
      id: 'twoCarCarport',
      label: 'Two-Car Carport',
      category: 'coveredParking',
    },
    {
      id: 'threePlusCarCarport',
      label: 'Three-or-More-Car Carport',
      category: 'coveredParking',
    },
    {
      id: 'porteCochere',
      label: 'Porte-Cochère',
      description:
        'A covered vehicle entrance attached to or positioned beside the home.',
      category: 'coveredParking',
    },
    {
      id: 'coveredParkingPad',
      label: 'Covered Parking Pad',
      category: 'coveredParking',
    },
    {
      id: 'coveredRvParking',
      label: 'Covered RV Parking',
      category: 'coveredParking',
    },
    {
      id: 'coveredBoatParking',
      label: 'Covered Boat Parking',
      category: 'coveredParking',
    },
  ];

  readonly drivewayFeatures: readonly ParkingStorageFeature[] = [
    {
      id: 'pavedDriveway',
      label: 'Paved Driveway',
      category: 'driveway',
    },
    {
      id: 'concreteDriveway',
      label: 'Concrete Driveway',
      category: 'driveway',
    },
    {
      id: 'asphaltDriveway',
      label: 'Asphalt Driveway',
      category: 'driveway',
    },
    {
      id: 'brickDriveway',
      label: 'Brick Driveway',
      category: 'driveway',
    },
    {
      id: 'paverDriveway',
      label: 'Paver Driveway',
      category: 'driveway',
    },
    {
      id: 'gravelDriveway',
      label: 'Gravel Driveway',
      category: 'driveway',
    },
    {
      id: 'circularDriveway',
      label: 'Circular Driveway',
      category: 'driveway',
    },
    {
      id: 'sharedDriveway',
      label: 'Shared Driveway',
      category: 'driveway',
    },
    {
      id: 'privateDriveway',
      label: 'Private Driveway',
      category: 'driveway',
    },
    {
      id: 'gatedDriveway',
      label: 'Gated Driveway',
      category: 'driveway',
    },
    {
      id: 'automaticDrivewayGate',
      label: 'Automatic Driveway Gate',
      category: 'driveway',
    },
    {
      id: 'heatedDriveway',
      label: 'Heated Driveway',
      category: 'driveway',
    },
    {
      id: 'drivewayTurnaround',
      label: 'Driveway Turnaround',
      category: 'driveway',
    },
    {
      id: 'additionalParkingPad',
      label: 'Additional Parking Pad',
      category: 'driveway',
    },
    {
      id: 'guestParking',
      label: 'Guest Parking',
      category: 'driveway',
    },
    {
      id: 'offStreetParking',
      label: 'Off-Street Parking',
      category: 'driveway',
    },
  ];

  readonly specialtyParkingFeatures: readonly ParkingStorageFeature[] = [
    {
      id: 'rvParking',
      label: 'RV Parking',
      category: 'specialtyParking',
    },
    {
      id: 'rvHookup',
      label: 'RV Hookup',
      category: 'specialtyParking',
    },
    {
      id: 'rvElectricalHookup',
      label: 'RV Electrical Hookup',
      category: 'specialtyParking',
    },
    {
      id: 'rvWaterHookup',
      label: 'RV Water Hookup',
      category: 'specialtyParking',
    },
    {
      id: 'boatParking',
      label: 'Boat Parking',
      category: 'specialtyParking',
    },
    {
      id: 'trailerParking',
      label: 'Trailer Parking',
      category: 'specialtyParking',
    },
    {
      id: 'motorcycleParking',
      label: 'Motorcycle Parking',
      category: 'specialtyParking',
    },
    {
      id: 'commercialVehicleParking',
      label: 'Commercial Vehicle Parking',
      category: 'specialtyParking',
    },
    {
      id: 'oversizedVehicleParking',
      label: 'Oversized Vehicle Parking',
      category: 'specialtyParking',
    },
    {
      id: 'golfCartParking',
      label: 'Golf Cart Parking',
      category: 'specialtyParking',
    },
    {
      id: 'coveredBicycleParking',
      label: 'Covered Bicycle Parking',
      category: 'specialtyParking',
    },
    {
      id: 'vehicleLift',
      label: 'Vehicle Lift',
      description:
        'A permanently installed lift provides elevated vehicle storage or service access.',
      category: 'specialtyParking',
    },
    {
      id: 'parkingCourt',
      label: 'Private Parking Court',
      category: 'specialtyParking',
    },
    {
      id: 'assignedParking',
      label: 'Assigned Parking',
      category: 'specialtyParking',
    },
    {
      id: 'deededParking',
      label: 'Deeded Parking',
      category: 'specialtyParking',
    },
  ];

  readonly evFeatures: readonly ParkingStorageFeature[] = [
    {
      id: 'evCharger',
      label: 'Electric Vehicle Charger',
      category: 'ev',
    },
    {
      id: 'levelOneEvCharger',
      label: 'Level 1 EV Charger',
      category: 'ev',
    },
    {
      id: 'levelTwoEvCharger',
      label: 'Level 2 EV Charger',
      category: 'ev',
    },
    {
      id: 'dcFastCharger',
      label: 'DC Fast Charger',
      category: 'ev',
    },
    {
      id: 'teslaWallConnector',
      label: 'Tesla Wall Connector',
      category: 'ev',
    },
    {
      id: 'dualEvChargers',
      label: 'Dual EV Chargers',
      category: 'ev',
    },
    {
      id: 'evReadyOutlet',
      label: 'EV-Ready Outlet',
      description:
        'A dedicated electrical outlet or circuit is installed for future EV charging equipment.',
      category: 'ev',
    },
    {
      id: 'evReadyWiring',
      label: 'EV-Ready Wiring',
      category: 'ev',
    },
    {
      id: 'solarPoweredEvCharging',
      label: 'Solar-Powered EV Charging',
      category: 'ev',
    },
  ];

  readonly interiorStorageFeatures: readonly ParkingStorageFeature[] = [
    {
      id: 'walkInClosets',
      label: 'Walk-In Closets',
      category: 'interiorStorage',
    },
    {
      id: 'customClosetSystem',
      label: 'Custom Closet System',
      category: 'interiorStorage',
    },
    {
      id: 'linenCloset',
      label: 'Linen Closet',
      category: 'interiorStorage',
    },
    {
      id: 'coatCloset',
      label: 'Coat Closet',
      category: 'interiorStorage',
    },
    {
      id: 'pantryStorage',
      label: 'Pantry Storage',
      category: 'interiorStorage',
    },
    {
      id: 'walkInPantry',
      label: 'Walk-In Pantry',
      category: 'interiorStorage',
    },
    {
      id: 'butlersPantryStorage',
      label: 'Butler’s Pantry Storage',
      category: 'interiorStorage',
    },
    {
      id: 'underStairStorage',
      label: 'Under-Stair Storage',
      category: 'interiorStorage',
    },
    {
      id: 'builtInCabinetry',
      label: 'Built-In Cabinetry',
      category: 'interiorStorage',
    },
    {
      id: 'builtInShelving',
      label: 'Built-In Shelving',
      category: 'interiorStorage',
    },
    {
      id: 'mudroomStorage',
      label: 'Mudroom Storage',
      category: 'interiorStorage',
    },
    {
      id: 'laundryRoomStorage',
      label: 'Laundry Room Storage',
      category: 'interiorStorage',
    },
    {
      id: 'basementStorage',
      label: 'Basement Storage',
      category: 'interiorStorage',
    },
    {
      id: 'atticStorage',
      label: 'Attic Storage',
      category: 'interiorStorage',
    },
    {
      id: 'walkUpAttic',
      label: 'Walk-Up Attic',
      category: 'interiorStorage',
    },
    {
      id: 'pullDownAtticAccess',
      label: 'Pull-Down Attic Access',
      category: 'interiorStorage',
    },
    {
      id: 'conditionedStorage',
      label: 'Conditioned Storage',
      description:
        'The storage area is served by heating, cooling, or both.',
      category: 'interiorStorage',
    },
    {
      id: 'secureStorageRoom',
      label: 'Secure Storage Room',
      category: 'interiorStorage',
    },
    {
      id: 'wineStorage',
      label: 'Wine Storage',
      category: 'interiorStorage',
    },
    {
      id: 'sportsEquipmentStorage',
      label: 'Sports Equipment Storage',
      category: 'interiorStorage',
    },
  ];

  readonly exteriorStorageFeatures: readonly ParkingStorageFeature[] = [
    {
      id: 'storageShed',
      label: 'Storage Shed',
      category: 'exteriorStorage',
    },
    {
      id: 'gardenShed',
      label: 'Garden Shed',
      category: 'exteriorStorage',
    },
    {
      id: 'utilityShed',
      label: 'Utility Shed',
      category: 'exteriorStorage',
    },
    {
      id: 'detachedStorageBuilding',
      label: 'Detached Storage Building',
      category: 'exteriorStorage',
    },
    {
      id: 'barnStorage',
      label: 'Barn Storage',
      category: 'exteriorStorage',
    },
    {
      id: 'equipmentStorage',
      label: 'Equipment Storage',
      category: 'exteriorStorage',
    },
    {
      id: 'lawnEquipmentStorage',
      label: 'Lawn Equipment Storage',
      category: 'exteriorStorage',
    },
    {
      id: 'poolEquipmentStorage',
      label: 'Pool Equipment Storage',
      category: 'exteriorStorage',
    },
    {
      id: 'bicycleStorage',
      label: 'Bicycle Storage',
      category: 'exteriorStorage',
    },
    {
      id: 'kayakStorage',
      label: 'Kayak or Canoe Storage',
      category: 'exteriorStorage',
    },
    {
      id: 'woodStorage',
      label: 'Firewood Storage',
      category: 'exteriorStorage',
    },
    {
      id: 'coveredExteriorStorage',
      label: 'Covered Exterior Storage',
      category: 'exteriorStorage',
    },
    {
      id: 'lockedExteriorStorage',
      label: 'Locked Exterior Storage',
      category: 'exteriorStorage',
    },
    {
      id: 'underDeckStorage',
      label: 'Under-Deck Storage',
      category: 'exteriorStorage',
    },
    {
      id: 'outdoorStorageCloset',
      label: 'Outdoor Storage Closet',
      category: 'exteriorStorage',
    },
    {
      id: 'storageContainerArea',
      label: 'Dedicated Storage Container Area',
      category: 'exteriorStorage',
    },
  ];

  readonly workshopFeatures: readonly ParkingStorageFeature[] = [
    {
      id: 'attachedWorkshop',
      label: 'Attached Workshop',
      category: 'workshop',
    },
    {
      id: 'detachedWorkshop',
      label: 'Detached Workshop',
      category: 'workshop',
    },
    {
      id: 'garageWorkshop',
      label: 'Garage Workshop Area',
      category: 'workshop',
    },
    {
      id: 'heatedWorkshop',
      label: 'Heated Workshop',
      category: 'workshop',
    },
    {
      id: 'airConditionedWorkshop',
      label: 'Air-Conditioned Workshop',
      category: 'workshop',
    },
    {
      id: 'insulatedWorkshop',
      label: 'Insulated Workshop',
      category: 'workshop',
    },
    {
      id: 'workshopElectricity',
      label: 'Workshop Electricity',
      category: 'workshop',
    },
    {
      id: 'workshopPlumbing',
      label: 'Workshop Plumbing',
      category: 'workshop',
    },
    {
      id: 'workshopUtilitySink',
      label: 'Workshop Utility Sink',
      category: 'workshop',
    },
    {
      id: 'workshopVentilation',
      label: 'Workshop Ventilation',
      category: 'workshop',
    },
    {
      id: 'workshopStorage',
      label: 'Workshop Storage',
      category: 'workshop',
    },
    {
      id: 'builtInWorkbench',
      label: 'Built-In Workbench',
      category: 'workshop',
    },
    {
      id: 'toolStorage',
      label: 'Built-In Tool Storage',
      category: 'workshop',
    },
    {
      id: 'twoHundredTwentyVoltService',
      label: '240-Volt Workshop Service',
      category: 'workshop',
    },
    {
      id: 'compressedAirSystem',
      label: 'Compressed-Air System',
      category: 'workshop',
    },
    {
      id: 'dustCollectionSystem',
      label: 'Dust-Collection System',
      category: 'workshop',
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
      return 'Loading saved selections...';
    }

    if (this.isSaving()) {
      return 'Saving...';
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
          this.currentEnhancements.parkingStorage ?? [],
        ),
      );

      this.hasChanges.set(false);
    } catch (error: unknown) {
      console.error(
        'Unable to load parking and storage features:',
        error,
      );

      this.saveError.set(
        'We could not load the saved parking and storage features.',
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
      parkingStorage: Array.from(
        this.selectedFeatureIds(),
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
        'Unable to save parking and storage features:',
        error,
      );

      this.saveError.set(
        'We could not save these parking and storage features. Please try again.',
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