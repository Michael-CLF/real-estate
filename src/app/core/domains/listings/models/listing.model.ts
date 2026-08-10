export interface Listing {
  Uid: string;
  sellerUid: string;

  // Address
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;

  // Core property information
  listPrice: number;
  propertyType: PropertyType;
  bedrooms: number;
  fullBathrooms: number;
  halfBathrooms: number;
  squareFeet: number;
  lotSize?: number;
  lotSizeUnit?: LotSizeUnit;
  yearBuilt?: number;
  description?: string;
  stories?: number;

  // Complete property information
  construction?: ListingConstruction;
  interior?: ListingInterior;
  rooms?: ListingRooms;
  kitchen?: ListingKitchen;
  bathrooms?: ListingBathroomFeatures;
  parking?: ListingParking;
  systems?: ListingSystems;
  utilities?: ListingUtilities;
  hoa?: ListingHoa;
  communityAmenities?: ListingCommunityAmenities;
  accessibility?: ListingAccessibility;
  schools?: ListingSchools;
  parcelAndTaxes?: ListingParcelAndTaxes;

  // Features and amenities
  features: ListingFeatures;

  // Photos
  primaryPhotoUrl?: string;
  photoUrls?: string[];
  photos?: ListingPhotoReference[];

  // Listing upgrades
  featuredListing: boolean;

  // Promotion
  promotion?: ListingPromotion;

  // Seller certification
  certification: ListingCertification;

  // Workflow
  workflow: ListingWorkflow;

  // Marketplace
  status: ListingStatus;
  draftStep?: ListingDraftStep;
  completionPercent?: number;
  daysOnMarket: number;
  views: number;
  favorites: number;

  // Dates
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListingConstruction {
  architecturalStyle?: ArchitecturalStyle;
  otherArchitecturalStyle?: string;

  exteriorMaterials: ExteriorMaterial[];
  otherExteriorMaterial?: string;

  roofType?: RoofType;
  otherRoofType?: string;
  roofAge?: number;

  foundationType?: FoundationType;
  otherFoundationType?: string;

  basementType?: BasementType;

  newConstruction: boolean;
  constructionYear?: number;
}

export interface ListingInterior {
  flooringTypes: FlooringType[];
  otherFlooringType?: string;

  floorPlan?: FloorPlanType;
  ceilingFeatures: CeilingFeature[];

  fireplaceCount?: number;
  fireplaceTypes: FireplaceType[];

  interiorFeatures: InteriorFeature[];
}

export interface ListingRooms {
  bedrooms: number;
  fullBathrooms: number;
  halfBathrooms: number;

  hasFormalLivingRoom: boolean;
  hasFamilyRoom: boolean;
  hasFormalDiningRoom: boolean;
  hasBreakfastArea: boolean;
  hasHomeOffice: boolean;
  hasLaundryRoom: boolean;
  hasMudroom: boolean;
  hasBonusRoom: boolean;
  hasLoft: boolean;
  hasMediaRoom: boolean;
  hasHomeGym: boolean;
  hasLibrary: boolean;
  hasWineCellar: boolean;
  hasFinishedAttic: boolean;

  laundryLocation?: LaundryLocation;
  primaryBedroomFloor?: PrimaryBedroomFloor;
}

export interface ListingKitchen {
  kitchenIsland: boolean;
  peninsula: boolean;
  walkInPantry: boolean;
  butlersPantry: boolean;
  breakfastNook: boolean;

  stoneCountertops: boolean;
  countertopMaterials: CountertopMaterial[];
  otherCountertopMaterial?: string;

  customCabinetry: boolean;
  softCloseCabinetry: boolean;
  underCabinetLighting: boolean;

  stainlessAppliances: boolean;
  energyStarAppliances: boolean;
  smartAppliances: boolean;

  gasRange: boolean;
  electricRange: boolean;
  inductionRange: boolean;
  doubleOven: boolean;
  warmingDrawer: boolean;
  potFiller: boolean;
  wineRefrigerator: boolean;
  iceMaker: boolean;

  farmhouseSink: boolean;
  multipleSinks: boolean;
  instantHotWater: boolean;
  waterFiltration: boolean;
}

export interface ListingBathroomFeatures {
  primaryBathroom: boolean;
  doubleVanity: boolean;
  separateTubAndShower: boolean;
  largeWalkInShower: boolean;
  zeroThresholdShower: boolean;
  soakingTub: boolean;
  freestandingTub: boolean;
  jettedTub: boolean;
  rainShower: boolean;
  bodySprays: boolean;
  heatedFloors: boolean;
  towelWarmers: boolean;
  bidet: boolean;
  waterCloset: boolean;
  makeupVanity: boolean;
}

export interface ListingParking {
  garageType?: GarageType;
  garageSpaces: number;
  totalParkingSpaces: number;

  attachedGarage: boolean;
  detachedGarage: boolean;
  carport: boolean;
  carportSpaces: number;

  assignedParking: boolean;
  assignedParkingSpaces: number;

  drivewayType?: DrivewayType;
  drivewaySurface?: DrivewaySurface;

  gatedParking: boolean;
  circularDriveway: boolean;
  garageWorkshop: boolean;
  rvParking: boolean;
  boatParking: boolean;

  evChargingStatus: EvChargingStatus;
}

export interface ListingSystems {
  heatingTypes: HeatingType[];
  otherHeatingType?: string;

  coolingTypes: CoolingType[];
  otherCoolingType?: string;

  centralHvac: boolean;
  centralAir: boolean;
  heatPump: boolean;
  gasHeat: boolean;
  multiZoneHvac: boolean;
  geothermal: boolean;

  waterHeaterType?: WaterHeaterType;

  smartThermostat: boolean;
  smartLighting: boolean;
  smartLocks: boolean;
  securitySystem: boolean;
  securityCameras: boolean;
  videoDoorbell: boolean;
  homeAutomationSystem: boolean;
  builtInSpeakers: boolean;
  hardwiredEthernet: boolean;
  wholeHomeWifi: boolean;

  wholeHomeAirFiltration: boolean;
  waterFiltrationSystem: boolean;
  waterSoftener: boolean;
  waterSenseFixtures: boolean;

  solarPanels: boolean;
  solarReady: boolean;
  generator: boolean;
  ledLighting: boolean;
  energyEfficientWindows: boolean;
  upgradedInsulation: boolean;
}

export interface ListingUtilities {
  electricProvider?: string;
  gasProvider?: string;
  waterProvider?: string;
  sewerProvider?: string;

  electricSource?: ElectricSource;
  gasAvailable: boolean;

  waterSource?: WaterSource;
  sewerType?: SewerType;

  privateWell: boolean;
  sharedWell: boolean;
  municipalWater: boolean;

  septicSystem: boolean;
  septicPermitAvailable: boolean;
  septicBedrooms?: number;

  propaneTank: boolean;
  propaneTankOwned?: boolean;

  internetTypes: InternetType[];
  trashService?: TrashServiceType;
}

export interface ListingHoa {
  hasHoa: boolean;
  associationName?: string;
  managementCompany?: string;
  contactPhone?: string;
  websiteUrl?: string;

  feeAmount?: number;
  feeFrequency?: ListingHoaFeeFrequency;
  additionalFeeAmount?: number;
  additionalFeeFrequency?: ListingHoaFeeFrequency;

  includedItems: ListingHoaIncludedItem[];
  transferFee?: number;
  capitalContributionFee?: number;

  hasRestrictions?: boolean;
  rentalRestrictions?: boolean;
  petRestrictions?: boolean;
}

export interface ListingCommunityAmenities {
  amenities: CommunityAmenity[];
  otherAmenities?: string;

  gatedCommunity: boolean;
  securityPatrol: boolean;
  concierge: boolean;
  doorman: boolean;

  communityPool: boolean;
  clubhouse: boolean;
  fitnessCenter: boolean;
  tennisCourts: boolean;
  pickleballCourts: boolean;
  basketballCourts: boolean;
  playground: boolean;
  dogPark: boolean;
  walkingTrails: boolean;
  sharedGreenSpace: boolean;
  golfCourseAccess: boolean;
  marinaAccess: boolean;
}

export interface ListingAccessibility {
  features: AccessibilityFeature[];
  otherFeatures?: string;

  singleStoryLiving: boolean;
  zeroStepEntry: boolean;
  wideDoorways: boolean;
  wideHallways: boolean;
  accessibleParking: boolean;
  accessibleBathroom: boolean;
  rollInShower: boolean;
  grabBars: boolean;
  accessibleSinks: boolean;
  wheelchairRamp: boolean;
  stairLift: boolean;
  elevator: boolean;
  firstFloorBedroom: boolean;
  firstFloorFullBathroom: boolean;
}

export interface ListingSchools {
  elementarySchool?: ListingSchool;
  middleSchool?: ListingSchool;
  highSchool?: ListingSchool;
  districtName?: string;
  assignedSchoolsVerified: boolean;
}

export interface ListingSchool {
  name: string;
  district?: string;
  schoolType: SchoolType;
  grades?: string;
  distanceMiles?: number;
}

export interface ListingParcelAndTaxes {
  parcelNumber?: string;
  legalDescription?: string;
  subdivisionName?: string;

  annualPropertyTax?: number;
  taxYear?: number;
  assessedValue?: number;

  zoning?: string;
  lotNumber?: string;
  blockNumber?: string;

  specialAssessments?: number;
  specialAssessmentDescription?: string;
}

export interface ListingFeatures {
  // Kitchen
  kitchenIsland: boolean;
  pantry: boolean;
  stoneCountertops: boolean;
  softCloseCabinetry: boolean;
  stainlessAppliances: boolean;
  gasRange: boolean;
  doubleOven: boolean;
  butlersPantry: boolean;

  // Interior
  fireplace: boolean;
  hardwoodFloors: boolean;
  vaultedCeilings: boolean;
  homeOffice: boolean;
  bonusRoom: boolean;
  finishedBasement: boolean;
  mudroom: boolean;
  homeGym: boolean;
  walkInCloset: boolean;
  customClosets: boolean;
  builtInShelving: boolean;
  crownMolding: boolean;
  wetBar: boolean;
  mediaRoom: boolean;
  soundproofing: boolean;

  // Primary bathroom
  ensuiteBath: boolean;
  doubleVanity: boolean;
  soakingTub: boolean;
  separateTubAndShower: boolean;
  largeWalkInShower: boolean;

  // Exterior and outdoor living
  deck: boolean;
  patio: boolean;
  porch: boolean;
  balcony: boolean;
  fencedYard: boolean;
  irrigationSystem: boolean;
  matureLandscaping: boolean;
  landscapeLighting: boolean;

  pool: boolean;
  spaHotTub: boolean;
  coveredOutdoorLiving: boolean;
  outdoorCeilingFans: boolean;
  outdoorHeaters: boolean;
  outdoorKitchen: boolean;
  builtInGrill: boolean;
  firePit: boolean;
  outdoorFireplace: boolean;

  shed: boolean;
  barn: boolean;
  workshop: boolean;
  guestHouse: boolean;
  aduReady: boolean;
  greenhouse: boolean;
  gardenArea: boolean;

  // Parking
  attachedGarage: boolean;
  detachedGarage: boolean;
  carport: boolean;
  garageWorkshop: boolean;
  rvParking: boolean;
  boatParking: boolean;
  evChargingStatus: EvChargingStatus;

  // Technology and systems
  centralHvac: boolean;
  heatPump: boolean;
  gasHeat: boolean;
  centralAir: boolean;
  multiZoneHvac: boolean;

  solarPanels: boolean;
  generator: boolean;
  smartThermostat: boolean;
  smartLighting: boolean;
  smartLocks: boolean;
  securitySystem: boolean;
  securityCameras: boolean;
  videoDoorbell: boolean;
  hardwiredEthernet: boolean;
  builtInSpeakers: boolean;

  wholeHomeAirFiltration: boolean;
  waterFiltrationSystem: boolean;
  waterSenseFixtures: boolean;
}

export interface ListingPhotoReference {
  id: string;
  originalFileName: string;

  storagePath: string;
  thumbnailStoragePath: string;

  fullImageUrl: string;
  thumbnailUrl: string;

  isPrimary: boolean;
  sortOrder: number;

  width: number;
  height: number;
  sizeBytes: number;

  thumbnailWidth: number;
  thumbnailHeight: number;
  thumbnailSizeBytes: number;
}

export interface ListingPromotion {
  code: string;
  type: 'fixed' | 'percentage';
  value: number;
  discountAmount: number;
}

export interface ListingCertification {
  accepted: boolean;
  acceptedAt?: Date;
}

export interface ListingWorkflow {
  identityVerified: boolean;
  paymentCompleted: boolean;
  published: boolean;
}

/*
 * A listing draft remains in the listingDrafts collection until
 * identity verification, payment, and publication requirements
 * have been completed.
 */
export interface ListingDraft {
  Uid: string;
  sellerUid: string;

  address?: ListingDraftAddress;
  propertyDetails?: ListingDraftPropertyDetails;

  construction?: ListingConstruction;
  interior?: ListingInterior;
  rooms?: ListingRooms;
  kitchen?: ListingKitchen;
  bathrooms?: ListingBathroomFeatures;
  parking?: ListingParking;
  systems?: ListingSystems;
  utilities?: ListingUtilities;
  hoa?: ListingHoa;
  communityAmenities?: ListingCommunityAmenities;
  accessibility?: ListingAccessibility;
  schools?: ListingSchools;
  parcelAndTaxes?: ListingParcelAndTaxes;

  features?: ListingFeatures;
  photos?: ListingPhotoReference[];
  pricing?: ListingDraftPricing;

  primaryPhotoUrl?: string;
  photoUrls?: string[];

  featuredListing: boolean;
  promotion?: ListingPromotion;

  certification: ListingCertification;

  progress: ListingDraftProgress;
  publication: ListingPublicationWorkflow;

  createdAt: Date;
  updatedAt: Date;
  lastSavedAt: Date;
}

export interface ListingDraftAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  latitude?: number;
  longitude?: number;
}

export interface ListingDraftPropertyDetails {
  propertyType: PropertyType;

  bedrooms: number;
  fullBathrooms: number;
  halfBathrooms: number;

  squareFeet: number;
  lotSize?: number;
  lotSizeUnit?: LotSizeUnit;

  yearBuilt: number;
  stories?: number;
  description?: string;
}

export interface ListingDraftPricing {
  listPrice: number;
}

export interface ListingDraftProgress {
  /*
   * The step the seller should see when reopening the listing wizard.
   */
  currentStep: ListingDraftStep;

  /*
   * The most recent step that was successfully validated and saved.
   */
  lastCompletedStep?: ListingDraftStep;

  completedSteps: ListingDraftStep[];
  completionPercent: number;

  contentStatus:
    | 'in_progress'
    | 'complete';
}

export interface ListingPublicationWorkflow {
  status: ListingPublicationStatus;

  identityStatus: ListingIdentityStatus;
  paymentStatus: ListingPaymentStatus;

  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;

  paymentAmount?: number;
  paidAt?: Date;

  publishedListingUid?: string;
  publishedAt?: Date;
}

export type ListingStatus =
  | 'draft'
  | 'coming_soon'
  | 'active'
  | 'under_contract'
  | 'pending'
  | 'sold'
  | 'expired'
  | 'withdrawn';

export type PropertyType =
  | 'single_family'
  | 'condo'
  | 'townhome'
  | 'multi_family'
  | 'land'
  | 'mobile'
  | 'pud';

export type ListingDraftStep =
  | 'address'
  | 'property_details'
  | 'construction'
  | 'interior'
  | 'rooms'
  | 'kitchen_bathrooms'
  | 'parking'
  | 'systems_utilities'
  | 'hoa_community'
  | 'accessibility'
  | 'schools'
  | 'parcel_taxes'
  | 'property_features'
  | 'photos'
  | 'pricing'
  | 'review';

export type ListingPublicationStatus =
  | 'content_incomplete'
  | 'identity_required'
  | 'identity_pending'
  | 'payment_required'
  | 'payment_processing'
  | 'payment_failed'
  | 'ready_to_publish'
  | 'published';

export type ListingIdentityStatus =
  | 'not_started'
  | 'pending'
  | 'processing'
  | 'verified'
  | 'failed'
  | 'requires_input';

export type ListingPaymentStatus =
  | 'not_started'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded';

export type LotSizeUnit =
  | 'acres'
  | 'square_feet';

export type ArchitecturalStyle =
  | 'a_frame'
  | 'bungalow'
  | 'cape_cod'
  | 'colonial'
  | 'contemporary'
  | 'craftsman'
  | 'farmhouse'
  | 'french_country'
  | 'mediterranean'
  | 'mid_century_modern'
  | 'modern'
  | 'ranch'
  | 'spanish'
  | 'traditional'
  | 'tudor'
  | 'victorian'
  | 'other';

export type ExteriorMaterial =
  | 'brick'
  | 'fiber_cement'
  | 'log'
  | 'metal'
  | 'stone'
  | 'stucco'
  | 'vinyl_siding'
  | 'wood_siding'
  | 'other';

export type RoofType =
  | 'architectural_shingle'
  | 'asphalt_shingle'
  | 'flat'
  | 'metal'
  | 'rubber'
  | 'slate'
  | 'tile'
  | 'tpo'
  | 'wood_shake'
  | 'other';

export type FoundationType =
  | 'basement'
  | 'crawl_space'
  | 'pier_and_beam'
  | 'raised'
  | 'slab'
  | 'other';

export type BasementType =
  | 'none'
  | 'unfinished'
  | 'partially_finished'
  | 'finished'
  | 'walkout';

export type FlooringType =
  | 'bamboo'
  | 'carpet'
  | 'concrete'
  | 'engineered_hardwood'
  | 'hardwood'
  | 'laminate'
  | 'luxury_vinyl_plank'
  | 'marble'
  | 'stone'
  | 'tile'
  | 'vinyl'
  | 'other';

export type FloorPlanType =
  | 'open'
  | 'traditional'
  | 'split_level'
  | 'other';

export type CeilingFeature =
  | 'cathedral'
  | 'coffered'
  | 'high'
  | 'standard'
  | 'tray'
  | 'vaulted';

export type FireplaceType =
  | 'electric'
  | 'gas'
  | 'pellet'
  | 'wood_burning';

export type InteriorFeature =
  | 'built_in_cabinetry'
  | 'built_in_shelving'
  | 'central_vacuum'
  | 'crown_molding'
  | 'custom_closets'
  | 'intercom'
  | 'linen_closet'
  | 'safe_room'
  | 'soundproofing'
  | 'wainscoting'
  | 'walk_in_closet'
  | 'wet_bar';

export type LaundryLocation =
  | 'basement'
  | 'garage'
  | 'hallway'
  | 'laundry_room'
  | 'main_floor'
  | 'upper_floor'
  | 'utility_room';

export type PrimaryBedroomFloor =
  | 'basement'
  | 'main'
  | 'second'
  | 'third';

export type CountertopMaterial =
  | 'butcher_block'
  | 'concrete'
  | 'granite'
  | 'laminate'
  | 'marble'
  | 'quartz'
  | 'quartzite'
  | 'solid_surface'
  | 'soapstone'
  | 'tile'
  | 'other';

export type GarageType =
  | 'none'
  | 'attached'
  | 'detached'
  | 'built_in'
  | 'tandem';

export type DrivewayType =
  | 'standard'
  | 'circular'
  | 'shared'
  | 'gated';

export type DrivewaySurface =
  | 'asphalt'
  | 'concrete'
  | 'gravel'
  | 'paver'
  | 'other';

export type EvChargingStatus =
  | 'none'
  | 'ready'
  | 'installed';

export type HeatingType =
  | 'baseboard'
  | 'electric'
  | 'forced_air'
  | 'gas'
  | 'geothermal'
  | 'heat_pump'
  | 'oil'
  | 'propane'
  | 'radiant'
  | 'wood'
  | 'other';

export type CoolingType =
  | 'central_air'
  | 'ductless_mini_split'
  | 'evaporative'
  | 'geothermal'
  | 'heat_pump'
  | 'window_units'
  | 'other';

export type WaterHeaterType =
  | 'electric'
  | 'gas'
  | 'heat_pump'
  | 'propane'
  | 'solar'
  | 'tankless';

export type ElectricSource =
  | 'public'
  | 'solar'
  | 'generator'
  | 'off_grid';

export type WaterSource =
  | 'municipal'
  | 'private_well'
  | 'shared_well'
  | 'community_system'
  | 'other';

export type SewerType =
  | 'municipal'
  | 'private_septic'
  | 'shared_septic'
  | 'community_system'
  | 'other';

export type InternetType =
  | 'cable'
  | 'dsl'
  | 'fiber'
  | 'fixed_wireless'
  | 'satellite'
  | 'none';

export type TrashServiceType =
  | 'municipal'
  | 'private'
  | 'hoa'
  | 'self_disposal';

export type ListingHoaFeeFrequency =
  | 'monthly'
  | 'quarterly'
  | 'semi_annually'
  | 'annually';

export type ListingHoaIncludedItem =
  | 'amenities'
  | 'cable'
  | 'common_area_maintenance'
  | 'exterior_maintenance'
  | 'internet'
  | 'insurance'
  | 'landscaping'
  | 'pest_control'
  | 'road_maintenance'
  | 'security'
  | 'sewer'
  | 'snow_removal'
  | 'trash'
  | 'water';

export type CommunityAmenity =
  | 'basketball_court'
  | 'clubhouse'
  | 'community_garden'
  | 'community_pool'
  | 'concierge'
  | 'dog_park'
  | 'fitness_center'
  | 'gated_entry'
  | 'golf_course'
  | 'marina'
  | 'meeting_room'
  | 'park'
  | 'pickleball_court'
  | 'playground'
  | 'security_patrol'
  | 'shared_green_space'
  | 'tennis_court'
  | 'walking_trails'
  | 'other';

export type AccessibilityFeature =
  | 'accessible_bathroom'
  | 'accessible_parking'
  | 'accessible_sink'
  | 'elevator'
  | 'first_floor_bedroom'
  | 'first_floor_full_bathroom'
  | 'grab_bars'
  | 'roll_in_shower'
  | 'single_story_living'
  | 'stair_lift'
  | 'wheelchair_ramp'
  | 'wide_doorways'
  | 'wide_hallways'
  | 'zero_step_entry'
  | 'other';

export type SchoolType =
  | 'public'
  | 'charter'
  | 'magnet'
  | 'private';