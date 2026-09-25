export type StateListingField =
  | 'ownershipStatus'
  | 'leadBasedPaintApplies'
  | 'ownersAssociationApplies'
  | 'fuelTankPresent'
  | 'generalLeasesExist'
  | 'texasLeaseCategories';

export interface StateListingPackage {
  readonly stateCode: string;

  readonly requiredSellerStatementFields:
    readonly StateListingField[];
}