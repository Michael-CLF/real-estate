import type { StateListingPackage } from '../state-listing-package';

/** Uploaded disclosures required before NavStreet will accept a Colorado offer. */
export const coloradoListingPackage: StateListingPackage = {
  stateCode: 'CO',
  stateName: 'Colorado',
  requiredSellerStatementFields: [
    'leadBasedPaintApplies',
    'ownersAssociationApplies',
    'generalLeasesExist',
  ],
  disclosureRequirements: [
    {
      documentType: 'colorado-property-disclosure',
      requiredWhen: 'always',
    },
    {
      documentType: 'colorado-radon-brochure',
      requiredWhen: 'always',
    },
    {
      documentType: 'lead-based-paint',
      requiredWhen: 'applicable',
    },
  ],
};