export type StateListingField =
  | 'ownershipStatus'
  | 'leadBasedPaintApplies'
  | 'ownersAssociationApplies'
  | 'fuelTankPresent'
  | 'generalLeasesExist'
  | 'texasLeaseCategories';

export interface StateListingDisclosureRequirement {
  readonly documentType: string;
  readonly requiredWhen: 'always' | 'applicable';
}

export interface StateListingPackage {
  readonly stateCode: string;
  readonly stateName: string;
  readonly requiredSellerStatementFields: readonly StateListingField[];
  readonly disclosureRequirements:
    readonly StateListingDisclosureRequirement[];
}

export function requiresStateListingField(
  statePackage: StateListingPackage,
  field: StateListingField,
): boolean {
  return statePackage.requiredSellerStatementFields.includes(field);
}