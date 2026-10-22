import type { Transaction, DocumentReference } from 'firebase-admin/firestore';
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


export interface AgreementSummaryRow {
  readonly label: string;
  readonly value: string;
}

export interface StateContractPackage<
  TTerms extends StateContractTerms =
    OfferTermsDocument,
> {
  readonly federalLeadPolicyIntegrated?: true;
  readonly hoaPolicyIntegrated?: true;
  stateCode: string;

  listingDisclosurePolicy?: StateListingOfferPolicy<TTerms>;

  offerCreationEnabled: boolean;

  /*
   * Empty for a single-contract state such as North
   * Carolina. Multi-contract states list every accepted
   * immutable contract identifier here.
   */
  contractTypes?:
    readonly string[];

  contractTypeRequired?: boolean;

  supportedPropertyTypes?: readonly string[];
  maximumDwellingUnits?: number;
  requireOwnershipFacts?: boolean;

  defaultTimeZone: string;

  agreementTemplate:
    StateAgreementTemplate;
  agreementTemplates?: readonly StateAgreementTemplate[];
  getAgreementTemplate?(terms: TTerms): StateAgreementTemplate;

  createInitialOfferTerms(
    input: CreateInitialOfferTermsInput
  ): TTerms;

  /** Required for every state; maps this exact immutable version to its summary. */
  getAgreementSummary(input: GenerateStateAgreementInput<TTerms>): readonly AgreementSummaryRow[];

  generateAgreement(
    input: GenerateStateAgreementInput<TTerms>
  ): Promise<GeneratedStateAgreement>;

  requiredListingDisclosures?(input: ValidateStateSubmissionInput<TTerms>): readonly string[];

  assertListingContractCompatible?(listingData: Record<string,unknown>, version: StateOfferVersionDocument<TTerms>): void;

  /** Prepare only an authorized mutable draft before it is frozen; never rewrite signed versions. */
  prepareSubmissionTerms?(input:ValidateStateSubmissionInput<TTerms> & {readonly listingData?:Record<string,unknown>}):TTerms;

  validateSubmission(
    input: ValidateStateSubmissionInput<TTerms>
  ): void;

  /** State-specific prerequisites before any party signs an immutable version. */
  validateBeforeSigning?(input: ValidateStateSubmissionInput<TTerms> & { readonly signerRole?: string }): void;

  /** Statutory effectiveness delay after timely acceptance; absent means immediate. */
  agreementEffectiveNotBefore?(input: ValidateStateSubmissionInput<TTerms>): Date | undefined;

  sanitizeDraftTerms(
    input: SanitizeDraftTermsInput<TTerms>
  ): TTerms;

  createContractMilestones(
    input: CreateStateContractMilestonesInput<TTerms>
  ): StateContractMilestones;
}
export interface StateListingOfferPolicy<TTerms extends StateContractTerms = StateContractTerms> {
  assertReady?(transaction: Transaction, reference: DocumentReference, listing: Record<string, unknown>): Promise<void>;
  assertCounterofferReady?(transaction: Transaction, reference: DocumentReference, listing: Record<string, unknown>): Promise<void>;
  readonly counterofferMissingListingMessage?: string;
  readVersions?(transaction: Transaction, reference: DocumentReference, listing: Record<string, unknown>): Promise<{ documentVersions: Record<string, string>; requiredDisclosureTypes?: string[] }>;
  initialListingData?(transaction: Transaction, reference: DocumentReference, listing: Record<string, unknown>): Promise<Record<string, unknown>>;
  reviewedVersions?(input: ValidateStateSubmissionInput<TTerms>): Readonly<Record<string, string>> | undefined;
  readonly supportsUnsignedRevision?: boolean;
}
