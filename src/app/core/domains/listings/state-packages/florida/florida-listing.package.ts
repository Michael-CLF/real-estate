import type { StateListingPackage } from '../state-listing-package';

/** Florida resale disclosures are attached to the listing, not inferred from short answers. */
export const floridaListingPackage: StateListingPackage = {
  stateCode: 'FL',
  stateName: 'Florida',
  requiredSellerStatementFields: [
    'leadBasedPaintApplies',
    'ownersAssociationApplies',
    'generalLeasesExist',
  ],
  disclosureRequirements: [
    {
      documentType: 'florida-flood-disclosure',
      requiredWhen: 'always',
    },
    {
      documentType: 'florida-seller-property-disclosure',
      requiredWhen: 'applicable',
    },
    {
      documentType: 'lead-based-paint',
      requiredWhen: 'applicable',
    },
    {
      documentType: 'florida-hoa-disclosure-summary',
      requiredWhen: 'applicable',
    },
  ],
};