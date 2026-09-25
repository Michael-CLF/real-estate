import type {
  StateListingPackage,
} from './state-listing-package';

export const northCarolinaListingPackage:
  StateListingPackage = {
  stateCode: 'NC',

  requiredSellerStatementFields: [
    'ownershipStatus',
    'leadBasedPaintApplies',
    'ownersAssociationApplies',
    'fuelTankPresent',
    'generalLeasesExist',
  ],
};