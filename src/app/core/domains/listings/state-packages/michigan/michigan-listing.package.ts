import type { StateListingPackage } from '../state-listing-package';
export const michiganListingPackage: StateListingPackage = {
  stateCode: 'MI', stateName: 'Michigan', propertyDetailFields: ['legalDescription'],
  requiredSellerStatementFields: ['leadBasedPaintApplies', 'ownersAssociationApplies', 'generalLeasesExist'],
  disclosureRequirements: [
    { documentType: 'michigan-seller-disclosure', requiredWhen: 'always' },
    { documentType: 'michigan-statutory-packet', requiredWhen: 'always' },
    { documentType: 'lead-based-paint', requiredWhen: 'applicable' },
    { documentType: 'michigan-association-documents', requiredWhen: 'applicable' },
  ],
};
