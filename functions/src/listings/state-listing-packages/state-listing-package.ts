export type StateListingField =
  | 'ownershipStatus'
  | 'leadBasedPaintApplies'
  | 'ownersAssociationApplies'
  | 'fuelTankPresent'
  | 'generalLeasesExist'
  | 'texasLeaseCategories'
  | 'utahMethamphetamineContamination';

export interface StateListingPackage {
  readonly stateCode: string;

  validateAdditionalSellerStatements?(listingUid: string, statements: Record<string, unknown>): void;

  readonly requiredSellerStatementFields:
    readonly StateListingField[];
}