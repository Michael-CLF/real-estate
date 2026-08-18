import {
  Injectable
} from '@angular/core';

import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query
} from 'firebase/firestore';

import {
  httpsCallable
} from 'firebase/functions';

import {
  getDownloadURL,
  getStorage,
  ref
} from 'firebase/storage';

import {
  firestore,
  functions
} from '../../../infrastructure/firebase/firebase';

import {
  OfferDocument,
  OfferDocumentType
} from '../models/offer-document.model';


export interface GenerateOfferDocumentRequest {
  offerUid: string;
  offerVersionUid: string;

  documentType:
    | 'offer_agreement'
    | 'counteroffer_agreement'
    | 'accepted_agreement';
}


export interface GenerateOfferDocumentResponse {
  documentUid: string;

  fileName: string;
  storagePath: string;

  pageCount: number;

  hashAlgorithm: 'SHA-256';
  hashValue: string;
}


@Injectable({
  providedIn: 'root'
})
export class OfferDocumentService {

  private readonly storage =
    getStorage();


  private readonly generateOfferDocumentFunction =
    httpsCallable<
      GenerateOfferDocumentRequest,
      GenerateOfferDocumentResponse
    >(
      functions,
      'generateOfferDocument'
    );


  async generateAgreement(
    offerUid: string,
    offerVersionUid: string,
    documentType:
      GenerateOfferDocumentRequest[
        'documentType'
      ]
  ): Promise<GenerateOfferDocumentResponse> {
    this.requireText(
      offerUid,
      'An offer identifier is required.'
    );

    this.requireText(
      offerVersionUid,
      'An offer-version identifier is required.'
    );

    const result =
      await this.generateOfferDocumentFunction({
        offerUid,
        offerVersionUid,
        documentType
      });

    return result.data;
  }


  async getDocument(
    offerUid: string,
    documentUid: string
  ): Promise<OfferDocument | null> {
    this.requireText(
      offerUid,
      'An offer identifier is required.'
    );

    this.requireText(
      documentUid,
      'A document identifier is required.'
    );

    const documentReference = doc(
      firestore,
      'offers',
      offerUid,
      'documents',
      documentUid
    );

    const snapshot =
      await getDoc(documentReference);

    if (!snapshot.exists()) {
      return null;
    }

    return this.mapDocumentData(
      snapshot.id,
      snapshot.data()
    );
  }


  async getDocuments(
    offerUid: string
  ): Promise<OfferDocument[]> {
    this.requireText(
      offerUid,
      'An offer identifier is required.'
    );

    const documentsReference =
      collection(
        firestore,
        'offers',
        offerUid,
        'documents'
      );

    const documentsQuery = query(
      documentsReference,
      orderBy(
        'createdAt',
        'asc'
      )
    );

    const snapshot =
      await getDocs(documentsQuery);

    return snapshot.docs.map(
      documentSnapshot =>
        this.mapDocumentData(
          documentSnapshot.id,
          documentSnapshot.data()
        )
    );
  }


  async getDocumentsForVersion(
    offerUid: string,
    offerVersionUid: string
  ): Promise<OfferDocument[]> {
    const documents =
      await this.getDocuments(
        offerUid
      );

    return documents.filter(
      document =>
        document.offerVersionUid ===
        offerVersionUid
    );
  }


  async getDocumentsByType(
    offerUid: string,
    documentType: OfferDocumentType
  ): Promise<OfferDocument[]> {
    const documents =
      await this.getDocuments(
        offerUid
      );

    return documents.filter(
      document =>
        document.type ===
        documentType
    );
  }


  async getDownloadUrl(
    document: OfferDocument
  ): Promise<string> {
    if (!document.downloadable) {
      throw new Error(
        'This document is not available for download.'
      );
    }

    this.requireText(
      document.storagePath,
      'The document storage path is missing.'
    );

    const storageReference = ref(
      this.storage,
      document.storagePath
    );

    return getDownloadURL(
      storageReference
    );
  }


  async downloadDocument(
    document: OfferDocument
  ): Promise<void> {
    const downloadUrl =
      await this.getDownloadUrl(
        document
      );

    const link =
      window.document.createElement(
        'a'
      );

    link.href = downloadUrl;
    link.download = document.fileName;
    link.rel = 'noopener';

    window.document.body.appendChild(
      link
    );

    link.click();
    link.remove();
  }


  async printDocument(
    document: OfferDocument
  ): Promise<void> {
    if (!document.printable) {
      throw new Error(
        'This document is not available for printing.'
      );
    }

    const downloadUrl =
      await this.getDownloadUrl(
        document
      );

    const printWindow =
      window.open(
        downloadUrl,
        '_blank',
        'noopener,noreferrer'
      );

    if (!printWindow) {
      throw new Error(
        'The browser blocked the print window. Allow pop-ups for NavStreet and try again.'
      );
    }
  }


  private mapDocumentData(
    documentUid: string,
    data: Record<string, unknown>
  ): OfferDocument {
    const normalizedData =
      this.normalizeFirestoreValue(
        data
      ) as Record<string, unknown>;

    return {
      ...normalizedData,
      Uid: documentUid
    } as unknown as OfferDocument;
  }


  private normalizeFirestoreValue(
    value: unknown
  ): unknown {
    if (value instanceof Timestamp) {
      return value.toDate();
    }

    if (Array.isArray(value)) {
      return value.map(
        item =>
          this.normalizeFirestoreValue(
            item
          )
      );
    }

    if (
      value !== null &&
      typeof value === 'object'
    ) {
      return Object.fromEntries(
        Object.entries(
          value as Record<string, unknown>
        ).map(
          ([key, nestedValue]) => [
            key,
            this.normalizeFirestoreValue(
              nestedValue
            )
          ]
        )
      );
    }

    return value;
  }


  private requireText(
    value: string,
    message: string
  ): void {
    if (
      typeof value !== 'string' ||
      value.trim().length === 0
    ) {
      throw new Error(message);
    }
  }
}