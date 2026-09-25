import type { StateListingPackage } from '../state-listing-package';

export const utahListingPackage: StateListingPackage = {
  stateCode: 'UT',
  stateName: 'Utah',
  requiredSellerStatementFields: [
    'leadBasedPaintApplies',
    'ownersAssociationApplies',
    'generalLeasesExist',
    'utahMethamphetamineContamination',
  ],
  disclosureRequirements: [
    { documentType: 'utah-seller-property-condition', requiredWhen: 'applicable' },
    { documentType: 'lead-based-paint', requiredWhen: 'applicable' },
    { documentType: 'utah-hoa-governing-documents', requiredWhen: 'applicable' },
    { documentType: 'utah-methamphetamine-contamination', requiredWhen: 'applicable' },
  ],
};
