import {
  DisclosureDocumentType
} from './state-disclosure-requirement.model';

export interface ListingDisclosureDocument {
  readonly id: string;
  readonly listingUid: string;
  readonly sellerUid: string;

  readonly documentType:
    DisclosureDocumentType;

  readonly stateAbbreviation: string;

  readonly originalFileName: string;
  readonly storagePath: string;

  readonly contentType:
    'application/pdf';

  readonly sizeBytes: number;

  readonly version: number;
  readonly versionId: string;

  readonly uploadedAt: Date;
  readonly uploadedByUid: string;
}

export interface ListingDisclosureSummary {
  readonly documentType:
    DisclosureDocumentType;

  readonly currentDocument:
    ListingDisclosureDocument;

  readonly updatedAt: Date;
}