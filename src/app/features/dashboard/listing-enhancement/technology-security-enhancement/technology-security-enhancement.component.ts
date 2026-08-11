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

  private currentEnhancements: ListingEnhancements = {};

  readonly featureGroups: readonly TechnologySecurityGroup[] = [
    {
      id: 'internet-connectivity',
      heading: 'Internet and Connectivity',
      description:
        'Identify the property’s available internet services, installed network wiring, wireless equipment, and connectivity infrastructure.',
      iconClass: 'fa-solid fa-wifi',
      features: [
        {
          id: 'fiberInternetAvailable',
          label: 'Fiber-Optic Internet Available',
        },
        {
          id: 'cableInternetAvailable',
          label: 'Cable Internet Available',
        },
        {
          id: 'dslInternetAvailable',
          label: 'DSL Internet Available',
        },
        {
          id: 'fixedWirelessInternetAvailable',
          label: 'Fixed Wireless Internet Available',
        },
        {
          id: 'satelliteInternetAvailable',
          label: 'Satellite Internet Available',
        },
        {
          id: 'multipleInternetProviders',
          label: 'Multiple Internet Providers Available',
        },
        {
          id: 'wholeHomeWifi',
          label: 'Whole-Home Wi-Fi',
        },
        {
          id: 'meshWifiSystem',
          label: 'Mesh Wi-Fi System',
        },
        {
          id: 'wifiAccessPoints',
          label: 'Built-In Wi-Fi Access Points',
        },
        {
          id: 'ethernetWiring',
          label: 'Ethernet Wiring',
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
          id: 'networkJacks',
          label: 'Built-In Network Jacks',
        },
        {
          id: 'centralNetworkPanel',
          label: 'Central Network Panel',
          description:
            'Installed network wiring terminates at a centralized structured-wiring or equipment panel.',
        },
        {
          id: 'dedicatedNetworkCloset',
          label: 'Dedicated Network Closet',
        },
        {
          id: 'coaxialWiring',
          label: 'Coaxial Cable Wiring',
        },
        {
          id: 'wholeHomeCellularBooster',
          label: 'Whole-Home Cellular Signal Booster',
        },
        {
          id: 'outdoorWifiCoverage',
          label: 'Outdoor Wi-Fi Coverage',
        },
        {
          id: 'detachedBuildingConnectivity',
          label: 'Network Connection to Detached Building',
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
          id: 'integratedSmartHomeSystem',
          label: 'Integrated Smart-Home System',
        },
        {
          id: 'smartHomeHub',
          label: 'Smart-Home Hub',
        },
        {
          id: 'professionallyInstalledAutomation',
          label: 'Professionally Installed Home Automation',
        },
        {
          id: 'voiceControlSystem',
          label: 'Voice-Control System',
        },
        {
          id: 'smartLighting',
          label: 'Smart Lighting',
        },
        {
          id: 'wholeHomeLightingControls',
          label: 'Whole-Home Lighting Controls',
        },
        {
          id: 'smartLightSwitches',
          label: 'Smart Light Switches',
        },
        {
          id: 'smartDimmers',
          label: 'Smart Dimmers',
        },
        {
          id: 'automatedWindowShades',
          label: 'Automated Window Shades',
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
          id: 'smartAppliances',
          label: 'Smart Appliances',
        },
        {
          id: 'smartRefrigerator',
          label: 'Smart Refrigerator',
        },
        {
          id: 'smartOven',
          label: 'Smart Oven or Range',
        },
        {
          id: 'smartWasherDryer',
          label: 'Smart Washer and Dryer',
        },
        {
          id: 'smartGarageDoor',
          label: 'Smart Garage-Door Control',
        },
        {
          id: 'smartIrrigation',
          label: 'Smart Irrigation Controls',
        },
        {
          id: 'smartPoolControls',
          label: 'Smart Pool or Spa Controls',
        },
        {
          id: 'smartHomeSensors',
          label: 'Smart-Home Environmental Sensors',
        },
        {
          id: 'remoteHomeMonitoring',
          label: 'Remote Home Monitoring',
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
          id: 'securitySystem',
          label: 'Security System',
        },
        {
          id: 'professionallyMonitoredSecurity',
          label: 'Professionally Monitored Security System',
        },
        {
          id: 'selfMonitoredSecurity',
          label: 'Self-Monitored Security System',
        },
        {
          id: 'wiredSecuritySystem',
          label: 'Wired Security System',
        },
        {
          id: 'wirelessSecuritySystem',
          label: 'Wireless Security System',
        },
        {
          id: 'centralSecurityPanel',
          label: 'Central Security Control Panel',
        },
        {
          id: 'securityKeypads',
          label: 'Multiple Security Keypads',
        },
        {
          id: 'doorWindowSensors',
          label: 'Door and Window Sensors',
        },
        {
          id: 'glassBreakSensors',
          label: 'Glass-Break Sensors',
        },
        {
          id: 'motionDetectors',
          label: 'Motion Detectors',
        },
        {
          id: 'perimeterAlarm',
          label: 'Perimeter Alarm System',
        },
        {
          id: 'drivewayAlarm',
          label: 'Driveway Alarm',
        },
        {
          id: 'panicButtons',
          label: 'Security Panic Buttons',
        },
        {
          id: 'securitySirens',
          label: 'Interior or Exterior Security Sirens',
        },
        {
          id: 'securityStrobeLights',
          label: 'Security Strobe Lights',
        },
        {
          id: 'safeRoom',
          label: 'Safe Room',
        },
        {
          id: 'stormSafeRoom',
          label: 'Storm or Security Safe Room',
        },
        {
          id: 'builtInSafe',
          label: 'Built-In Safe',
        },
        {
          id: 'securityFilm',
          label: 'Security Window Film',
        },
        {
          id: 'securityScreens',
          label: 'Security Window Screens',
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
          id: 'securityCameras',
          label: 'Security Cameras',
        },
        {
          id: 'indoorSecurityCameras',
          label: 'Indoor Security Cameras',
        },
        {
          id: 'outdoorSecurityCameras',
          label: 'Outdoor Security Cameras',
        },
        {
          id: 'doorbellCamera',
          label: 'Video Doorbell',
        },
        {
          id: 'drivewayCamera',
          label: 'Driveway Camera',
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
          id: 'panTiltZoomCameras',
          label: 'Pan-Tilt-Zoom Cameras',
        },
        {
          id: 'nightVisionCameras',
          label: 'Night-Vision Cameras',
        },
        {
          id: 'motionActivatedCameras',
          label: 'Motion-Activated Cameras',
        },
        {
          id: 'floodlightCameras',
          label: 'Floodlight Cameras',
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
          id: 'cloudVideoRecording',
          label: 'Cloud Video Recording',
        },
        {
          id: 'continuousVideoRecording',
          label: 'Continuous Video Recording',
        },
        {
          id: 'remoteCameraAccess',
          label: 'Remote Camera Access',
        },
        {
          id: 'cameraMonitoringStation',
          label: 'Dedicated Camera Monitoring Station',
        },
        {
          id: 'cameraPrewiring',
          label: 'Prewired for Security Cameras',
        },
      ],
    },
    {
      id: 'access-entry',
      heading: 'Access and Entry Controls',
      description:
        'Select smart locks, electronic entry systems, controlled gates, intercoms, and visitor-access equipment.',
      iconClass: 'fa-solid fa-key',
      features: [
        {
          id: 'smartLocks',
          label: 'Smart Door Locks',
        },
        {
          id: 'keypadEntry',
          label: 'Keypad Entry',
        },
        {
          id: 'keylessEntry',
          label: 'Keyless Entry',
        },
        {
          id: 'biometricEntry',
          label: 'Biometric Entry',
        },
        {
          id: 'electronicDeadbolts',
          label: 'Electronic Deadbolts',
        },
        {
          id: 'remoteDoorUnlock',
          label: 'Remote Door Unlocking',
        },
        {
          id: 'automaticDoorLocks',
          label: 'Automatic Door Locking',
        },
        {
          id: 'accessControlSystem',
          label: 'Electronic Access-Control System',
        },
        {
          id: 'cardAccessSystem',
          label: 'Card or Fob Access System',
        },
        {
          id: 'visitorEntrySystem',
          label: 'Visitor Entry System',
        },
        {
          id: 'videoIntercom',
          label: 'Video Intercom',
        },
        {
          id: 'wholeHomeIntercom',
          label: 'Whole-Home Intercom',
        },
        {
          id: 'gatedEntry',
          label: 'Gated Entry',
        },
        {
          id: 'automaticDrivewayGate',
          label: 'Automatic Driveway Gate',
        },
        {
          id: 'remoteGateControl',
          label: 'Remote Gate Control',
        },
        {
          id: 'gateKeypad',
          label: 'Gate Keypad',
        },
        {
          id: 'gateIntercom',
          label: 'Gate Intercom',
        },
        {
          id: 'gateTelephoneEntry',
          label: 'Gate Telephone-Entry System',
        },
        {
          id: 'smartGarageAccess',
          label: 'Remote Garage Access',
        },
        {
          id: 'packageDeliveryAccess',
          label: 'Secure Package-Delivery Access',
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
          id: 'smokeDetectors',
          label: 'Smoke Detectors',
        },
        {
          id: 'hardwiredSmokeDetectors',
          label: 'Hardwired Smoke Detectors',
        },
        {
          id: 'interconnectedSmokeDetectors',
          label: 'Interconnected Smoke Detectors',
        },
        {
          id: 'smartSmokeDetectors',
          label: 'Smart Smoke Detectors',
        },
        {
          id: 'carbonMonoxideDetectors',
          label: 'Carbon-Monoxide Detectors',
        },
        {
          id: 'smartCarbonMonoxideDetectors',
          label: 'Smart Carbon-Monoxide Detectors',
        },
        {
          id: 'heatDetectors',
          label: 'Heat Detectors',
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
          id: 'waterLeakSensors',
          label: 'Water-Leak Sensors',
        },
        {
          id: 'freezeSensors',
          label: 'Freeze Sensors',
        },
        {
          id: 'residentialFireSprinklers',
          label: 'Residential Fire-Sprinkler System',
        },
        {
          id: 'fireExtinguishers',
          label: 'Installed Fire Extinguishers',
        },
        {
          id: 'kitchenFireSuppression',
          label: 'Kitchen Fire-Suppression System',
        },
        {
          id: 'emergencyLighting',
          label: 'Emergency Lighting',
        },
        {
          id: 'emergencyAlertSystem',
          label: 'Emergency Alert System',
        },
        {
          id: 'medicalAlertSystem',
          label: 'Medical Alert System',
        },
        {
          id: 'wholeHomeEmergencyNotification',
          label: 'Whole-Home Emergency Notification',
        },
        {
          id: 'lightningProtection',
          label: 'Lightning-Protection System',
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
          id: 'wholeHomeAudio',
          label: 'Whole-Home Audio',
        },
        {
          id: 'builtInSpeakers',
          label: 'Built-In Speakers',
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
          id: 'outdoorSpeakers',
          label: 'Outdoor Speakers',
        },
        {
          id: 'multiZoneAudio',
          label: 'Multi-Zone Audio',
        },
        {
          id: 'centralAudioControls',
          label: 'Central Audio Controls',
        },
        {
          id: 'homeTheater',
          label: 'Home Theater',
        },
        {
          id: 'dedicatedMediaRoom',
          label: 'Dedicated Media Room',
        },
        {
          id: 'surroundSound',
          label: 'Surround-Sound System',
        },
        {
          id: 'projector',
          label: 'Installed Projector',
        },
        {
          id: 'projectionScreen',
          label: 'Installed Projection Screen',
        },
        {
          id: 'motorizedProjectionScreen',
          label: 'Motorized Projection Screen',
        },
        {
          id: 'televisionMounts',
          label: 'Installed Television Mounts',
        },
        {
          id: 'hiddenMediaWiring',
          label: 'Concealed Media Wiring',
        },
        {
          id: 'centralMediaDistribution',
          label: 'Central Media-Distribution System',
        },
        {
          id: 'satelliteTelevisionSystem',
          label: 'Satellite Television System',
        },
        {
          id: 'antennaSystem',
          label: 'Over-the-Air Television Antenna',
        },
        {
          id: 'gamingNetwork',
          label: 'Dedicated Gaming Network Connection',
        },
        {
          id: 'homeTheaterPrewiring',
          label: 'Prewired for Home Theater',
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
          id: 'dedicatedHomeOfficeNetwork',
          label: 'Dedicated Home-Office Network',
        },
        {
          id: 'hardwiredHomeOffice',
          label: 'Hardwired Home Office',
        },
        {
          id: 'multipleHardwiredWorkspaces',
          label: 'Multiple Hardwired Workspaces',
        },
        {
          id: 'dedicatedOfficeCircuit',
          label: 'Dedicated Home-Office Electrical Circuit',
        },
        {
          id: 'officeBatteryBackup',
          label: 'Home-Office Battery Backup',
        },
        {
          id: 'videoConferenceSystem',
          label: 'Installed Video-Conference System',
        },
        {
          id: 'conferenceRoom',
          label: 'Home Conference Room',
        },
        {
          id: 'businessPhoneSystem',
          label: 'Business Telephone System',
        },
        {
          id: 'landlineTelephoneWiring',
          label: 'Landline Telephone Wiring',
        },
        {
          id: 'soundproofOffice',
          label: 'Soundproofed Home Office',
        },
        {
          id: 'separateOfficeEntrance',
          label: 'Separate Home-Office Entrance',
        },
        {
          id: 'studioTechnology',
          label: 'Installed Studio Technology',
        },
        {
          id: 'podcastRecordingSetup',
          label: 'Podcast or Recording Setup',
        },
        {
          id: 'serverEquipmentArea',
          label: 'Dedicated Server or Equipment Area',
        },
        {
          id: 'backupInternetConnection',
          label: 'Backup Internet Connection',
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
        new Set(this.currentEnhancements.technologySecurity ?? []),
      );

      this.hasChanges.set(false);
    } catch (error: unknown) {
      console.error(
        'Unable to load technology and security features:',
        error,
      );

      this.saveError.set(
        'We could not load the saved technology and security features.',
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
      technologySecurity: Array.from(this.selectedFeatureIds()),
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
      console.error(
        'Unable to save technology and security features:',
        error,
      );

      this.saveError.set(
        'We could not save these technology and security features. Please try again.',
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