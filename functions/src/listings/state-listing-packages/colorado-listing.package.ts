import type { StateListingPackage } from './state-listing-package';

/** Validated by the shared publication registry, including the Stripe webhook. */
export const coloradoListingPackage: StateListingPackage = {
  stateCode: 'CO',
  requiredSellerStatementFields: [
    'leadBasedPaintApplies',
    'ownersAssociationApplies',
    'generalLeasesExist',
  ],
};