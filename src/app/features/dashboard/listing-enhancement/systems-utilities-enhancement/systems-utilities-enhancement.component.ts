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

interface SystemUtilitiesFeature {
  id: string;
  label: string;
  description?: string;
  category:
    | 'heating'
    | 'cooling'
    | 'electrical'
    | 'plumbing'
    | 'water'
    | 'sewer'
    | 'fuel'
    | 'renewableEnergy'
    | 'backupSystems'
    | 'smartUtilities';
}

@Component({
  selector: 'app-system-utilities-enhancement',
  standalone: true,
  imports: [],
  templateUrl: './systems-utilities-enhancement.component.html',
  styleUrl: './systems-utilities-enhancement.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemUtilitiesEnhancementComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly listingService = inject(ListingService);

  private currentEnhancements: ListingEnhancements = {};

  readonly heatingFeatures: readonly SystemUtilitiesFeature[] = [
    {
      id: 'centralHeating',
      label: 'Central Heating',
      category: 'heating',
    },
    {
      id: 'forcedAirHeating',
      label: 'Forced-Air Heating',
      category: 'heating',
    },
    {
      id: 'heatPump',
      label: 'Heat Pump',
      category: 'heating',
    },
    {
      id: 'dualFuelHeatPump',
      label: 'Dual-Fuel Heat Pump',
      description:
        'A heat pump is paired with a secondary fuel-powered heating system.',
      category: 'heating',
    },
    {
      id: 'furnace',
      label: 'Furnace',
      category: 'heating',
    },
    {
      id: 'boiler',
      label: 'Boiler',
      category: 'heating',
    },
    {
      id: 'radiatorHeating',
      label: 'Radiator Heating',
      category: 'heating',
    },
    {
      id: 'baseboardHeating',
      label: 'Baseboard Heating',
      category: 'heating',
    },
    {
      id: 'radiantFloorHeating',
      label: 'Radiant-Floor Heating',
      category: 'heating',
    },
    {
      id: 'geothermalHeating',
      label: 'Geothermal Heating',
      category: 'heating',
    },
    {
      id: 'electricHeating',
      label: 'Electric Heating',
      category: 'heating',
    },
    {
      id: 'gasHeating',
      label: 'Gas Heating',
      category: 'heating',
    },
    {
      id: 'oilHeating',
      label: 'Oil Heating',
      category: 'heating',
    },
    {
      id: 'propaneHeating',
      label: 'Propane Heating',
      category: 'heating',
    },
    {
      id: 'woodHeating',
      label: 'Wood-Burning Heating',
      category: 'heating',
    },
    {
      id: 'pelletHeating',
      label: 'Pellet-Stove Heating',
      category: 'heating',
    },
    {
      id: 'zonedHeating',
      label: 'Zoned Heating',
      description:
        'Separate controls allow different areas of the home to be heated independently.',
      category: 'heating',
    },
    {
      id: 'multiZoneHeating',
      label: 'Multi-Zone Heating',
      category: 'heating',
    },
    {
      id: 'highEfficiencyHeating',
      label: 'High-Efficiency Heating System',
      category: 'heating',
    },
    {
      id: 'humidifier',
      label: 'Whole-Home Humidifier',
      category: 'heating',
    },
  ];

  readonly coolingFeatures: readonly SystemUtilitiesFeature[] = [
    {
      id: 'centralAirConditioning',
      label: 'Central Air Conditioning',
      category: 'cooling',
    },
    {
      id: 'heatPumpCooling',
      label: 'Heat-Pump Cooling',
      category: 'cooling',
    },
    {
      id: 'ductlessMiniSplit',
      label: 'Ductless Mini-Split',
      category: 'cooling',
    },
    {
      id: 'multiZoneMiniSplit',
      label: 'Multi-Zone Mini-Split',
      category: 'cooling',
    },
    {
      id: 'zonedCooling',
      label: 'Zoned Cooling',
      description:
        'Separate controls allow different areas of the home to be cooled independently.',
      category: 'cooling',
    },
    {
      id: 'evaporativeCooler',
      label: 'Evaporative Cooler',
      category: 'cooling',
    },
    {
      id: 'wholeHouseFan',
      label: 'Whole-House Fan',
      category: 'cooling',
    },
    {
      id: 'atticFan',
      label: 'Attic Fan',
      category: 'cooling',
    },
    {
      id: 'ceilingFans',
      label: 'Ceiling Fans',
      category: 'cooling',
    },
    {
      id: 'windowAirConditioners',
      label: 'Window Air-Conditioning Units',
      category: 'cooling',
    },
    {
      id: 'portableAirConditioners',
      label: 'Portable Air-Conditioning Units',
      category: 'cooling',
    },
    {
      id: 'highEfficiencyCooling',
      label: 'High-Efficiency Cooling System',
      category: 'cooling',
    },
    {
      id: 'variableSpeedHvac',
      label: 'Variable-Speed HVAC',
      category: 'cooling',
    },
    {
      id: 'dehumidifier',
      label: 'Whole-Home Dehumidifier',
      category: 'cooling',
    },
    {
      id: 'airPurificationSystem',
      label: 'Whole-Home Air Purification',
      category: 'cooling',
    },
    {
      id: 'uvAirTreatment',
      label: 'UV Air-Treatment System',
      category: 'cooling',
    },
    {
      id: 'energyRecoveryVentilator',
      label: 'Energy-Recovery Ventilator',
      description:
        'An ERV exchanges stale indoor air with filtered outdoor air while reducing energy loss.',
      category: 'cooling',
    },
    {
      id: 'heatRecoveryVentilator',
      label: 'Heat-Recovery Ventilator',
      category: 'cooling',
    },
  ];

  readonly electricalFeatures: readonly SystemUtilitiesFeature[] = [
    {
      id: 'oneHundredAmpService',
      label: '100-Amp Electrical Service',
      category: 'electrical',
    },
    {
      id: 'oneHundredFiftyAmpService',
      label: '150-Amp Electrical Service',
      category: 'electrical',
    },
    {
      id: 'twoHundredAmpService',
      label: '200-Amp Electrical Service',
      category: 'electrical',
    },
    {
      id: 'fourHundredAmpService',
      label: '400-Amp Electrical Service',
      category: 'electrical',
    },
    {
      id: 'circuitBreakerPanel',
      label: 'Circuit-Breaker Panel',
      category: 'electrical',
    },
    {
      id: 'updatedElectricalPanel',
      label: 'Updated Electrical Panel',
      category: 'electrical',
    },
    {
      id: 'multipleElectricalPanels',
      label: 'Multiple Electrical Panels',
      category: 'electrical',
    },
    {
      id: 'subpanel',
      label: 'Electrical Subpanel',
      category: 'electrical',
    },
    {
      id: 'updatedWiring',
      label: 'Updated Electrical Wiring',
      category: 'electrical',
    },
    {
      id: 'copperWiring',
      label: 'Copper Wiring',
      category: 'electrical',
    },
    {
      id: 'undergroundElectricalService',
      label: 'Underground Electrical Service',
      category: 'electrical',
    },
    {
      id: 'wholeHouseSurgeProtection',
      label: 'Whole-House Surge Protection',
      category: 'electrical',
    },
    {
      id: 'gfciProtection',
      label: 'GFCI Protection',
      category: 'electrical',
    },
    {
      id: 'afciProtection',
      label: 'AFCI Protection',
      category: 'electrical',
    },
    {
      id: 'dedicatedApplianceCircuits',
      label: 'Dedicated Appliance Circuits',
      category: 'electrical',
    },
    {
      id: 'exteriorElectricalOutlets',
      label: 'Exterior Electrical Outlets',
      category: 'electrical',
    },
    {
      id: 'usbOutlets',
      label: 'Built-In USB Outlets',
      category: 'electrical',
    },
    {
      id: 'usbCOutlets',
      label: 'Built-In USB-C Outlets',
      category: 'electrical',
    },
    {
      id: 'threePhasePower',
      label: 'Three-Phase Power',
      category: 'electrical',
    },
    {
      id: 'transferSwitch',
      label: 'Generator Transfer Switch',
      category: 'electrical',
    },
  ];

  readonly plumbingFeatures: readonly SystemUtilitiesFeature[] = [
    {
      id: 'copperPlumbing',
      label: 'Copper Plumbing',
      category: 'plumbing',
    },
    {
      id: 'pexPlumbing',
      label: 'PEX Plumbing',
      category: 'plumbing',
    },
    {
      id: 'cpvcPlumbing',
      label: 'CPVC Plumbing',
      category: 'plumbing',
    },
    {
      id: 'updatedPlumbing',
      label: 'Updated Plumbing',
      category: 'plumbing',
    },
    {
      id: 'plumbingManifold',
      label: 'Plumbing Manifold System',
      description:
        'A central manifold provides individual water-supply lines to fixtures.',
      category: 'plumbing',
    },
    {
      id: 'wholeHouseShutoff',
      label: 'Whole-House Water Shutoff',
      category: 'plumbing',
    },
    {
      id: 'automaticWaterShutoff',
      label: 'Automatic Water Shutoff',
      category: 'plumbing',
    },
    {
      id: 'leakDetectionSystem',
      label: 'Whole-Home Leak Detection',
      category: 'plumbing',
    },
    {
      id: 'waterPressureBooster',
      label: 'Water-Pressure Booster',
      category: 'plumbing',
    },
    {
      id: 'pressureReducingValve',
      label: 'Pressure-Reducing Valve',
      category: 'plumbing',
    },
    {
      id: 'sumpPump',
      label: 'Sump Pump',
      category: 'plumbing',
    },
    {
      id: 'backupSumpPump',
      label: 'Backup Sump Pump',
      category: 'plumbing',
    },
    {
      id: 'sewageEjectorPump',
      label: 'Sewage-Ejector Pump',
      category: 'plumbing',
    },
    {
      id: 'floorDrains',
      label: 'Floor Drains',
      category: 'plumbing',
    },
    {
      id: 'frostFreeHoseBibbs',
      label: 'Frost-Free Exterior Faucets',
      category: 'plumbing',
    },
    {
      id: 'hotWaterRecirculation',
      label: 'Hot-Water Recirculation System',
      description:
        'A recirculation system reduces the wait for hot water at fixtures.',
      category: 'plumbing',
    },
    {
      id: 'tankWaterHeater',
      label: 'Tank Water Heater',
      category: 'plumbing',
    },
    {
      id: 'tanklessWaterHeater',
      label: 'Tankless Water Heater',
      category: 'plumbing',
    },
    {
      id: 'heatPumpWaterHeater',
      label: 'Heat-Pump Water Heater',
      category: 'plumbing',
    },
    {
      id: 'solarWaterHeater',
      label: 'Solar Water Heater',
      category: 'plumbing',
    },
    {
      id: 'multipleWaterHeaters',
      label: 'Multiple Water Heaters',
      category: 'plumbing',
    },
  ];

  readonly waterFeatures: readonly SystemUtilitiesFeature[] = [
    {
      id: 'publicWater',
      label: 'Public Water',
      category: 'water',
    },
    {
      id: 'communityWater',
      label: 'Community Water System',
      category: 'water',
    },
    {
      id: 'privateWell',
      label: 'Private Well',
      category: 'water',
    },
    {
      id: 'sharedWell',
      label: 'Shared Well',
      category: 'water',
    },
    {
      id: 'deepWell',
      label: 'Deep Well',
      category: 'water',
    },
    {
      id: 'artesianWell',
      label: 'Artesian Well',
      category: 'water',
    },
    {
      id: 'wellPressureTank',
      label: 'Well Pressure Tank',
      category: 'water',
    },
    {
      id: 'wellWaterTreatment',
      label: 'Well-Water Treatment System',
      category: 'water',
    },
    {
      id: 'wholeHouseWaterFilter',
      label: 'Whole-House Water Filtration',
      category: 'water',
    },
    {
      id: 'reverseOsmosisSystem',
      label: 'Reverse-Osmosis System',
      category: 'water',
    },
    {
      id: 'waterSoftener',
      label: 'Water Softener',
      category: 'water',
    },
    {
      id: 'waterConditioner',
      label: 'Water Conditioner',
      category: 'water',
    },
    {
      id: 'ultravioletWaterTreatment',
      label: 'UV Water-Treatment System',
      category: 'water',
    },
    {
      id: 'ironFiltrationSystem',
      label: 'Iron Filtration System',
      category: 'water',
    },
    {
      id: 'rainwaterCollection',
      label: 'Rainwater Collection System',
      category: 'water',
    },
    {
      id: 'cistern',
      label: 'Cistern',
      category: 'water',
    },
    {
      id: 'irrigationWell',
      label: 'Dedicated Irrigation Well',
      category: 'water',
    },
    {
      id: 'separateIrrigationMeter',
      label: 'Separate Irrigation Meter',
      category: 'water',
    },
  ];

  readonly sewerFeatures: readonly SystemUtilitiesFeature[] = [
    {
      id: 'publicSewer',
      label: 'Public Sewer',
      category: 'sewer',
    },
    {
      id: 'communitySewer',
      label: 'Community Sewer System',
      category: 'sewer',
    },
    {
      id: 'privateSeptic',
      label: 'Private Septic System',
      category: 'sewer',
    },
    {
      id: 'sharedSeptic',
      label: 'Shared Septic System',
      category: 'sewer',
    },
    {
      id: 'conventionalSeptic',
      label: 'Conventional Septic System',
      category: 'sewer',
    },
    {
      id: 'aerobicSeptic',
      label: 'Aerobic Septic System',
      category: 'sewer',
    },
    {
      id: 'alternativeSeptic',
      label: 'Alternative Septic System',
      category: 'sewer',
    },
    {
      id: 'moundSeptic',
      label: 'Mound Septic System',
      category: 'sewer',
    },
    {
      id: 'lowPressurePipeSeptic',
      label: 'Low-Pressure-Pipe Septic System',
      category: 'sewer',
    },
    {
      id: 'septicPumpSystem',
      label: 'Septic Pump System',
      category: 'sewer',
    },
    {
      id: 'recentSepticInspection',
      label: 'Recently Inspected Septic System',
      category: 'sewer',
    },
    {
      id: 'recentSepticService',
      label: 'Recently Serviced Septic System',
      category: 'sewer',
    },
    {
      id: 'replacementDrainField',
      label: 'Replacement Drain Field',
      category: 'sewer',
    },
    {
      id: 'septicExpansionArea',
      label: 'Septic Expansion Area',
      category: 'sewer',
    },
    {
      id: 'sewerBackflowValve',
      label: 'Sewer Backflow Valve',
      category: 'sewer',
    },
  ];

  readonly fuelFeatures: readonly SystemUtilitiesFeature[] = [
    {
      id: 'naturalGas',
      label: 'Natural Gas',
      category: 'fuel',
    },
    {
      id: 'propane',
      label: 'Propane',
      category: 'fuel',
    },
    {
      id: 'ownedPropaneTank',
      label: 'Owned Propane Tank',
      category: 'fuel',
    },
    {
      id: 'leasedPropaneTank',
      label: 'Leased Propane Tank',
      category: 'fuel',
    },
    {
      id: 'undergroundPropaneTank',
      label: 'Underground Propane Tank',
      category: 'fuel',
    },
    {
      id: 'heatingOil',
      label: 'Heating Oil',
      category: 'fuel',
    },
    {
      id: 'aboveGroundOilTank',
      label: 'Above-Ground Oil Tank',
      category: 'fuel',
    },
    {
      id: 'undergroundOilTank',
      label: 'Underground Oil Tank',
      category: 'fuel',
    },
    {
      id: 'electricOnly',
      label: 'All-Electric Home',
      category: 'fuel',
    },
    {
      id: 'woodFuel',
      label: 'Wood Fuel',
      category: 'fuel',
    },
    {
      id: 'pelletFuel',
      label: 'Pellet Fuel',
      category: 'fuel',
    },
    {
      id: 'keroseneFuel',
      label: 'Kerosene Fuel',
      category: 'fuel',
    },
    {
      id: 'multipleFuelSources',
      label: 'Multiple Fuel Sources',
      category: 'fuel',
    },
    {
      id: 'gasApplianceConnections',
      label: 'Gas Appliance Connections',
      category: 'fuel',
    },
    {
      id: 'exteriorGasConnection',
      label: 'Exterior Gas Connection',
      category: 'fuel',
    },
  ];

  readonly renewableEnergyFeatures: readonly SystemUtilitiesFeature[] = [
    {
      id: 'ownedSolarPanels',
      label: 'Owned Solar Panels',
      category: 'renewableEnergy',
    },
    {
      id: 'leasedSolarPanels',
      label: 'Leased Solar Panels',
      category: 'renewableEnergy',
    },
    {
      id: 'solarPowerPurchaseAgreement',
      label: 'Solar Power Purchase Agreement',
      category: 'renewableEnergy',
    },
    {
      id: 'groundMountedSolar',
      label: 'Ground-Mounted Solar Array',
      category: 'renewableEnergy',
    },
    {
      id: 'solarRoof',
      label: 'Integrated Solar Roof',
      category: 'renewableEnergy',
    },
    {
      id: 'solarBatteryStorage',
      label: 'Solar Battery Storage',
      category: 'renewableEnergy',
    },
    {
      id: 'homeBatterySystem',
      label: 'Whole-Home Battery System',
      category: 'renewableEnergy',
    },
    {
      id: 'netMetering',
      label: 'Net-Metering Connection',
      description:
        'The electrical system is configured to return qualifying generated power to the utility grid.',
      category: 'renewableEnergy',
    },
    {
      id: 'solarReady',
      label: 'Solar-Ready',
      category: 'renewableEnergy',
    },
    {
      id: 'windPowerSystem',
      label: 'Residential Wind-Power System',
      category: 'renewableEnergy',
    },
    {
      id: 'microHydroSystem',
      label: 'Micro-Hydroelectric System',
      category: 'renewableEnergy',
    },
    {
      id: 'geothermalSystem',
      label: 'Geothermal Energy System',
      category: 'renewableEnergy',
    },
    {
      id: 'energyMonitoringSystem',
      label: 'Whole-Home Energy Monitoring',
      category: 'renewableEnergy',
    },
  ];

  readonly backupSystemFeatures: readonly SystemUtilitiesFeature[] = [
    {
      id: 'wholeHouseGenerator',
      label: 'Whole-House Generator',
      category: 'backupSystems',
    },
    {
      id: 'standbyGenerator',
      label: 'Automatic Standby Generator',
      category: 'backupSystems',
    },
    {
      id: 'portableGeneratorConnection',
      label: 'Portable Generator Connection',
      category: 'backupSystems',
    },
    {
      id: 'generatorTransferSwitch',
      label: 'Automatic Generator Transfer Switch',
      category: 'backupSystems',
    },
    {
      id: 'generatorInterlock',
      label: 'Generator Interlock',
      category: 'backupSystems',
    },
    {
      id: 'batteryBackup',
      label: 'Home Battery Backup',
      category: 'backupSystems',
    },
    {
      id: 'upsBackup',
      label: 'Uninterruptible Power Supply',
      category: 'backupSystems',
    },
    {
      id: 'backupWellPower',
      label: 'Backup Power for Well Pump',
      category: 'backupSystems',
    },
    {
      id: 'backupSumpPower',
      label: 'Backup Power for Sump Pump',
      category: 'backupSystems',
    },
    {
      id: 'backupHvacPower',
      label: 'Backup Power for HVAC',
      category: 'backupSystems',
    },
    {
      id: 'backupPropaneSupply',
      label: 'Backup Propane Supply',
      category: 'backupSystems',
    },
    {
      id: 'emergencyWaterStorage',
      label: 'Emergency Water Storage',
      category: 'backupSystems',
    },
  ];

  readonly smartUtilityFeatures: readonly SystemUtilitiesFeature[] = [
    {
      id: 'smartThermostat',
      label: 'Smart Thermostat',
      category: 'smartUtilities',
    },
    {
      id: 'multipleSmartThermostats',
      label: 'Multiple Smart Thermostats',
      category: 'smartUtilities',
    },
    {
      id: 'smartHvacControls',
      label: 'Smart HVAC Controls',
      category: 'smartUtilities',
    },
    {
      id: 'smartVentControls',
      label: 'Smart Vent Controls',
      category: 'smartUtilities',
    },
    {
      id: 'smartElectricalPanel',
      label: 'Smart Electrical Panel',
      category: 'smartUtilities',
    },
    {
      id: 'smartEnergyMonitor',
      label: 'Smart Energy Monitor',
      category: 'smartUtilities',
    },
    {
      id: 'smartWaterShutoff',
      label: 'Smart Water Shutoff',
      category: 'smartUtilities',
    },
    {
      id: 'smartLeakSensors',
      label: 'Smart Water-Leak Sensors',
      category: 'smartUtilities',
    },
    {
      id: 'smartWaterHeater',
      label: 'Smart Water Heater',
      category: 'smartUtilities',
    },
    {
      id: 'smartWaterSoftener',
      label: 'Smart Water Softener',
      category: 'smartUtilities',
    },
    {
      id: 'smartWellMonitoring',
      label: 'Smart Well Monitoring',
      category: 'smartUtilities',
    },
    {
      id: 'smartSepticMonitoring',
      label: 'Smart Septic Monitoring',
      category: 'smartUtilities',
    },
    {
      id: 'smartGeneratorMonitoring',
      label: 'Smart Generator Monitoring',
      category: 'smartUtilities',
    },
    {
      id: 'smartSolarMonitoring',
      label: 'Smart Solar Monitoring',
      category: 'smartUtilities',
    },
    {
      id: 'utilityUsageMonitoring',
      label: 'Utility-Usage Monitoring',
      category: 'smartUtilities',
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
        new Set(this.currentEnhancements.systemsUtilities ?? []),
      );

      this.hasChanges.set(false);
    } catch (error: unknown) {
      console.error(
        'Unable to load systems and utilities features:',
        error,
      );

      this.saveError.set(
        'We could not load the saved systems and utilities features.',
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
      systemsUtilities: Array.from(this.selectedFeatureIds()),
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
        'Unable to save systems and utilities features:',
        error,
      );

      this.saveError.set(
        'We could not save these systems and utilities features. Please try again.',
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