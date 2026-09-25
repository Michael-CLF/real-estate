import type {
  StateListingPackage,
} from '../state-listing-package';

export const texasListingPackage:
  StateListingPackage = {
    stateCode: 'TX',
    stateName: 'Texas',

    requiredSellerStatementFields: [
      'ownershipStatus',
      'leadBasedPaintApplies',
      'ownersAssociationApplies',
      'fuelTankPresent',
      'texasLeaseCategories',
    ],

    disclosureRequirements: [
      {
        documentType:
          'texas-seller-disclosure-notice',
        requiredWhen: 'applicable',
      },
      {
        documentType:
          'texas-residential-leases',
        requiredWhen: 'applicable',
      },
      {
        documentType:
          'texas-fixture-leases',
        requiredWhen: 'applicable',
      },
      {
        documentType:
          'texas-natural-resource-leases',
        requiredWhen: 'applicable',
      },
      {
        documentType:
          'lead-based-paint',
        requiredWhen: 'applicable',
      },
    ],
  };