import { Validators, type AbstractControl } from '@angular/forms';
import { requiresStateListingField, type StateListingField, type StateListingPackage } from './state-listing-package';

interface ListingStatementControls {
  readonly ownershipStatus: AbstractControl;
  readonly leadBasedPaintApplies: AbstractControl;
  readonly methamphetamineContaminationKnown: AbstractControl;
  readonly ownersAssociationApplies: AbstractControl;
  readonly fuelTankPresent: AbstractControl;
}

const STATEMENTS: readonly (readonly [keyof ListingStatementControls, StateListingField])[] = [
  ['ownershipStatus', 'ownershipStatus'],
  ['leadBasedPaintApplies', 'leadBasedPaintApplies'],
  ['methamphetamineContaminationKnown', 'utahMethamphetamineContamination'],
  ['ownersAssociationApplies', 'ownersAssociationApplies'],
  ['fuelTankPresent', 'fuelTankPresent'],
];

/** Reconfigure required controls without changing stored answers, touch state, or emitting updates. */
export function configureListingStatementValidators(
  controls: ListingStatementControls,
  statePackage: StateListingPackage,
): void {
  for (const [controlName, field] of STATEMENTS) {
    const control = controls[controlName];
    if (requiresStateListingField(statePackage, field)) control.setValidators([Validators.required]);
    else control.clearValidators();
    control.updateValueAndValidity({ emitEvent: false });
  }
}

export interface ListingStatementSaveAnswers {
  ownershipStatus: string;
  methamphetamineContaminationKnown: boolean | null;
  leadBasedPaintApplies: boolean | null;
  ownersAssociationApplies: boolean | null;
  fuelTankPresent: boolean | null;
  fuelTankOwnership: string;
  residentialLeasesExist: boolean | null;
  fixtureLeasesExist: boolean | null;
  naturalResourceLeasesExist: boolean | null;
  leasesExist: boolean | null;
}

/** Preserve the existing save-time checks, their order, and state-specific requirements. */
export function validateListingStatementAnswers(
  statements: ListingStatementSaveAnswers,
  statePackage: StateListingPackage,
): void {
  if (
    requiresStateListingField(
      statePackage,
      'ownershipStatus',
    ) &&
    !statements.ownershipStatus
  ) {
    throw new Error(
      'Please select how long the seller has owned the property.',
    );
  }
  if (
    requiresStateListingField(
      statePackage,
      'utahMethamphetamineContamination',
    ) &&
    typeof statements.methamphetamineContaminationKnown !== 'boolean'
  ) {
    throw new Error(
      'Please answer the Utah current-contamination statement.',
    );
  }
  if (
    requiresStateListingField(
      statePackage,
      'leadBasedPaintApplies',
    ) &&
    statements.leadBasedPaintApplies === null
  ) {
    throw new Error(
      'Please complete the lead-based-paint statement.',
    );
  }
  if (
    requiresStateListingField(
      statePackage,
      'ownersAssociationApplies',
    ) &&
    statements.ownersAssociationApplies ===
    null
  ) {
    throw new Error(
      'Please specify whether an owners association applies.',
    );
  }
  if (
    requiresStateListingField(
      statePackage,
      'fuelTankPresent',
    ) &&
    statements.fuelTankPresent === null
  ) {
    throw new Error(
      'Please specify whether a fuel tank is present.',
    );
  }
  if (
    statements.fuelTankPresent === true &&
    !statements.fuelTankOwnership
  ) {
    throw new Error(
      'Please specify whether the fuel tank is owned or leased.',
    );
  }
  const isTexasListing =
    requiresStateListingField(
      statePackage,
      'texasLeaseCategories',
    );
  if (
    isTexasListing &&
    (
      statements.residentialLeasesExist ===
      null ||
      statements.fixtureLeasesExist ===
      null ||
      statements.naturalResourceLeasesExist ===
      null
    )
  ) {
    throw new Error(
      'Please complete all three Texas lease statements.',
    );
  }
  if (
    requiresStateListingField(
      statePackage,
      'generalLeasesExist',
    ) &&
    statements.leasesExist === null
  ) {
    throw new Error(
      'Please specify whether any leases exist.',
    );
  }
}
