import type { StateListingPackage } from './state-listing-package';

/** Validated by the shared publication registry, including the Stripe webhook. */
export const wisconsinListingPackage: StateListingPackage = {
  stateCode: 'WI',
  requiredSellerStatementFields: [
    'leadBasedPaintApplies',
    'generalLeasesExist',
  ],
};
