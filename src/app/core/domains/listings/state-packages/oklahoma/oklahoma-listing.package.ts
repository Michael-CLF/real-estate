import type {
  StateListingPackage,
} from '../state-listing-package';

export const oklahomaListingPackage:
  StateListingPackage = {
    stateCode: 'OK',
    stateName: 'Oklahoma',

    requiredSellerStatementFields: [
      'leadBasedPaintApplies',
      'ownersAssociationApplies',
    ],

    disclosureRequirements: [
      {
        documentType:
          'oklahoma-property-condition-disclosure',
        requiredWhen: 'applicable',
      },
      {
        documentType:
          'oklahoma-property-condition-disclaimer',
        requiredWhen: 'applicable',
      },
      {
        documentType:
          'oklahoma-property-condition-exemption',
        requiredWhen: 'applicable',
      },
      {
        documentType:
          'lead-based-paint',
        requiredWhen: 'applicable',
      },
    ],
  };