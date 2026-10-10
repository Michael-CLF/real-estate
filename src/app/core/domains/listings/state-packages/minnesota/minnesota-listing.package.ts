import type { StateListingPackage } from '../state-listing-package';
export const minnesotaListingPackage: StateListingPackage = {
  stateCode: 'MN', stateName: 'Minnesota', propertyDetailFields: ['legalDescription'],
  requiredSellerStatementFields: ['leadBasedPaintApplies', 'ownersAssociationApplies', 'generalLeasesExist'],
  disclosureRequirements: [
    { documentType: 'minnesota-seller-disclosure', requiredWhen: 'always' },
    { documentType: 'minnesota-statutory-packet', requiredWhen: 'always' },
    { documentType: 'lead-based-paint', requiredWhen: 'applicable' },
    { documentType: 'minnesota-association-documents', requiredWhen: 'applicable' },
  ],
};
