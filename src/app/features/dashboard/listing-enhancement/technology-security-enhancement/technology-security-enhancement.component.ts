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

import { AuthService } from '../../../../core/authentication/services/auth.service';
import { ListingEnhancements } from '../../../../core/domains/listings/models/listing.model';
import { ListingService } from '../../../../core/domains/listings/services/listing.service';

interface TechnologySecurityFeature {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
}

interface TechnologySecurityGroup {
  readonly id: string;
  readonly heading: string;
  readonly description: string;
  readonly iconClass: string;
  readonly features: readonly TechnologySecurityFeature[];
}

@Component({
  selector: 'app-technology-security-enhancement',
  standalone: true,
  imports: [],
  templateUrl: './technology-security-enhancement.component.html',
  styleUrl: './technology-security-enhancement.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TechnologySecurityEnhancementComponent implements OnInit {
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

  readonly featureGroups: readonly TechnologySecurityGroup[] = [
    {
      id: 'access-entry',
      heading: 'Access and Entry Controls',
      description:
        'Select smart locks, electronic entry systems, controlled gates, intercoms, and visitor-access equipment.',
      iconClass: 'fa-solid fa-key',
      features: [
        {
          id: 'automaticDoorLocks',
          label: 'Automatic Door Locking',
        },
        {
          id: 'automaticDrivewayGate',
          label: 'Automatic Driveway Gate',
        },
        {
          id: 'biometricEntry',
          label: 'Biometric Entry',
        },
        {
          id: 'cardAccessSystem',
          label: 'Card or Fob Access System',
        },
        {
          id: 'accessControlSystem',
          label: 'Electronic Access-Control System',
        },
        {
          id: 'electronicDeadbolts',
          label: 'Electronic Deadbolts',
        },
        {
          id: 'gateIntercom',
          label: 'Gate Intercom',
        },
        {
          id: 'gateKeypad',
          label: 'Gate Keypad',
        },
        {
          id: 'gateTelephoneEntry',
          label: 'Gate Telephone-Entry System',
        },
        {
          id: 'gatedEntry',
          label: 'Gated Entry',
        },
        {
          id: 'keylessEntry',
          label: 'Keyless Entry',
        },
        {
          id: 'keypadEntry',
          label: 'Keypad Entry',
        },
        {
          id: 'remoteDoorUnlock',
          label: 'Remote Door Unlocking',
        },
        {
          id: 'smartGarageAccess',
          label: 'Remote Garage Access',
        },
        {
          id: 'remoteGateControl',
          label: 'Remote Gate Control',
        },
        {
          id: 'packageDeliveryAccess',
          label: 'Secure Package-Delivery Access',
        },
        {
          id: 'smartLocks',
          label: 'Smart Door Locks',
        },
        {
          id: 'videoIntercom',
          label: 'Video Intercom',
        },
        {
          id: 'visitorEntrySystem',
          label: 'Visitor Entry System',
        },
        {
          id: 'wholeHomeIntercom',
          label: 'Whole-Home Intercom',
        },
      ],
    },
    {
      id: 'cameras-surveillance',
      heading: 'Cameras and Surveillance',
      description:
        'Identify installed video surveillance, recording, monitoring, and property-entry camera equipment.',
      iconClass: 'fa-solid fa-video',
      features: [
        {
          id: 'cloudVideoRecording',
          label: 'Cloud Video Recording',
        },
        {
          id: 'continuousVideoRecording',
          label: 'Continuous Video Recording',
        },
        {
          id: 'cameraMonitoringStation',
          label: 'Dedicated Camera Monitoring Station',
        },
        {
          id: 'drivewayCamera',
          label: 'Driveway Camera',
        },
        {
          id: 'floodlightCameras',
          label: 'Floodlight Cameras',
        },
        {
          id: 'garageCamera',
          label: 'Garage Camera',
        },
        {
          id: 'gateCamera',
          label: 'Gate or Entrance Camera',
        },
        {
          id: 'indoorSecurityCameras',
          label: 'Indoor Security Cameras',
        },
        {
          id: 'licensePlateCamera',
          label: 'License-Plate Camera',
        },
        {
          id: 'localVideoRecorder',
          label: 'Local Video Recording System',
        },
        {
          id: 'motionActivatedCameras',
          label: 'Motion-Activated Cameras',
        },
        {
          id: 'nightVisionCameras',
          label: 'Night-Vision Cameras',
        },
        {
          id: 'outdoorSecurityCameras',
          label: 'Outdoor Security Cameras',
        },
        {
          id: 'panTiltZoomCameras',
          label: 'Pan-Tilt-Zoom Cameras',
        },
        {
          id: 'cameraPrewiring',
          label: 'Prewired for Security Cameras',
        },
        {
          id: 'remoteCameraAccess',
          label: 'Remote Camera Access',
        },
        {
          id: 'securityCameras',
          label: 'Security Cameras',
        },
        {
          id: 'doorbellCamera',
          label: 'Video Doorbell',
        },
      ],
    },
    {
      id: 'entertainment-audio',
      heading: 'Entertainment and Audio',
      description:
        'Describe installed home-theater, audio, television, media-distribution, and entertainment wiring.',
      iconClass: 'fa-solid fa-volume-high',
      features: [
        {
          id: 'builtInSpeakers',
          label: 'Built-In Speakers',
        },
        {
          id: 'centralAudioControls',
          label: 'Central Audio Controls',
        },
        {
          id: 'centralMediaDistribution',
          label: 'Central Media-Distribution System',
        },
        {
          id: 'hiddenMediaWiring',
          label: 'Concealed Media Wiring',
        },
        {
          id: 'gamingNetwork',
          label: 'Dedicated Gaming Network Connection',
        },
        {
          id: 'dedicatedMediaRoom',
          label: 'Dedicated Media Room',
        },
        {
          id: 'homeTheater',
          label: 'Home Theater',
        },
        {
          id: 'inCeilingSpeakers',
          label: 'In-Ceiling Speakers',
        },
        {
          id: 'inWallSpeakers',
          label: 'In-Wall Speakers',
        },
        {
          id: 'projectionScreen',
          label: 'Installed Projection Screen',
        },
        {
          id: 'projector',
          label: 'Installed Projector',
        },
        {
          id: 'televisionMounts',
          label: 'Installed Television Mounts',
        },
        {
          id: 'motorizedProjectionScreen',
          label: 'Motorized Projection Screen',
        },
        {
          id: 'multiZoneAudio',
          label: 'Multi-Zone Audio',
        },
        {
          id: 'outdoorSpeakers',
          label: 'Outdoor Speakers',
        },
        {
          id: 'antennaSystem',
          label: 'Over-the-Air Television Antenna',
        },
        {
          id: 'homeTheaterPrewiring',
          label: 'Prewired for Home Theater',
        },
        {
          id: 'satelliteTelevisionSystem',
          label: 'Satellite Television System',
        },
        {
          id: 'surroundSound',
          label: 'Surround-Sound System',
        },
        {
          id: 'wholeHomeAudio',
          label: 'Whole-Home Audio',
        },
      ],
    },
    {
      id: 'fire-life-safety',
      heading: 'Fire and Life Safety',
      description:
        'Identify installed smoke, heat, gas, water, emergency-alert, and residential fire-protection systems.',
      iconClass: 'fa-solid fa-fire-extinguisher',
      features: [
        {
          id: 'carbonMonoxideDetectors',
          label: 'Carbon-Monoxide Detectors',
        },
        {
          id: 'emergencyAlertSystem',
          label: 'Emergency Alert System',
        },
        {
          id: 'emergencyLighting',
          label: 'Emergency Lighting',
        },
        {
          id: 'freezeSensors',
          label: 'Freeze Sensors',
        },
        {
          id: 'hardwiredSmokeDetectors',
          label: 'Hardwired Smoke Detectors',
        },
        {
          id: 'heatDetectors',
          label: 'Heat Detectors',
        },
        {
          id: 'fireExtinguishers',
          label: 'Installed Fire Extinguishers',
        },
        {
          id: 'interconnectedSmokeDetectors',
          label: 'Interconnected Smoke Detectors',
        },
        {
          id: 'kitchenFireSuppression',
          label: 'Kitchen Fire-Suppression System',
        },
        {
          id: 'lightningProtection',
          label: 'Lightning-Protection System',
        },
        {
          id: 'medicalAlertSystem',
          label: 'Medical Alert System',
        },
        {
          id: 'naturalGasDetectors',
          label: 'Natural-Gas Detectors',
        },
        {
          id: 'propaneDetectors',
          label: 'Propane Detectors',
        },
        {
          id: 'radonDetectionSystem',
          label: 'Radon Monitoring System',
        },
        {
          id: 'residentialFireSprinklers',
          label: 'Residential Fire-Sprinkler System',
        },
        {
          id: 'smartCarbonMonoxideDetectors',
          label: 'Smart Carbon-Monoxide Detectors',
        },
        {
          id: 'smartSmokeDetectors',
          label: 'Smart Smoke Detectors',
        },
        {
          id: 'smokeDetectors',
          label: 'Smoke Detectors',
        },
        {
          id: 'waterLeakSensors',
          label: 'Water-Leak Sensors',
        },
        {
          id: 'wholeHomeEmergencyNotification',
          label: 'Whole-Home Emergency Notification',
        },
      ],
    },
    {
      id: 'internet-connectivity',
      heading: 'Internet and Connectivity',
      description:
        'Identify the property’s available internet services, installed network wiring, wireless equipment, and connectivity infrastructure.',
      iconClass: 'fa-solid fa-wifi',
      features: [
        {
          id: 'networkJacks',
          label: 'Built-In Network Jacks',
        },
        {
          id: 'wifiAccessPoints',
          label: 'Built-In Wi-Fi Access Points',
        },
        {
          id: 'cableInternetAvailable',
          label: 'Cable Internet Available',
        },
        {
          id: 'cat5eWiring',
          label: 'Cat 5e Network Wiring',
        },
        {
          id: 'cat6Wiring',
          label: 'Cat 6 Network Wiring',
        },
        {
          id: 'cat6aWiring',
          label: 'Cat 6a Network Wiring',
        },
        {
          id: 'centralNetworkPanel',
          label: 'Central Network Panel',
          description:
            'Installed network wiring terminates at a centralized structured-wiring or equipment panel.',
        },
        {
          id: 'coaxialWiring',
          label: 'Coaxial Cable Wiring',
        },
        {
          id: 'dedicatedNetworkCloset',
          label: 'Dedicated Network Closet',
        },
        {
          id: 'dslInternetAvailable',
          label: 'DSL Internet Available',
        },
        {
          id: 'ethernetWiring',
          label: 'Ethernet Wiring',
        },
        {
          id: 'fiberInternetAvailable',
          label: 'Fiber-Optic Internet Available',
        },
        {
          id: 'fixedWirelessInternetAvailable',
          label: 'Fixed Wireless Internet Available',
        },
        {
          id: 'meshWifiSystem',
          label: 'Mesh Wi-Fi System',
        },
        {
          id: 'multipleInternetProviders',
          label: 'Multiple Internet Providers Available',
        },
        {
          id: 'detachedBuildingConnectivity',
          label: 'Network Connection to Detached Building',
        },
        {
          id: 'outdoorWifiCoverage',
          label: 'Outdoor Wi-Fi Coverage',
        },
        {
          id: 'satelliteInternetAvailable',
          label: 'Satellite Internet Available',
        },
        {
          id: 'wholeHomeCellularBooster',
          label: 'Whole-Home Cellular Signal Booster',
        },
        {
          id: 'wholeHomeWifi',
          label: 'Whole-Home Wi-Fi',
        },
      ],
    },
    {
      id: 'security',
      heading: 'Security Systems',
      description:
        'Describe installed alarm equipment, professional monitoring, perimeter protection, and security-control systems.',
      iconClass: 'fa-solid fa-shield-halved',
      features: [
        {
          id: 'builtInSafe',
          label: 'Built-In Safe',
        },
        {
          id: 'centralSecurityPanel',
          label: 'Central Security Control Panel',
        },
        {
          id: 'doorWindowSensors',
          label: 'Door and Window Sensors',
        },
        {
          id: 'drivewayAlarm',
          label: 'Driveway Alarm',
        },
        {
          id: 'glassBreakSensors',
          label: 'Glass-Break Sensors',
        },
        {
          id: 'securitySirens',
          label: 'Interior or Exterior Security Sirens',
        },
        {
          id: 'motionDetectors',
          label: 'Motion Detectors',
        },
        {
          id: 'securityKeypads',
          label: 'Multiple Security Keypads',
        },
        {
          id: 'perimeterAlarm',
          label: 'Perimeter Alarm System',
        },
        {
          id: 'professionallyMonitoredSecurity',
          label: 'Professionally Monitored Security System',
        },
        {
          id: 'safeRoom',
          label: 'Safe Room',
        },
        {
          id: 'panicButtons',
          label: 'Security Panic Buttons',
        },
        {
          id: 'securityStrobeLights',
          label: 'Security Strobe Lights',
        },
        {
          id: 'securitySystem',
          label: 'Security System',
        },
        {
          id: 'securityFilm',
          label: 'Security Window Film',
        },
        {
          id: 'securityScreens',
          label: 'Security Window Screens',
        },
        {
          id: 'selfMonitoredSecurity',
          label: 'Self-Monitored Security System',
        },
        {
          id: 'stormSafeRoom',
          label: 'Storm or Security Safe Room',
        },
        {
          id: 'wiredSecuritySystem',
          label: 'Wired Security System',
        },
        {
          id: 'wirelessSecuritySystem',
          label: 'Wireless Security System',
        },
      ],
    },
    {
      id: 'smart-home',
      heading: 'Smart-Home Systems',
      description:
        'Select installed smart-home platforms, hubs, controls, sensors, and connected household equipment.',
      iconClass: 'fa-solid fa-house-signal',
      features: [
        {
          id: 'automatedWindowShades',
          label: 'Automated Window Shades',
        },
        {
          id: 'integratedSmartHomeSystem',
          label: 'Integrated Smart-Home System',
        },
        {
          id: 'professionallyInstalledAutomation',
          label: 'Professionally Installed Home Automation',
        },
        {
          id: 'remoteHomeMonitoring',
          label: 'Remote Home Monitoring',
        },
        {
          id: 'smartAppliances',
          label: 'Smart Appliances',
        },
        {
          id: 'smartBlinds',
          label: 'Smart Blinds',
        },
        {
          id: 'smartCeilingFans',
          label: 'Smart Ceiling Fans',
        },
        {
          id: 'smartDimmers',
          label: 'Smart Dimmers',
        },
        {
          id: 'smartGarageDoor',
          label: 'Smart Garage-Door Control',
        },
        {
          id: 'smartHomeSensors',
          label: 'Smart-Home Environmental Sensors',
        },
        {
          id: 'smartHomeHub',
          label: 'Smart-Home Hub',
        },
        {
          id: 'smartIrrigation',
          label: 'Smart Irrigation Controls',
        },
        {
          id: 'smartLightSwitches',
          label: 'Smart Light Switches',
        },
        {
          id: 'smartLighting',
          label: 'Smart Lighting',
        },
        {
          id: 'smartOven',
          label: 'Smart Oven or Range',
        },
        {
          id: 'smartPoolControls',
          label: 'Smart Pool or Spa Controls',
        },
        {
          id: 'smartRefrigerator',
          label: 'Smart Refrigerator',
        },
        {
          id: 'smartWasherDryer',
          label: 'Smart Washer and Dryer',
        },
        {
          id: 'voiceControlSystem',
          label: 'Voice-Control System',
        },
        {
          id: 'wholeHomeLightingControls',
          label: 'Whole-Home Lighting Controls',
        },
      ],
    },
    {
      id: 'workspace-communications',
      heading: 'Workspace and Communications',
      description:
        'Select technology intended to support remote work, business communications, conferencing, and dedicated office use.',
      iconClass: 'fa-solid fa-laptop-house',
      features: [
        {
          id: 'backupInternetConnection',
          label: 'Backup Internet Connection',
        },
        {
          id: 'businessPhoneSystem',
          label: 'Business Telephone System',
        },
        {
          id: 'dedicatedOfficeCircuit',
          label: 'Dedicated Home-Office Electrical Circuit',
        },
        {
          id: 'dedicatedHomeOfficeNetwork',
          label: 'Dedicated Home-Office Network',
        },
        {
          id: 'serverEquipmentArea',
          label: 'Dedicated Server or Equipment Area',
        },
        {
          id: 'hardwiredHomeOffice',
          label: 'Hardwired Home Office',
        },
        {
          id: 'conferenceRoom',
          label: 'Home Conference Room',
        },
        {
          id: 'officeBatteryBackup',
          label: 'Home-Office Battery Backup',
        },
        {
          id: 'studioTechnology',
          label: 'Installed Studio Technology',
        },
        {
          id: 'videoConferenceSystem',
          label: 'Installed Video-Conference System',
        },
        {
          id: 'landlineTelephoneWiring',
          label: 'Landline Telephone Wiring',
        },
        {
          id: 'multipleHardwiredWorkspaces',
          label: 'Multiple Hardwired Workspaces',
        },
        {
          id: 'podcastRecordingSetup',
          label: 'Podcast or Recording Setup',
        },
        {
          id: 'separateOfficeEntrance',
          label: 'Separate Home-Office Entrance',
        },
        {
          id: 'soundproofOffice',
          label: 'Soundproofed Home Office',
        },
      ],
    },
  ];

  readonly selectedFeatureIds = signal<ReadonlySet<string>>(new Set());

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

  async ngOnInit():
    Promise<void> {
    if (this.wizardMode()) {
      this.currentEnhancements = {
        ...this.initialEnhancements()
      };

      this.selectedFeatureIds.set(
        new Set(
          this.currentEnhancements
            .technologySecurity ?? []
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
            .technologySecurity ?? []
        )
      );

      this.hasChanges.set(false);
    } catch (error: unknown) {
      console.error(
        'Unable to load technology and security features:',
        error
      );

      this.saveError.set(
        'We could not load the saved technology and security features.'
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

  async saveSection():
    Promise<void> {
    if (
      this.isLoading() ||
      this.isSaving() ||
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

    const technologySecuritySelections =
      Array.from(
        this.selectedFeatureIds()
      ).sort();

    const updatedEnhancements:
      ListingEnhancements = {
      ...this.currentEnhancements,
      technologySecurity:
        technologySecuritySelections
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
        'Unable to save technology and security features:',
        error
      );

      this.saveError.set(
        'We could not save these technology and security features. Please try again.'
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

    await this.router.navigate(['/listings', listingUid]);
  }
}