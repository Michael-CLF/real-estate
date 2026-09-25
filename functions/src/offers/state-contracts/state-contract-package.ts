import type {
  OfferDocument,
  OfferPropertySnapshotDocument,
  OfferTermsDocument,
  OfferVersionDocument,
  OfferVersionPartySnapshotDocument,
} from '../offer-types';


export interface StateAgreementTemplate {
  stateCode: string;

  templateUid: string;
  templateName: string;
  templateVersion: string;
}


/*
 * The minimum shape shared by every state's contract terms.
 *
 * State packages may add any fields required by their forms, but the
 * shared offer infrastructure may rely only on this small envelope.
 */
export interface StateContractTerms {
  readonly stateCode: string;

  readonly property:
    OfferPropertySnapshotDocument;

  readonly delivery: {
    readonly expiresAt: string;
    readonly timeZone: string;

    readonly electronicDeliveryAuthorized:
      boolean |
      null;
  };
}


/*
 * Replaces the North-Carolina-specific terms and state-code fields on
 * the existing version document while retaining the shared version
 * metadata, party snapshots, status and audit fields.
 */
export type StateOfferVersionDocument<
  TTerms extends StateContractTerms =
    OfferTermsDocument,
> =
  Omit<
    OfferVersionDocument,
    'stateCode' |
    'terms'
  > & {
    stateCode:
      TTerms['stateCode'];

    terms:
      TTerms;
  };


export interface CreateInitialOfferTermsInput {
  /*
   * States with multiple agreement forms receive the
   * contract selected before the draft is created.
   * Single-contract states receive undefined.
   */
  contractType?: string;

  property:
    OfferPropertySnapshotDocument;

  buyer:
    OfferVersionPartySnapshotDocument;

  seller:
    OfferVersionPartySnapshotDocument;

  listingData:
    Record<string, unknown>;
}


export interface GenerateStateAgreementInput<
  TTerms extends StateContractTerms =
    OfferTermsDocument,
> {
  offer:
    OfferDocument;

  version:
    StateOfferVersionDocument<TTerms>;

  documentTitle: string;

  generatedAt: Date;

  documentStatus:
    'prototype' |
    'approved';
}


export interface GeneratedStateAgreement {
  buffer: Buffer;

  fileName: string;
  pageCount: number;
}


export interface ValidateStateSubmissionInput<
  TTerms extends StateContractTerms =
    OfferTermsDocument,
> {
  offer:
    OfferDocument;

  version:
    StateOfferVersionDocument<TTerms>;
}


export interface SanitizeDraftTermsInput<
  TTerms extends StateContractTerms =
    OfferTermsDocument,
> {
  requestedTerms: unknown;

  currentTerms:
    TTerms;

  initiatedBy:
    'buyer' |
    'seller';
}


export interface CreateStateContractMilestonesInput<
  TTerms extends StateContractTerms =
    OfferTermsDocument,
> {
  version:
    StateOfferVersionDocument<TTerms>;

  effectiveAt: Date;
}


export interface StateContractMilestones {
  transactionPhase: string;

  timeZone: string;

  anticipatedClosingDate: string;

  dueDiligenceEndsAt?: string;
}


export interface StateContractPackage<
  TTerms extends StateContractTerms =
    OfferTermsDocument,
> {
  stateCode: string;

  offerCreationEnabled: boolean;

  /*
   * Empty for a single-contract state such as North
   * Carolina. Multi-contract states list every accepted
   * immutable contract identifier here.
   */
  contractTypes?:
    readonly string[];

  contractTypeRequired?: boolean;

  defaultTimeZone: string;

  agreementTemplate:
    StateAgreementTemplate;

  createInitialOfferTerms(
    input: CreateInitialOfferTermsInput
  ): TTerms;

  generateAgreement(
    input: GenerateStateAgreementInput<TTerms>
  ): Promise<GeneratedStateAgreement>;

  requiredListingDisclosures?(input: ValidateStateSubmissionInput<TTerms>): readonly string[];

  validateSubmission(
    input: ValidateStateSubmissionInput<TTerms>
  ): void;

  sanitizeDraftTerms(
    input: SanitizeDraftTermsInput<TTerms>
  ): TTerms;

  createContractMilestones(
    input: CreateStateContractMilestonesInput<TTerms>
  ): StateContractMilestones;
}
