import type { StateListingPackage } from '../state-listing-package';

/** Wisconsin resale disclosures are attached to the listing, not inferred from short answers. */
export const wisconsinListingPackage: StateListingPackage = {
  stateCode: 'WI',
  stateName: 'Wisconsin',
  requiredSellerStatementFields: [
    'leadBasedPaintApplies',
    'generalLeasesExist',
  ],
  disclosureRequirements: [
    {
      documentType: 'wisconsin-real-estate-condition-report',
      requiredWhen: 'applicable',
    },
    {
      documentType: 'lead-based-paint',
      requiredWhen: 'applicable',
    },
    {
      documentType: 'wisconsin-condominium-disclosure-materials',
      requiredWhen: 'applicable',
    },
  ],
};
