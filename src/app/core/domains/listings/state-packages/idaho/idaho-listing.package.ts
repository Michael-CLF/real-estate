import type { StateListingPackage } from '../state-listing-package';
export const idahoListingPackage: StateListingPackage = {
  stateCode: 'ID', stateName: 'Idaho', propertyDetailFields: ['legalDescription'],
  requiredSellerStatementFields: ['leadBasedPaintApplies', 'ownersAssociationApplies', 'generalLeasesExist'],
  disclosureRequirements: [
    { documentType: 'idaho-seller-disclosure', requiredWhen: 'always' },
    { documentType: 'idaho-statutory-packet', requiredWhen: 'always' },
    { documentType: 'lead-based-paint', requiredWhen: 'applicable' },
    { documentType: 'idaho-association-documents', requiredWhen: 'applicable' },
  ],
};
