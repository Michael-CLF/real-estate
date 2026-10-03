import type { StateListingPackage } from '../state-listing-package';
export const californiaListingPackage: StateListingPackage = {
  stateCode: 'CA', stateName: 'California',
  requiredSellerStatementFields: ['leadBasedPaintApplies', 'ownersAssociationApplies', 'generalLeasesExist'],
  disclosureRequirements: [
    { documentType: 'california-transfer-disclosure', requiredWhen: 'applicable' },
    { documentType: 'california-natural-hazard-disclosure', requiredWhen: 'applicable' },
    { documentType: 'lead-based-paint', requiredWhen: 'applicable' },
  ],
};