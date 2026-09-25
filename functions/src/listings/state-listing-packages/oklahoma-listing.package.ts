import type {
  StateListingPackage,
} from './state-listing-package';

export const oklahomaListingPackage:
  StateListingPackage = {
  stateCode: 'OK',

  requiredSellerStatementFields: [
    'leadBasedPaintApplies',
    'ownersAssociationApplies',
  ],
};