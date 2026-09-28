import type { StateListingPackage } from '../state-listing-package';

/** Uploaded disclosure is required before NavStreet will accept a Louisiana offer. */
export const louisianaListingPackage: StateListingPackage = {
  stateCode: 'LA',
  stateName: 'Louisiana',
  requiredSellerStatementFields: [
    'leadBasedPaintApplies',
    'ownersAssociationApplies',
    'generalLeasesExist',
  ],
  disclosureRequirements: [
    { documentType: 'louisiana-property-disclosure', requiredWhen: 'always' },
    {
      documentType: 'lead-based-paint',
      requiredWhen: 'applicable',
    },
  ],
};