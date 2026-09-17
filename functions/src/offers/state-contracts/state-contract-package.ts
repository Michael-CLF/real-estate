import type {
  OfferPropertySnapshotDocument,
  OfferTermsDocument,
  OfferVersionPartySnapshotDocument,
} from '../offer-types';


export interface StateAgreementTemplate {
  stateCode: string;

  templateUid: string;
  templateName: string;
  templateVersion: string;
}


export interface CreateInitialOfferTermsInput {
  property:
    OfferPropertySnapshotDocument;

  buyer:
    OfferVersionPartySnapshotDocument;

  seller:
    OfferVersionPartySnapshotDocument;

  listingData:
    Record<string, unknown>;
}


export interface StateContractPackage {
  stateCode: string;

  offerCreationEnabled: boolean;

  defaultTimeZone: string;

  agreementTemplate:
    StateAgreementTemplate;

  createInitialOfferTerms(
    input: CreateInitialOfferTermsInput
  ): OfferTermsDocument;
}