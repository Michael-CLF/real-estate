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

import {
  requireStateContractPackage,
} from './state-contracts/state-contract-registry';

import type {
  OfferDocument,
  OfferVersionDocument,
} from './offer-types';


type OfferAttachmentType =
  | 'possession_agreement'
  | 'additional_terms_exhibit'
  | 'legal_description_exhibit'
  | 'reservation_addendum'
  | 'residential_lease_addendum'
  | 'fixture_lease_addendum'
  | 'association_addendum'
  | 'property_condition_disclosure'
  | 'water_rights_disclosure'
  | 'lead_based_paint_addendum'
  | 'temporary_residential_lease'
  | 'plans_and_specifications'
  | 'buyer_selection_documents'
  | 'builder_warranty'
  | 'third_party_warranty'
  | 'contract_addendum';


const NORTH_CAROLINA_ATTACHMENT_TYPES =
  new Set<OfferAttachmentType>([
    'possession_agreement',
    'additional_terms_exhibit',
  ]);


const TEXAS_ATTACHMENT_TYPES =
  new Set<OfferAttachmentType>([
    'legal_description_exhibit',
    'reservation_addendum',
    'residential_lease_addendum',
    'fixture_lease_addendum',
    'association_addendum',
    'property_condition_disclosure',
    'water_rights_disclosure',
    'lead_based_paint_addendum',
    'temporary_residential_lease',
    'plans_and_specifications',
    'buyer_selection_documents',
    'builder_warranty',
    'third_party_warranty',
    'contract_addendum',
  ]);


const ATTACHMENT_TITLES:
  Readonly<Record<OfferAttachmentType, string>> = {
    possession_agreement:
      'Separate Possession Agreement',
    additional_terms_exhibit:
      'Additional Terms Exhibit',
    legal_description_exhibit:
      'Legal Description Exhibit',
    reservation_addendum:
      'Reservation Addendum',
    residential_lease_addendum:
      'Residential Lease Addendum',
    fixture_lease_addendum:
      'Fixture Lease Addendum',
    association_addendum:
      'Property Owners Association Addendum',
    property_condition_disclosure:
      'Property Condition Disclosure',
    water_rights_disclosure:
      'Water Rights Disclosure',
    lead_based_paint_addendum:
      'Lead-Based Paint Addendum',
    temporary_residential_lease:
      'Temporary Residential Lease',
    plans_and_specifications:
      'Plans and Specifications',
    buyer_selection_documents:
      'Buyer Selection Documents',
    builder_warranty:
      'Builder Warranty',
    third_party_warranty:
      'Third-Party Warranty',
    contract_addendum:
      'Contract Addendum',
  };


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

      verifyStateContractConsistency(
        offer,
        version
      );

      verifyAttachmentTypeForState(
        offer.stateCode,
        attachmentType
      );

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
        ATTACHMENT_TITLES[
          attachmentType
        ];

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

          verifyStateContractConsistency(
            currentOffer,
            currentVersion
          );

          verifyAttachmentTypeForState(
            currentOffer.stateCode,
            attachmentType
          );

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


function verifyStateContractConsistency(
  offer: OfferDocument,
  version: OfferVersionDocument
): void {
  const stateContractPackage =
    requireStateContractPackage(
      offer.stateCode
    );

  if (
    version.stateCode !==
      stateContractPackage.stateCode ||
    version.terms.stateCode !==
      stateContractPackage.stateCode
  ) {
    throw new HttpsError(
      'data-loss',
      'The offer state does not match its current contract version.'
    );
  }
}


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
    typeof value !== 'string' ||
    !(value in ATTACHMENT_TITLES)
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Select a valid offer-attachment type.'
    );
  }

  return value as OfferAttachmentType;
}


function verifyAttachmentTypeForState(
  stateCode: string,
  attachmentType: OfferAttachmentType
): void {
  const normalizedStateCode =
    stateCode
      .trim()
      .toUpperCase();

  const allowedTypes =
    normalizedStateCode === 'NC'
      ? NORTH_CAROLINA_ATTACHMENT_TYPES
      : normalizedStateCode === 'TX'
        ? TEXAS_ATTACHMENT_TYPES
        : null;

  if (
    !allowedTypes ||
    !allowedTypes.has(attachmentType)
  ) {
    throw new HttpsError(
      'invalid-argument',
      `The selected attachment type is not supported for ${normalizedStateCode}.`
    );
  }
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
