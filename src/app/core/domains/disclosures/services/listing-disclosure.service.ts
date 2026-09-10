import {
  Injectable
} from '@angular/core';

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp
} from 'firebase/firestore';

import {
  deleteObject,
  getBlob,
  ref,
  uploadBytes
} from 'firebase/storage';

import {
  firestore,
  storage
} from '../../../infrastructure/firebase/firebase';

import {
  ListingDisclosureDocument,
  ListingDisclosureSummary
} from '../models/listing-disclosure-document.model';

import {
  DisclosureDocumentType
} from '../state-disclosure-requirement.model';

const MAXIMUM_DISCLOSURE_SIZE_BYTES =
  15 * 1024 * 1024;

@Injectable({
  providedIn: 'root'
})
export class ListingDisclosureService {

  async getListingDisclosures(
    listingUid: string
  ): Promise<ListingDisclosureSummary[]> {
    if (!listingUid.trim()) {
      return [];
    }

    const disclosuresReference =
      collection(
        firestore,
        'listings',
        listingUid,
        'disclosures'
      );

    const snapshot =
      await getDocs(disclosuresReference);

    return snapshot.docs
      .map(documentSnapshot =>
        this.mapDisclosureSummary(
          documentSnapshot.data()
        )
      )
      .filter(
        (
          disclosure
        ): disclosure is ListingDisclosureSummary =>
          disclosure !== null
      )
      .sort(
        (
          firstDisclosure,
          secondDisclosure
        ) =>
          firstDisclosure
            .currentDocument
            .documentType
            .localeCompare(
              secondDisclosure
                .currentDocument
                .documentType
            )
      );
  }

  async getCurrentDisclosure(
    listingUid: string,
    documentType: DisclosureDocumentType
  ): Promise<ListingDisclosureDocument | null> {
    const summaryReference =
      doc(
        firestore,
        'listings',
        listingUid,
        'disclosures',
        documentType
      );

    const snapshot =
      await getDoc(summaryReference);

    if (!snapshot.exists()) {
      return null;
    }

    const summary =
      this.mapDisclosureSummary(
        snapshot.data()
      );

    return summary?.currentDocument ?? null;
  }

  async getDisclosureVersion(
    listingUid: string,
    documentType: DisclosureDocumentType,
    versionId: string
  ): Promise<ListingDisclosureDocument | null> {
    if (
      !listingUid.trim() ||
      !versionId.trim()
    ) {
      return null;
    }

    const versionReference =
      doc(
        firestore,
        'listings',
        listingUid,
        'disclosures',
        documentType,
        'versions',
        versionId
      );

    const snapshot =
      await getDoc(versionReference);

    if (!snapshot.exists()) {
      return null;
    }

    return this.mapDisclosureDocument(
      snapshot.data()
    );
  }

  async uploadDisclosure(
    sellerUid: string,
    listingUid: string,
    stateAbbreviation: string,
    documentType: DisclosureDocumentType,
    file: File
  ): Promise<ListingDisclosureDocument> {
    this.validateUploadArguments(
      sellerUid,
      listingUid,
      stateAbbreviation,
      file
    );

    await this.validatePdfFile(file);

    const currentDocument =
      await this.getCurrentDisclosure(
        listingUid,
        documentType
      );

    const version =
      (currentDocument?.version ?? 0) + 1;

    const versionId =
      this.createVersionId();

    const storagePath =
      this.buildDisclosureStoragePath(
        sellerUid,
        listingUid,
        documentType,
        versionId
      );

    const storageReference =
      ref(
        storage,
        storagePath
      );

    const uploadedAt =
      new Date();

    const disclosureDocument:
      ListingDisclosureDocument = {
      id: versionId,
      listingUid,
      sellerUid,
      documentType,

      stateAbbreviation:
        stateAbbreviation
          .trim()
          .toUpperCase(),

      originalFileName:
        file.name,

      storagePath,

      contentType:
        'application/pdf',

      sizeBytes:
        file.size,

      version,
      versionId,

      uploadedAt,
      uploadedByUid:
        sellerUid
    };

    const versionReference =
      doc(
        firestore,
        'listings',
        listingUid,
        'disclosures',
        documentType,
        'versions',
        versionId
      );

    const summaryReference =
      doc(
        firestore,
        'listings',
        listingUid,
        'disclosures',
        documentType
      );

    try {
      await uploadBytes(
        storageReference,
        file,
        {
          contentType:
            'application/pdf',

          customMetadata: {
            sellerUid,
            listingUid,
            stateAbbreviation:
              disclosureDocument
                .stateAbbreviation,
            documentType,
            version:
              String(version),
            versionId,
            originalFileName:
              file.name
          }
        }
      );

      const firestoreDocument =
        this.toFirestoreDocument(
          disclosureDocument
        );

      await setDoc(
        versionReference,
        firestoreDocument
      );

      await setDoc(
        summaryReference,
        {
          documentType,

          currentDocument:
            firestoreDocument,

          updatedAt:
            Timestamp.fromDate(
              uploadedAt
            )
        }
      );

      return disclosureDocument;
    } catch (error) {
      await Promise.allSettled([
        deleteObject(
          storageReference
        ),
        deleteDoc(
          versionReference
        )
      ]);

      throw error;
    }
  }

  async downloadDisclosure(
    disclosure:
      ListingDisclosureDocument
  ): Promise<Blob> {
    if (!disclosure.storagePath) {
      throw new Error(
        'The disclosure document does not have a valid storage location.'
      );
    }

    return getBlob(
      ref(
        storage,
        disclosure.storagePath
      )
    );
  }

  async openDisclosure(
    disclosure:
      ListingDisclosureDocument
  ): Promise<void> {
    /*
     * Open the browser tab immediately during the user’s
     * click. Waiting until after Firebase finishes loading
     * the PDF may cause the browser to treat the new tab
     * as an unwanted popup.
     */
    const openedWindow =
      window.open(
        '',
        '_blank'
      );

    if (!openedWindow) {
      throw new Error(
        'Your browser prevented the disclosure document from opening.'
      );
    }

    openedWindow.opener = null;

    try {
      const pdfBlob =
        await this.downloadDisclosure(
          disclosure
        );

      const objectUrl =
        URL.createObjectURL(pdfBlob);

      openedWindow.location.href =
        objectUrl;

      window.setTimeout(
        () => {
          URL.revokeObjectURL(
            objectUrl
          );
        },
        60_000
      );
    } catch (error) {
      openedWindow.close();
      throw error;
    }
  }

  private validateUploadArguments(
    sellerUid: string,
    listingUid: string,
    stateAbbreviation: string,
    file: File
  ): void {
    if (!sellerUid.trim()) {
      throw new Error(
        'An authenticated seller is required to upload disclosures.'
      );
    }

    if (!listingUid.trim()) {
      throw new Error(
        'A listing is required before uploading disclosures.'
      );
    }

    if (!stateAbbreviation.trim()) {
      throw new Error(
        'The listing state is required before uploading disclosures.'
      );
    }

    if (!file) {
      throw new Error(
        'Select a completed disclosure PDF.'
      );
    }

    if (
      file.type !==
      'application/pdf'
    ) {
      throw new Error(
        'Disclosure documents must be uploaded as PDF files.'
      );
    }

    if (
      file.size >
      MAXIMUM_DISCLOSURE_SIZE_BYTES
    ) {
      throw new Error(
        'The disclosure PDF cannot exceed 15 MB.'
      );
    }
  }

  private async validatePdfFile(
    file: File
  ): Promise<void> {
    const headerBuffer =
      await file
        .slice(0, 5)
        .arrayBuffer();

    const header =
      new TextDecoder()
        .decode(headerBuffer);

    if (header !== '%PDF-') {
      throw new Error(
        'The selected file does not appear to be a valid PDF document.'
      );
    }
  }

  private toFirestoreDocument(
    disclosure:
      ListingDisclosureDocument
  ): Record<string, unknown> {
    return {
      id:
        disclosure.id,

      listingUid:
        disclosure.listingUid,

      sellerUid:
        disclosure.sellerUid,

      documentType:
        disclosure.documentType,

      stateAbbreviation:
        disclosure.stateAbbreviation,

      originalFileName:
        disclosure.originalFileName,

      storagePath:
        disclosure.storagePath,

      contentType:
        disclosure.contentType,

      sizeBytes:
        disclosure.sizeBytes,

      version:
        disclosure.version,

      versionId:
        disclosure.versionId,

      uploadedAt:
        Timestamp.fromDate(
          disclosure.uploadedAt
        ),

      uploadedByUid:
        disclosure.uploadedByUid
    };
  }

  private mapDisclosureSummary(
    value:
      Record<string, unknown>
  ): ListingDisclosureSummary | null {
    const currentDocumentValue =
      this.readRecord(
        value['currentDocument']
      );

    if (!currentDocumentValue) {
      return null;
    }

    const currentDocument =
      this.mapDisclosureDocument(
        currentDocumentValue
      );

    if (!currentDocument) {
      return null;
    }

    return {
      documentType:
        currentDocument.documentType,

      currentDocument,

      updatedAt:
        this.toDate(
          value['updatedAt']
        ) ??
        currentDocument.uploadedAt
    };
  }

  private mapDisclosureDocument(
    value:
      Record<string, unknown>
  ): ListingDisclosureDocument | null {
    const id =
      this.readString(
        value['id']
      );

    const listingUid =
      this.readString(
        value['listingUid']
      );

    const sellerUid =
      this.readString(
        value['sellerUid']
      );

    const documentType =
      this.readString(
        value['documentType']
      ) as DisclosureDocumentType;

    const stateAbbreviation =
      this.readString(
        value['stateAbbreviation']
      );

    const originalFileName =
      this.readString(
        value['originalFileName']
      );

    const storagePath =
      this.readString(
        value['storagePath']
      );

    const uploadedAt =
      this.toDate(
        value['uploadedAt']
      );

    const version =
      this.readNumber(
        value['version']
      );

    if (
      !id ||
      !listingUid ||
      !sellerUid ||
      !documentType ||
      !stateAbbreviation ||
      !originalFileName ||
      !storagePath ||
      !uploadedAt ||
      version === undefined
    ) {
      return null;
    }

    return {
      id,
      listingUid,
      sellerUid,
      documentType,
      stateAbbreviation,
      originalFileName,
      storagePath,

      contentType:
        'application/pdf',

      sizeBytes:
        this.readNumber(
          value['sizeBytes']
        ) ?? 0,

      version,

      versionId:
        this.readString(
          value['versionId']
        ) || id,

      uploadedAt,

      uploadedByUid:
        this.readString(
          value['uploadedByUid']
        ) || sellerUid
    };
  }

  private buildDisclosureStoragePath(
    sellerUid: string,
    listingUid: string,
    documentType:
      DisclosureDocumentType,
    versionId: string
  ): string {
    return [
      'listing-disclosures',
      sellerUid,
      listingUid,
      documentType,
      `${versionId}.pdf`
    ].join('/');
  }

  private createVersionId(): string {
    return [
      Date.now(),
      crypto.randomUUID()
    ].join('-');
  }

  private readRecord(
    value: unknown
  ): Record<string, unknown> | null {
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value)
    ) {
      return null;
    }

    return value as
      Record<string, unknown>;
  }

  private readString(
    value: unknown
  ): string {
    return typeof value === 'string'
      ? value.trim()
      : '';
  }

  private readNumber(
    value: unknown
  ): number | undefined {
    return (
      typeof value === 'number' &&
      Number.isFinite(value)
    )
      ? value
      : undefined;
  }

  private toDate(
    value: unknown
  ): Date | undefined {
    if (
      value instanceof Date
    ) {
      return value;
    }

    if (
      value &&
      typeof value === 'object' &&
      'toDate' in value &&
      typeof (
        value as {
          toDate?: unknown;
        }
      ).toDate === 'function'
    ) {
      return (
        value as {
          toDate(): Date;
        }
      ).toDate();
    }

    return undefined;
  }
}
