import type { COLORADO_LISTING_EDIT_FIELDS } from './colorado/colorado-listing-edit-fields';
import type { restoreColoradoPropertyFacts } from './colorado/colorado-listing-facts';
import type { ListingSellerStatements } from '../models/listing.model';
import type { ListingStatementMappingAnswers } from './listing-statement-mapping';
import type { restoreColoradoAssumableLoan, serializeColoradoAssumableLoan } from './colorado/colorado-listing-form';
import type { restoreCaliforniaListingFacts } from './california/california-listing-facts.model';
import type { restoreSouthCarolinaListingAnswers } from './south-carolina/south-carolina-listing-form';
import type { configureColoradoListingEditValidators, configureColoradoListingFactValidators, configureColoradoListingLoanValidators } from './colorado/colorado-listing-validation';
import type { createSouthCarolinaListingAnswersForm } from './south-carolina/south-carolina-listing-form';
import type { createCaliforniaListingFactsForm } from './california/california-listing-form';
import type { createColoradoPropertyFactsForm, createColoradoAssumableLoanForm } from './colorado/colorado-listing-form';

/** Typed factories for existing persisted form groups; no new storage paths. */
export interface StateListingFormFactories {
  readonly 'sellerStatements.southCarolina': typeof createSouthCarolinaListingAnswersForm;
  readonly 'sellerStatements.california': typeof createCaliforniaListingFactsForm;
  readonly 'coloradoPropertyFacts': typeof createColoradoPropertyFactsForm;
  readonly 'coloradoAssumableLoan': typeof createColoradoAssumableLoanForm;
}

export type StateListingField =
  | 'ownershipStatus'
  | 'leadBasedPaintApplies'
  | 'ownersAssociationApplies'
  | 'fuelTankPresent'
  | 'generalLeasesExist'
  | 'texasLeaseCategories'
  | 'utahMethamphetamineContamination';

export interface StateListingDisclosureRequirement {
  readonly documentType: string;
  readonly requiredWhen: 'always' | 'applicable';
}

/** Inputs used by existing document-card visibility rules, including separately saved SC answers. */
export interface StateListingDisclosureVisibilityContext {
  readonly stateCode: string;
  readonly ownersAssociationApplies: boolean | null | undefined;
  readonly southCarolinaAnswers: {
    readonly beachfrontApplies: boolean | null;
    readonly futureVacationBookingsExist: boolean | null;
  };
}

export interface StateListingFormValidators {
  readonly coloradoPropertyFactsEdit: typeof configureColoradoListingEditValidators;
  readonly coloradoPropertyFacts: typeof configureColoradoListingFactValidators;
  readonly coloradoAssumableLoan: typeof configureColoradoListingLoanValidators;
}

/** Restore existing persisted answers through their owning package. */
export interface StateListingFormRestorers {
  readonly coloradoPropertyFacts: typeof restoreColoradoPropertyFacts;
  readonly coloradoAssumableLoan: typeof restoreColoradoAssumableLoan;
  readonly 'sellerStatements.california': typeof restoreCaliforniaListingFacts;
  readonly 'sellerStatements.southCarolina': typeof restoreSouthCarolinaListingAnswers;
}

export interface StateListingFormSerializers {
  readonly coloradoAssumableLoan: typeof serializeColoradoAssumableLoan;
}

export type StateListingStatementDraftExtensions = Partial<Pick<ListingStatementMappingAnswers,
  'california' | 'southCarolina'>>;

export type StateListingPropertyField = 'legalDescription';

export interface StateListingEditFields {
  readonly coloradoPropertyFacts: typeof COLORADO_LISTING_EDIT_FIELDS;
}

export interface StateListingPackage {
  readonly editFields?: Partial<StateListingEditFields>;
  readonly propertyDetailFields?: readonly StateListingPropertyField[];
  readonly restoreSellerStatements?: (saved: ListingSellerStatements | null | undefined) => StateListingStatementDraftExtensions;
  readonly mapSellerStatements?: (statements: ListingStatementMappingAnswers) => Partial<ListingSellerStatements>;
  readonly formSerializers?: Partial<StateListingFormSerializers>;
  readonly formRestorers?: Partial<StateListingFormRestorers>;
  readonly formValidators?: Partial<StateListingFormValidators>;
  readonly disclosureCardVisibility?: Readonly<Record<string,
    (context: StateListingDisclosureVisibilityContext) => boolean>>;
  readonly formFactories?: Partial<StateListingFormFactories>;
  readonly questionGroups?: readonly StateListingQuestionGroup[];
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

export interface StateListingBooleanQuestion {
  readonly id: string;
  readonly fieldPath: string;
  readonly label: string;
  readonly description: string;
  readonly required: boolean;
  readonly requiredMessage: string;
}

export interface StateListingQuestionGroup {
  readonly requiredMessage?: string;
  readonly id: string;
  readonly title: string;
  readonly questions: readonly StateListingBooleanQuestion[];
}
