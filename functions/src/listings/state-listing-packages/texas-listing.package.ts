import type {
  StateListingPackage,
} from './state-listing-package';

export const texasListingPackage:
  StateListingPackage = {
  stateCode: 'TX',

  requiredSellerStatementFields: [
    'ownershipStatus',
    'leadBasedPaintApplies',
    'ownersAssociationApplies',
    'fuelTankPresent',
    'texasLeaseCategories',
  ],
};