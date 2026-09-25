import type {
  StateListingPackage,
} from './state-listing-package';

export const utahListingPackage: StateListingPackage = {
  stateCode: 'UT',

  requiredSellerStatementFields: [
    'leadBasedPaintApplies',
    'ownersAssociationApplies',
    'generalLeasesExist',
    'utahMethamphetamineContamination',
  ],
};