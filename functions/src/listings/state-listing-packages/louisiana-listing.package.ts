import type { StateListingPackage } from './state-listing-package';

/** Validated by the shared publication registry, including the Stripe webhook. */
export const louisianaListingPackage: StateListingPackage = {
  stateCode: 'LA',
  requiredSellerStatementFields: [
    'leadBasedPaintApplies',
    'ownersAssociationApplies',
    'generalLeasesExist',
  ],
};