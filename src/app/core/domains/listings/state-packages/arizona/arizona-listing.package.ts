import type { StateListingPackage } from '../state-listing-package';
export const arizonaListingPackage: StateListingPackage = {
  stateCode: 'AZ', stateName: 'Arizona', propertyDetailFields: ['legalDescription'],
  requiredSellerStatementFields: ['leadBasedPaintApplies', 'ownersAssociationApplies', 'generalLeasesExist'],
  disclosureRequirements: [
    { documentType: 'arizona-seller-disclosure', requiredWhen: 'always' },
    { documentType: 'arizona-statutory-packet', requiredWhen: 'always' },
    { documentType: 'lead-based-paint', requiredWhen: 'applicable' },
    { documentType: 'arizona-association-documents', requiredWhen: 'applicable' },
  ],
};
