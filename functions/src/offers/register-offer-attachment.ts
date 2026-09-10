import {
  createHash,
} from 'node:crypto';

import {
  HttpsError,
  onCall,
} from 'firebase-functions/v2/https';

import {
  FieldValue,
  Timestamp,
} from 'firebase-admin/firestore';

import {
  getStorage,
} from 'firebase-admin/storage';

import {
  adminFirestore,
} from '../shared/firebase-admin';

import {
  callableFunctionOptions,
} from '../shared/function-options';

import type {
  OfferDocument,
  OfferVersionDocument,
} from './offer-types';


type OfferAttachmentType =
  | 'possession_agreement'
  | 'additional_terms_exhibit';


interface RegisterOfferAttachmentData {
  offerUid: string;
  offerVersionUid: string;
  documentUid: string;

  attachmentType: OfferAttachmentType;

  originalFileName: string;
  storagePath: string;
}


interface RegisterOfferAttachmentResponse {
  documentUid: string;

  fileName: string;
  storagePath: string;

  attachmentType: OfferAttachmentType;
}


const MAXIMUM_FILE_SIZE_BYTES =
  15 * 1024 * 1024;


export const registerOfferAttachment =
  onCall<
    RegisterOfferAttachmentData,
    Promise<RegisterOfferAttachmentResponse>
  >(
    callableFunctionOptions,
    async request => {
      const userUid =
        request.auth?.uid;

      if (!userUid) {
        throw new HttpsError(
          'unauthenticated',
          'You must sign in before uploading an offer attachment.'
        );
      }

      const offerUid =
        requireIdentifier(
          request.data?.offerUid,
          'offerUid'
        );

      const offerVersionUid =
        requireIdentifier(
          request.data?.offerVersionUid,
          'offerVersionUid'
        );

      const documentUid =
        requireIdentifier(
          request.data?.documentUid,
          'documentUid'
        );

      const attachmentType =
        requireAttachmentType(
          request.data?.attachmentType
        );

      const originalFileName =
        requirePdfFileName(
          request.data?.originalFileName
        );

      const expectedStoragePath = [
        'offers',
        offerUid,
        'versions',
        offerVersionUid,
        'attachments',
        `${documentUid}.pdf`,
      ].join('/');

      if (
        request.data?.storagePath !==
          expectedStoragePath
      ) {
        throw new HttpsError(
          'invalid-argument',
          'The attachment storage path is invalid.'
        );
      }

      const offerReference =
        adminFirestore
          .collection('offers')
          .doc(offerUid);

      const versionReference =
        offerReference
          .collection('versions')
          .doc(offerVersionUid);

      const documentReference =
        offerReference
          .collection('documents')
          .doc(documentUid);

      const [
        offerSnapshot,
        versionSnapshot,
        existingDocumentSnapshot,
      ] = await Promise.all([
        offerReference.get(),
        versionReference.get(),
        documentReference.get(),
      ]);

      if (!offerSnapshot.exists) {
        throw new HttpsError(
          'not-found',
          'The offer could not be found.'
        );
      }

      if (!versionSnapshot.exists) {
        throw new HttpsError(
          'not-found',
          'The offer version could not be found.'
        );
      }

      const offer =
        offerSnapshot.data() as
          OfferDocument;

      const version =
        versionSnapshot.data() as
          OfferVersionDocument;

      verifyUploadAccess(
        offer,
        version,
        userUid,
        offerVersionUid
      );

      if (existingDocumentSnapshot.exists) {
        const existingDocument =
          existingDocumentSnapshot.data();

        if (
          existingDocument?.['storagePath'] ===
            expectedStoragePath &&
          existingDocument?.['type'] ===
            attachmentType
        ) {
          return {
            documentUid,
            fileName:
              String(
                existingDocument['fileName']
              ),
            storagePath:
              expectedStoragePath,
            attachmentType,
          };
        }

        throw new HttpsError(
          'already-exists',
          'This attachment identifier is already in use.'
        );
      }

      const storageFile =
        getStorage()
          .bucket()
          .file(expectedStoragePath);

      const [exists] =
        await storageFile.exists();

      if (!exists) {
        throw new HttpsError(
          'failed-precondition',
          'The uploaded attachment could not be found.'
        );
      }

      const [metadata] =
        await storageFile.getMetadata();

      const sizeInBytes =
        Number(metadata.size);

      if (
        metadata.contentType !==
          'application/pdf' ||
        !Number.isInteger(sizeInBytes) ||
        sizeInBytes <= 0 ||
        sizeInBytes >
          MAXIMUM_FILE_SIZE_BYTES
      ) {
        throw new HttpsError(
          'failed-precondition',
          'The uploaded attachment must be a PDF no larger than 15 MB.'
        );
      }

      const customMetadata =
        metadata.metadata ?? {};

      if (
        customMetadata['offerUid'] !== offerUid ||
        customMetadata['offerVersionUid'] !==
          offerVersionUid ||
        customMetadata['documentUid'] !==
          documentUid ||
        customMetadata['attachmentType'] !==
          attachmentType ||
        customMetadata['uploaderUid'] !==
          userUid ||
        customMetadata['originalFileName'] !==
          originalFileName
      ) {
        throw new HttpsError(
          'failed-precondition',
          'The uploaded attachment metadata is invalid.'
        );
      }

      const [fileBuffer] =
        await storageFile.download();

      if (
        fileBuffer
          .subarray(0, 5)
          .toString('ascii') !== '%PDF-'
      ) {
        throw new HttpsError(
          'failed-precondition',
          'The uploaded file is not a valid PDF document.'
        );
      }

      const now = Timestamp.now();

      const hash = {
        algorithm: 'SHA-256',
        value:
          createHash('sha256')
            .update(fileBuffer)
            .digest('hex'),
        calculatedAt: now,
      };

      const title =
        attachmentType ===
          'possession_agreement'
          ? 'Separate Possession Agreement'
          : 'Additional Terms Exhibit';

      const documentData = {
        Uid: documentUid,

        offerUid,
        offerVersionUid,

        type: attachmentType,
        source: version.initiatedBy,
        visibility:
          'buyer_and_seller',

        title,
        fileName: originalFileName,
        contentType:
          'application/pdf',

        storagePath:
          expectedStoragePath,

        sizeInBytes,

        status: 'uploaded',
        hash,

        deliveries: [],

        downloadable: true,
        printable: true,

        uploadedAt: now,

        createdByUid: userUid,

        createdAt: now,
        updatedAt: now,
      };

      const versionDocumentSnapshot = {
        documentUid,
        type: attachmentType,
        title,
        fileName: originalFileName,
        storagePath:
          expectedStoragePath,
        hash,
        uploadedAt: now,
        downloadable: true,
        printable: true,
      };

      await adminFirestore.runTransaction(
        async transaction => {
          const [
            currentOfferSnapshot,
            currentVersionSnapshot,
            currentDocumentSnapshot,
          ] = await Promise.all([
            transaction.get(
              offerReference
            ),
            transaction.get(
              versionReference
            ),
            transaction.get(
              documentReference
            ),
          ]);

          if (
            !currentOfferSnapshot.exists ||
            !currentVersionSnapshot.exists
          ) {
            throw new HttpsError(
              'not-found',
              'The offer or offer version no longer exists.'
            );
          }

          const currentOffer =
            currentOfferSnapshot.data() as
              OfferDocument;

          const currentVersion =
            currentVersionSnapshot.data() as
              OfferVersionDocument;

          verifyUploadAccess(
            currentOffer,
            currentVersion,
            userUid,
            offerVersionUid
          );

          if (currentDocumentSnapshot.exists) {
            throw new HttpsError(
              'already-exists',
              'This attachment has already been registered.'
            );
          }

          transaction.create(
            documentReference,
            documentData
          );

          transaction.update(
            versionReference,
            {
              documents:
                FieldValue.arrayUnion(
                  versionDocumentSnapshot
                ),
              updatedAt: now,
            }
          );

          transaction.update(
            offerReference,
            {
              lastActivityAt: now,
              updatedAt: now,
            }
          );
        }
      );

      return {
        documentUid,
        fileName: originalFileName,
        storagePath:
          expectedStoragePath,
        attachmentType,
      };
    }
  );


function verifyUploadAccess(
  offer: OfferDocument,
  version: OfferVersionDocument,
  userUid: string,
  offerVersionUid: string
): void {
  const participant =
    offer.buyerUids.includes(userUid) ||
    offer.sellerUids.includes(userUid);

  if (!participant) {
    throw new HttpsError(
      'permission-denied',
      'You do not have access to this offer.'
    );
  }

  if (
    offer.currentVersionUid !==
      offerVersionUid ||
    version.Uid !== offerVersionUid ||
    version.offerUid !== offer.Uid
  ) {
    throw new HttpsError(
      'failed-precondition',
      'Attachments may be added only to the current offer version.'
    );
  }

  if (
    version.status !== 'draft' ||
    version.immutable ||
    version.initiatedByUid !== userUid
  ) {
    throw new HttpsError(
      'failed-precondition',
      'Only the party preparing the current draft may add attachments.'
    );
  }
}


function requireIdentifier(
  value: unknown,
  fieldName: string
): string {
  if (
    typeof value !== 'string' ||
    !/^[A-Za-z0-9_-]{1,160}$/.test(value)
  ) {
    throw new HttpsError(
      'invalid-argument',
      `A valid ${fieldName} is required.`
    );
  }

  return value;
}


function requireAttachmentType(
  value: unknown
): OfferAttachmentType {
  if (
    value !== 'possession_agreement' &&
    value !== 'additional_terms_exhibit'
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Select a valid offer-attachment type.'
    );
  }

  return value;
}


function requirePdfFileName(
  value: unknown
): string {
  if (
    typeof value !== 'string'
  ) {
    throw new HttpsError(
      'invalid-argument',
      'The original PDF file name is required.'
    );
  }

  const fileName =
    value
      .replace(/[\u0000-\u001F\u007F]/g, '')
      .trim();

  if (
    fileName.length === 0 ||
    fileName.length > 240 ||
    !fileName.toLowerCase().endsWith('.pdf')
  ) {
    throw new HttpsError(
      'invalid-argument',
      'The attachment must have a valid PDF file name.'
    );
  }

  return fileName;
}
