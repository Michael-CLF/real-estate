import type { PennsylvaniaListingAnswers } from './pennsylvania/pennsylvania-listing-form';
import type { NorthDakotaListingAnswers } from './north-dakota/north-dakota-listing-form';
import type { NevadaListingAnswers } from './nevada/nevada-listing-form';
import type { GeorgiaListingAnswers } from './georgia/georgia-listing-form';
import type { KentuckyListingAnswers } from './kentucky/kentucky-listing-form';
import type { RhodeIslandListingAnswers } from './rhode-island/rhode-island-listing-form';
import type { TennesseeListingAnswers } from './tennessee/tennessee-listing-form';
import type { WestVirginiaListingAnswers } from './west-virginia/west-virginia-listing-form';
import type { ListingContractFacts } from '../models/listing.model';
import type { WyomingListingAnswers } from './wyoming/wyoming-listing-form';
import type { MaineListingAnswers } from './maine/maine-listing-form';
import type { MississippiListingAnswers } from './mississippi/mississippi-listing-form';
import type { ArkansasListingAnswers } from './arkansas/arkansas-listing-form';
import type { IllinoisListingAnswers } from './illinois/illinois-listing-form';
import type { SouthDakotaListingAnswers } from './south-dakota/south-dakota-listing-form';
import type { NewMexicoListingAnswers } from './new-mexico/new-mexico-listing-form';
import type { MarylandListingAnswers } from './maryland/maryland-listing-form';
import type { MontanaListingAnswers } from './montana/montana-listing-form';
import type { IowaListingAnswers } from './iowa/iowa-listing-form';
import type { WashingtonListingAnswers } from './washington/washington-listing-form';
import type { DelawareListingAnswers } from './delaware/delaware-listing-form';
import type { OhioListingAnswers } from './ohio/ohio-listing-form';
import type { KansasListingAnswers } from './kansas/kansas-listing-form';
import type { IndianaListingAnswers } from './indiana/indiana-listing-form';
import type { AlabamaListingAnswers } from './alabama/alabama-listing-form';
import type { NewHampshireListingAnswers } from './new-hampshire/new-hampshire-listing-form';
import type { NebraskaListingAnswers } from './nebraska/nebraska-listing-form';
import type { MissouriListingAnswers } from './missouri/missouri-listing-form';
import type { OregonListingAnswers } from './oregon/oregon-listing-form';
import { mapStateListingSellerStatements } from './state-listing.registry';
import type { ListingHoa, ListingSellerStatements } from '../models/listing.model';
import type { CaliforniaListingFacts } from './california/california-listing-facts.model';
import type { SouthCarolinaListingAnswers } from './south-carolina/south-carolina-listing-form';
import type { ListingStatementSaveAnswers } from './listing-statement-validation';
import { requiresStateListingField, type StateListingPackage } from './state-listing-package';

export interface ListingStatementMappingAnswers extends Omit<ListingStatementSaveAnswers,
  'ownershipStatus' | 'fuelTankOwnership'> {
  contractFacts?: ListingContractFacts;
  ownershipStatus: NonNullable<ListingSellerStatements['ownershipStatus']> | '';
  fuelTankOwnership: NonNullable<ListingSellerStatements['fuelTankOwnership']> | '';
  oregon?: OregonListingAnswers;
  missouri?: MissouriListingAnswers;
  nebraska?: NebraskaListingAnswers;
  newHampshire?: NewHampshireListingAnswers;
  alabama?: AlabamaListingAnswers;
  indiana?: IndianaListingAnswers;
  kansas?: KansasListingAnswers;
  ohio?: OhioListingAnswers;
  delaware?: DelawareListingAnswers;
  washington?: WashingtonListingAnswers;
  iowa?: IowaListingAnswers;
  montana?: MontanaListingAnswers;
  maryland?: MarylandListingAnswers;
  newMexico?: NewMexicoListingAnswers;
  southDakota?: SouthDakotaListingAnswers;
  wyoming?: WyomingListingAnswers;
  maine?: MaineListingAnswers;
  georgia?: GeorgiaListingAnswers;
  kentucky?: KentuckyListingAnswers;
  rhodeIsland?: RhodeIslandListingAnswers;
  tennessee?: TennesseeListingAnswers;
  westVirginia?: WestVirginiaListingAnswers;
  nevada?: NevadaListingAnswers;
  northDakota?: NorthDakotaListingAnswers;
  pennsylvania?: PennsylvaniaListingAnswers;
  mississippi?: MississippiListingAnswers;
  arkansas?: ArkansasListingAnswers;
  illinois?: IllinoisListingAnswers;
  southCarolina?: SouthCarolinaListingAnswers;
  california?: CaliforniaListingFacts;
  additionalSellerIncluded: boolean;
  additionalSellerLegalName: string;
  additionalSellerEmail: string;
  additionalSellerPhone: string;
}

export interface ListingStatementHoaInput {
  hasHoa: boolean | null;
  associationName: string;
  managementCompany: string;
  contactPhone: string;
  feeAmount: number | null;
  feeFrequency: NonNullable<ListingHoa['feeFrequency']> | '';
}

/** Build the existing saved statement and HOA payload after save-time validation. */
export function buildListingStatementPayload(
  stateCode: string,
  statePackage: StateListingPackage,
  statements: ListingStatementMappingAnswers,
  hoaValue: ListingStatementHoaInput | null | undefined,
): { hoaDetails: ListingHoa; sellerStatements: ListingSellerStatements } {
  const isTexasListing = requiresStateListingField(statePackage, 'texasLeaseCategories');
  const fuelTankOwnership =
    statements.fuelTankOwnership || undefined;
  const hoa: ListingStatementHoaInput = hoaValue ?? {
    hasHoa: null,
    associationName: '',
    managementCompany: '',
    contactPhone: '',
    feeAmount: null,
    feeFrequency: '',
  };
  const associationName =
    hoa.associationName.trim();
  const managementCompany =
    hoa.managementCompany.trim();
  const contactPhone =
    hoa.contactPhone.trim();
  const ownersAssociationContact = [
    managementCompany,
    contactPhone,
  ]
    .filter((value) => value.length > 0)
    .join(' · ');
  const hoaDetails: ListingHoa = {
    hasHoa:
      statements.ownersAssociationApplies ===
      true,
    includedItems: [],
    ...(associationName
      ? {
        associationName,
      }
      : {}),
    ...(managementCompany
      ? {
        managementCompany,
      }
      : {}),
    ...(contactPhone
      ? {
        contactPhone,
      }
      : {}),
    ...(hoa.feeAmount !== null
      ? {
        feeAmount: hoa.feeAmount,
      }
      : {}),
    ...(hoa.feeFrequency
      ? {
        feeFrequency:
          hoa.feeFrequency,
      }
      : {}),
  };
  const sellerStatements:
    ListingSellerStatements = {
    stateCode,
    schemaVersion: 1,
    ...(statements.contractFacts ? {contractFacts: statements.contractFacts} : {}),
    ...mapStateListingSellerStatements(stateCode, statements),
    ...(requiresStateListingField(
      statePackage,
      'utahMethamphetamineContamination',
    )
      ? {
        methamphetamineContaminationKnown:
          statements.methamphetamineContaminationKnown === true,
      }
      : {}),
    ...(requiresStateListingField(
      statePackage,
      'ownershipStatus',
    )
      ? {
        ownershipStatus:
          statements.ownershipStatus ||
          undefined,
      }
      : {}),
    ...(requiresStateListingField(
      statePackage,
      'leadBasedPaintApplies',
    )
      ? {
        leadBasedPaintApplies:
          statements
            .leadBasedPaintApplies ===
          true,
      }
      : {}),
    ...(requiresStateListingField(
      statePackage,
      'ownersAssociationApplies',
    )
      ? {
        ownersAssociationApplies:
          statements
            .ownersAssociationApplies ===
          true,
      }
      : {}),
    ...(associationName
      ? {
        ownersAssociationName:
          associationName,
      }
      : {}),
    ...(hoa.feeAmount !== null
      ? {
        ownersAssociationDuesInCents:
          Math.round(
            hoa.feeAmount * 100,
          ),
      }
      : {}),
    ...(hoa.feeFrequency
      ? {
        ownersAssociationDuesFrequency:
          hoa.feeFrequency,
      }
      : {}),
    ...(ownersAssociationContact
      ? {
        ownersAssociationContact,
      }
      : {}),
    ...(requiresStateListingField(
      statePackage,
      'fuelTankPresent',
    )
      ? {
        fuelTankPresent:
          statements.fuelTankPresent ===
          true,
      }
      : {}),
    ...(statements.fuelTankPresent ===
      true
      ? {
        fuelTankOwnership,
      }
      : {}),
    ...(isTexasListing ||
      requiresStateListingField(
        statePackage,
        'generalLeasesExist',
      )
      ? {
        leasesExist:
          isTexasListing
            ? statements
              .residentialLeasesExist ===
            true ||
            statements
              .fixtureLeasesExist ===
            true ||
            statements
              .naturalResourceLeasesExist ===
            true
            : statements.leasesExist ===
            true,
      }
      : {}),
    ...(isTexasListing
      ? {
        residentialLeasesExist:
          statements
            .residentialLeasesExist ===
          true,
        fixtureLeasesExist:
          statements.fixtureLeasesExist ===
          true,
        naturalResourceLeasesExist:
          statements
            .naturalResourceLeasesExist ===
          true,
      }
      : {}),
    ...(statements.additionalSellerIncluded
      ? {
        additionalSeller: {
          legalName:
            statements.additionalSellerLegalName
              .trim(),
          email:
            statements.additionalSellerEmail
              .trim()
              .toLowerCase(),
          phone:
            statements.additionalSellerPhone
              .trim(),
        },
      }
      : {}),
  };
  return { hoaDetails, sellerStatements };
}
