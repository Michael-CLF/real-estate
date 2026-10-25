import type {createPennsylvaniaListingAnswersForm,restorePennsylvaniaListingAnswers} from './pennsylvania/pennsylvania-listing-form';
import type {createNorthDakotaListingAnswersForm,restoreNorthDakotaListingAnswers} from './north-dakota/north-dakota-listing-form';
import type {createNevadaListingAnswersForm,restoreNevadaListingAnswers} from './nevada/nevada-listing-form';
import type {createGeorgiaListingAnswersForm,restoreGeorgiaListingAnswers} from './georgia/georgia-listing-form';
import type {createKentuckyListingAnswersForm,restoreKentuckyListingAnswers} from './kentucky/kentucky-listing-form';
import type {createRhodeIslandListingAnswersForm,restoreRhodeIslandListingAnswers} from './rhode-island/rhode-island-listing-form';
import type {createTennesseeListingAnswersForm,restoreTennesseeListingAnswers} from './tennessee/tennessee-listing-form';
import type {createWestVirginiaListingAnswersForm,restoreWestVirginiaListingAnswers} from './west-virginia/west-virginia-listing-form';
import type {createAlaskaListingAnswersForm,restoreAlaskaListingAnswers} from './alaska/alaska-listing-form';
import type {createConnecticutListingAnswersForm,restoreConnecticutListingAnswers} from './connecticut/connecticut-listing-form';
import type {createVermontListingAnswersForm,restoreVermontListingAnswers} from './vermont/vermont-listing-form';
import type {createVirginiaListingAnswersForm,restoreVirginiaListingAnswers} from './virginia/virginia-listing-form';
import type { createWyomingListingAnswersForm, restoreWyomingListingAnswers } from './wyoming/wyoming-listing-form';
import type { createMaineListingAnswersForm, restoreMaineListingAnswers } from './maine/maine-listing-form';
import type { createMississippiListingAnswersForm, restoreMississippiListingAnswers } from './mississippi/mississippi-listing-form';
import type { createArkansasListingAnswersForm, restoreArkansasListingAnswers } from './arkansas/arkansas-listing-form';
import type { createIllinoisListingAnswersForm, restoreIllinoisListingAnswers } from './illinois/illinois-listing-form';
import type { createSouthDakotaListingAnswersForm, restoreSouthDakotaListingAnswers } from './south-dakota/south-dakota-listing-form';
import type { createNewMexicoListingAnswersForm, restoreNewMexicoListingAnswers } from './new-mexico/new-mexico-listing-form';
import type { createMarylandListingAnswersForm, restoreMarylandListingAnswers } from './maryland/maryland-listing-form';
import type { createMontanaListingAnswersForm, restoreMontanaListingAnswers } from './montana/montana-listing-form';
import type { createIowaListingAnswersForm, restoreIowaListingAnswers } from './iowa/iowa-listing-form';
import type { createWashingtonListingAnswersForm, restoreWashingtonListingAnswers } from './washington/washington-listing-form';
import type { createDelawareListingAnswersForm, restoreDelawareListingAnswers } from './delaware/delaware-listing-form';
import type { createOhioListingAnswersForm, restoreOhioListingAnswers } from './ohio/ohio-listing-form';
import type { createKansasListingAnswersForm, restoreKansasListingAnswers } from './kansas/kansas-listing-form';
import type { createIndianaListingAnswersForm, restoreIndianaListingAnswers } from './indiana/indiana-listing-form';
import type { createAlabamaListingAnswersForm, restoreAlabamaListingAnswers } from './alabama/alabama-listing-form';
import type { createNewHampshireListingAnswersForm, restoreNewHampshireListingAnswers } from './new-hampshire/new-hampshire-listing-form';
import type { createNebraskaListingAnswersForm, restoreNebraskaListingAnswers } from './nebraska/nebraska-listing-form';
import type { createMissouriListingAnswersForm, restoreMissouriListingAnswers } from './missouri/missouri-listing-form';
import type { createOregonListingAnswersForm, restoreOregonListingAnswers } from './oregon/oregon-listing-form';
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
 readonly 'sellerStatements.wyoming': typeof createWyomingListingAnswersForm;
 readonly 'sellerStatements.maine': typeof createMaineListingAnswersForm;
 readonly 'sellerStatements.georgia': typeof createGeorgiaListingAnswersForm;
 readonly 'sellerStatements.kentucky': typeof createKentuckyListingAnswersForm;
 readonly 'sellerStatements.rhodeIsland': typeof createRhodeIslandListingAnswersForm;
 readonly 'sellerStatements.tennessee': typeof createTennesseeListingAnswersForm;
 readonly 'sellerStatements.westVirginia': typeof createWestVirginiaListingAnswersForm;
 readonly 'sellerStatements.alaska': typeof createAlaskaListingAnswersForm;
 readonly 'sellerStatements.connecticut': typeof createConnecticutListingAnswersForm;
 readonly 'sellerStatements.vermont': typeof createVermontListingAnswersForm;
 readonly 'sellerStatements.virginia': typeof createVirginiaListingAnswersForm;
 readonly 'sellerStatements.nevada': typeof createNevadaListingAnswersForm;
 readonly 'sellerStatements.northDakota': typeof createNorthDakotaListingAnswersForm;
 readonly 'sellerStatements.pennsylvania': typeof createPennsylvaniaListingAnswersForm;
 readonly 'sellerStatements.mississippi': typeof createMississippiListingAnswersForm;
 readonly 'sellerStatements.arkansas': typeof createArkansasListingAnswersForm;
 readonly 'sellerStatements.illinois': typeof createIllinoisListingAnswersForm;
 readonly 'sellerStatements.southDakota': typeof createSouthDakotaListingAnswersForm;
 readonly 'sellerStatements.newMexico': typeof createNewMexicoListingAnswersForm;
 readonly 'sellerStatements.maryland': typeof createMarylandListingAnswersForm;
 readonly 'sellerStatements.montana': typeof createMontanaListingAnswersForm;
 readonly 'sellerStatements.iowa': typeof createIowaListingAnswersForm;
 readonly 'sellerStatements.washington': typeof createWashingtonListingAnswersForm;
 readonly 'sellerStatements.delaware': typeof createDelawareListingAnswersForm;
 readonly 'sellerStatements.ohio': typeof createOhioListingAnswersForm;
 readonly 'sellerStatements.kansas': typeof createKansasListingAnswersForm;
 readonly 'sellerStatements.indiana': typeof createIndianaListingAnswersForm;
 readonly 'sellerStatements.alabama': typeof createAlabamaListingAnswersForm;
 readonly 'sellerStatements.newHampshire': typeof createNewHampshireListingAnswersForm;
 readonly 'sellerStatements.nebraska': typeof createNebraskaListingAnswersForm;
 readonly 'sellerStatements.missouri': typeof createMissouriListingAnswersForm;
 readonly 'sellerStatements.oregon': typeof createOregonListingAnswersForm;
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
 readonly 'sellerStatements.wyoming': typeof restoreWyomingListingAnswers;
 readonly 'sellerStatements.maine': typeof restoreMaineListingAnswers;
 readonly 'sellerStatements.georgia': typeof restoreGeorgiaListingAnswers;
 readonly 'sellerStatements.kentucky': typeof restoreKentuckyListingAnswers;
 readonly 'sellerStatements.rhodeIsland': typeof restoreRhodeIslandListingAnswers;
 readonly 'sellerStatements.tennessee': typeof restoreTennesseeListingAnswers;
 readonly 'sellerStatements.westVirginia': typeof restoreWestVirginiaListingAnswers;
 readonly 'sellerStatements.alaska': typeof restoreAlaskaListingAnswers;
 readonly 'sellerStatements.connecticut': typeof restoreConnecticutListingAnswers;
 readonly 'sellerStatements.vermont': typeof restoreVermontListingAnswers;
 readonly 'sellerStatements.virginia': typeof restoreVirginiaListingAnswers;
 readonly 'sellerStatements.nevada': typeof restoreNevadaListingAnswers;
 readonly 'sellerStatements.northDakota': typeof restoreNorthDakotaListingAnswers;
 readonly 'sellerStatements.pennsylvania': typeof restorePennsylvaniaListingAnswers;
 readonly 'sellerStatements.mississippi': typeof restoreMississippiListingAnswers;
 readonly 'sellerStatements.arkansas': typeof restoreArkansasListingAnswers;
 readonly 'sellerStatements.illinois': typeof restoreIllinoisListingAnswers;
 readonly 'sellerStatements.southDakota': typeof restoreSouthDakotaListingAnswers;
 readonly 'sellerStatements.newMexico': typeof restoreNewMexicoListingAnswers;
 readonly 'sellerStatements.maryland': typeof restoreMarylandListingAnswers;
 readonly 'sellerStatements.montana': typeof restoreMontanaListingAnswers;
 readonly 'sellerStatements.iowa': typeof restoreIowaListingAnswers;
 readonly 'sellerStatements.washington': typeof restoreWashingtonListingAnswers;
 readonly 'sellerStatements.delaware': typeof restoreDelawareListingAnswers;
 readonly 'sellerStatements.ohio': typeof restoreOhioListingAnswers;
 readonly 'sellerStatements.kansas': typeof restoreKansasListingAnswers;
 readonly 'sellerStatements.indiana': typeof restoreIndianaListingAnswers;
 readonly 'sellerStatements.alabama': typeof restoreAlabamaListingAnswers;
 readonly 'sellerStatements.newHampshire': typeof restoreNewHampshireListingAnswers;
 readonly 'sellerStatements.nebraska': typeof restoreNebraskaListingAnswers;
 readonly 'sellerStatements.missouri': typeof restoreMissouriListingAnswers;
 readonly 'sellerStatements.oregon': typeof restoreOregonListingAnswers;
  readonly coloradoPropertyFacts: typeof restoreColoradoPropertyFacts;
  readonly coloradoAssumableLoan: typeof restoreColoradoAssumableLoan;
  readonly 'sellerStatements.california': typeof restoreCaliforniaListingFacts;
  readonly 'sellerStatements.southCarolina': typeof restoreSouthCarolinaListingAnswers;
}

export interface StateListingFormSerializers {
  readonly coloradoAssumableLoan: typeof serializeColoradoAssumableLoan;
}

export type StateListingStatementDraftExtensions = Partial<Pick<ListingStatementMappingAnswers,
  'california' | 'oregon' | 'missouri' | 'nebraska' | 'newHampshire' | 'alabama' | 'indiana' | 'kansas' | 'ohio' | 'delaware' | 'washington' | 'iowa' | 'montana' | 'maryland' | 'newMexico' | 'southDakota' | 'wyoming' | 'kentucky' | 'rhodeIsland' | 'tennessee' | 'alaska' | 'connecticut' | 'vermont' | 'virginia' | 'westVirginia' | 'georgia' | 'nevada' | 'northDakota' | 'pennsylvania' | 'maine' | 'mississippi' | 'arkansas' | 'illinois' | 'southCarolina'>>;

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
  readonly options?: readonly {readonly value: boolean; readonly label: string}[];
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
