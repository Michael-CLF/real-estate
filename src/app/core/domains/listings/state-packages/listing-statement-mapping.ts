import { mapStateListingSellerStatements } from './state-listing.registry';
import type { ListingHoa, ListingSellerStatements } from '../models/listing.model';
import type { CaliforniaListingFacts } from './california/california-listing-facts.model';
import type { SouthCarolinaListingAnswers } from './south-carolina/south-carolina-listing-form';
import type { ListingStatementSaveAnswers } from './listing-statement-validation';
import { requiresStateListingField, type StateListingPackage } from './state-listing-package';

export interface ListingStatementMappingAnswers extends Omit<ListingStatementSaveAnswers,
  'ownershipStatus' | 'fuelTankOwnership'> {
  ownershipStatus: NonNullable<ListingSellerStatements['ownershipStatus']> | '';
  fuelTankOwnership: NonNullable<ListingSellerStatements['fuelTankOwnership']> | '';
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
