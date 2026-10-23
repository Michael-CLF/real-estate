import type { ListingContractFacts } from '../../listings/models/listing.model';
import type { CaliforniaListingFacts } from '../../listings/state-packages/california/california-listing-facts.model';
import { ListingPhoto } from '../../listings/models/listing-photo.model';
import { ListingStatus } from '../../listings/models/listing-status.type';
import { PropertyType } from '../../property/models/property-type.type';
import {
  ListingEnhancements,
  ListingHoa,
  ListingSchools,
  LotSizeUnit
} from '../../listings/models/listing.model';


export interface ListingAddress {
  addressLine1: string;
  addressLine2?: string;

  city: string;
  state: string;
  stateAbbreviation: string;
  stateSlug: string;

  postalCode: string;
  county?: string;
}

export interface ListingLocation {
  latitude: number;
  longitude: number;
  geohash?: string;
}

export interface MarketplaceListing {
  uid: string;
  sellerUid: string;
  firestoreDocumentId?: string;

  status: ListingStatus;
  pendingOfferCount?: number;
  propertyType: PropertyType;

  title: string;
  description: string;

  price: number;
  originalPrice?: number;
  featuredListing: boolean;

  bedrooms?: number;
  bathrooms?: number;

  squareFeet?: number;

  /*
   * Generic lot-size fields used by current listings.
   */
  lotSize?: number;
  lotSizeUnit?: LotSizeUnit;

  /*
   * Retained for compatibility with existing marketplace code
   * and older listings that stored lot size as acres.
   */
  lotSizeAcres?: number;

  legalDescription?: string;
  yearBuilt?: number;
  sellerStatements?: {
    contractFacts?: ListingContractFacts;
    california?: CaliforniaListingFacts;
    oregon?: { historicSpecialAssessmentApplies?: boolean | null; usesMountainTime?: boolean | null; domesticWellApplies?: boolean | null; uncertifiedWoodDevicePresent?: boolean | null };
    alabama?: { usesEasternTime?: boolean | null; hiddenHealthSafetyKnown?: boolean | null; };
    indiana?: { usesCentralTime?: boolean | null; disclosureExemptionClaimed?: boolean | null; };
    kansas?: { usesMountainTime?: boolean | null; elevatedRadonKnown?: boolean | null; };
    ohio?: { disclosureExemptionClaimed?: boolean | null; };
    delaware?: { disclosureExemptionClaimed?: boolean | null; radonReportsKnown?: boolean | null; };
    washington?: { disclosureExemptionClaimed?: boolean | null; oilTankHeating?: boolean | null; };
    iowa?: { disclosureExemptionClaimed?: boolean | null; privateSewageApplies?: boolean | null; leadServiceLineKnown?: boolean | null; };
    montana?: { disclosureExemptionClaimed?: boolean | null; radonTestsKnown?: boolean | null; drugContaminationKnown?: boolean | null; appurtenantWaterRightsKnown?: boolean | null; };
    maryland?: { disclosureExemptionClaimed?: boolean | null; usesDisclaimer?: boolean | null; privateWellApplies?: boolean | null; onsiteSewageApplies?: boolean | null; deferredWaterSewerCharges?: boolean | null; superfundNearby?: boolean | null; otherPropertyNoticeApplies?: boolean | null; rentalLeadObligationApplies?: boolean | null; groundRentApplies?: boolean | null; };
    newMexico?: { privateWastewaterApplies?: boolean | null; drugLabContaminationKnown?: boolean | null; appurtenantWaterRightsKnown?: boolean | null; };
    southDakota?: { usesMountainTime?: boolean | null; disclosureExemptionClaimed?: boolean | null; privateTransferFeeKnown?: boolean | null; };
    wyoming?: { privateWastewaterApplies?: boolean | null; appurtenantWaterRightsKnown?: boolean | null; };
    maine?: { disclosureExemptionClaimed?: boolean | null; };
    mississippi?: {};
    arkansas?: { };
    illinois?: { disclosureExemptionClaimed?: boolean | null; radonExemptionClaimed?: boolean | null; };
    missouri?: { methProductionKnown?: boolean | null; drugConvictionKnown?: boolean | null };
    nebraska?: { usesMountainTime?: boolean | null };
    newHampshire?: { methProductionKnown?: boolean | null; utilityTariffChargesKnown?: boolean | null };
    ownersAssociationApplies?: boolean | null;
    leadBasedPaintApplies?: boolean | null;
  };
  annualPropertyTax?: number;
  annualHomeownersInsurance?: number;
  hoa?: ListingHoa;

  enhancements?: ListingEnhancements;
  schools?: ListingSchools;

  address: ListingAddress;
  location: ListingLocation;

  photos: ListingPhoto[];
  featuredPhotoUrl?: string;
  photoCount: number;

  favoriteCount: number;
  viewCount: number;
  inquiryCount: number;

  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
