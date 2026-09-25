import type {
  StateListingPackage,
} from '../state-listing-package';

export const northCarolinaListingPackage:
  StateListingPackage = {
    stateCode: 'NC',
    stateName: 'North Carolina',

    requiredSellerStatementFields: [
      'ownershipStatus',
      'leadBasedPaintApplies',
      'ownersAssociationApplies',
      'fuelTankPresent',
      'generalLeasesExist',
    ],

    disclosureRequirements: [
      {
        documentType:
          'residential-property-owners-association',
        requiredWhen: 'applicable',
      },
      {
        documentType:
          'mineral-oil-gas-rights',
        requiredWhen: 'applicable',
      },
      {
        documentType:
          'lead-based-paint',
        requiredWhen: 'applicable',
      },
    ],
  };