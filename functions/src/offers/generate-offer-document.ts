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
    generateOfferPdf,
} from './offer-pdf.service';

import type {
    OfferDocument,
    OfferVersionDocument,
} from './offer-types';


type GeneratedAgreementType =
    | 'offer_agreement'
    | 'counteroffer_agreement'
    | 'accepted_agreement';


interface GenerateOfferDocumentData {
    offerUid: string;
    offerVersionUid: string;

    documentType:
    GeneratedAgreementType;
}


interface GenerateOfferDocumentResponse {
    documentUid: string;

    fileName: string;
    storagePath: string;

    pageCount: number;

    hashAlgorithm: 'SHA-256';
    hashValue: string;
}


const GENERATABLE_VERSION_STATUSES =
    new Set([
        'awaiting_signatures',
        'partially_signed',
        'signed',
        'accepted',
    ]);


/*
 * Generates and permanently stores one printable PDF for
 * an immutable offer or counteroffer version.
 */
export const generateOfferDocument =
    onCall<
        GenerateOfferDocumentData,
        Promise<GenerateOfferDocumentResponse>
    >(
        callableFunctionOptions,
        async request => {
            const userUid =
                request.auth?.uid;

            if (!userUid) {
                throw new HttpsError(
                    'unauthenticated',
                    'You must sign in before generating an offer document.'
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

            const documentType =
                requireDocumentType(
                    request.data?.documentType
                );

            const offerReference =
                adminFirestore
                    .collection('offers')
                    .doc(offerUid);

            const versionReference =
                offerReference
                    .collection('versions')
                    .doc(offerVersionUid);

            const documentUid = [
                offerVersionUid,
                documentType,
            ].join('-');

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

            verifyDocumentAccess(
                offer,
                version,
                userUid,
                offerVersionUid,
                documentType
            );

            /*
             * The same immutable version and document type always
             * resolve to the same permanent document.
             */
            if (existingDocumentSnapshot.exists) {
                const existingDocument =
                    existingDocumentSnapshot.data();

                if (!existingDocument) {
                    throw new HttpsError(
                        'data-loss',
                        'The stored offer document contains no data.'
                    );
                }

                return {
                    documentUid,

                    fileName:
                        readRequiredString(
                            existingDocument,
                            'fileName'
                        ),

                    storagePath:
                        readRequiredString(
                            existingDocument,
                            'storagePath'
                        ),

                    pageCount:
                        readRequiredNumber(
                            existingDocument,
                            'pageCount'
                        ),

                    hashAlgorithm:
                        'SHA-256',

                    hashValue:
                        readNestedHashValue(
                            existingDocument
                        ),
                };
            }

            const generatedAt =
                new Date();

            const documentTitle =
                getDocumentTitle(
                    documentType,
                    version.versionNumber
                );

            /*
             * This remains a prototype until the attorney-approved
             * NavStreet master agreement is activated.
             */
            const generatedPdf =
                await generateOfferPdf({
                    offer,
                    version,

                    documentTitle,

                    generatedAt,

                    documentStatus:
                        'prototype',
                });

            const hashValue =
                createHash('sha256')
                    .update(
                        generatedPdf.buffer
                    )
                    .digest('hex');

            const storagePath = [
                'offers',
                offerUid,
                'versions',
                offerVersionUid,
                generatedPdf.fileName,
            ].join('/');

            const bucket =
                getStorage().bucket();

            const storageFile =
                bucket.file(
                    storagePath
                );

            await storageFile.save(
                generatedPdf.buffer,
                {
                    resumable: false,

                    contentType:
                        'application/pdf',

                    metadata: {
                        cacheControl:
                            'private, no-store, max-age=0',

                        contentDisposition:
                            `attachment; filename="${generatedPdf.fileName}"`,

                        metadata: {
                            offerUid,
                            offerVersionUid,

                            offerReferenceNumber:
                                offer.referenceNumber,

                            versionNumber:
                                version.versionNumber
                                    .toString(),

                            documentType,

                            sha256:
                                hashValue,
                        },
                    },
                }
            );

            const now =
                Timestamp.now();

            const template = {
                stateCode:
                    offer.stateCode,

                templateUid:
                    'navstreet-nc-residential-purchase-agreement',

                templateName:
                    'NavStreet North Carolina Residential Purchase Agreement',

                templateVersion:
                    'prototype-1.0.0',

                effectiveDate:
                    generatedAt
                        .toISOString()
                        .slice(0, 10),

                releaseStatus:
                    'prototype',
            };

            const hash = {
                algorithm:
                    'SHA-256',

                value:
                    hashValue,

                calculatedAt:
                    now,
            };

            const documentData = {
                Uid: documentUid,

                offerUid,
                offerVersionUid,

                type:
                    documentType,

                source:
                    'navstreet',

                visibility:
                    'buyer_and_seller',

                title:
                    documentTitle,

                fileName:
                    generatedPdf.fileName,

                contentType:
                    'application/pdf',

                storagePath,

                sizeInBytes:
                    generatedPdf.buffer
                        .byteLength,

                pageCount:
                    generatedPdf.pageCount,

                status:
                    'generated',

                template,
                hash,

                signatureRequest: {
                    status:
                        'not_started',

                    signers: [
                        ...version.buyers,
                        ...version.sellers,
                    ].map(
                        party => ({
                            partyUid:
                                party.partyUid,

                            userUid:
                                party.userUid,

                            role:
                                party.role,

                            legalName:
                                party.legalName,

                            email:
                                party.email,

                            required:
                                party.requiredSigner,

                            status:
                                'not_started',
                        })
                    ),
                },

                deliveries: [],

                downloadable: true,
                printable: true,

                generatedAt: now,

                createdByUid:
                    userUid,

                createdAt: now,
                updatedAt: now,
            };

            const versionDocumentSnapshot = {
                documentUid,

                type:
                    documentType,

                title:
                    documentTitle,

                fileName:
                    generatedPdf.fileName,

                storagePath,

                hash,
                template,

                generatedAt: now,

                signatureRequestStatus:
                    'not_started',

                fullySigned: false,

                downloadable: true,
                printable: true,
            };

            try {
                await adminFirestore.runTransaction(
                    async transaction => {
                        const [
                            currentVersionSnapshot,
                            currentDocumentSnapshot,
                        ] = await Promise.all([
                            transaction.get(
                                versionReference
                            ),

                            transaction.get(
                                documentReference
                            ),
                        ]);

                        if (
                            !currentVersionSnapshot.exists
                        ) {
                            throw new HttpsError(
                                'not-found',
                                'The offer version no longer exists.'
                            );
                        }

                        if (
                            currentDocumentSnapshot.exists
                        ) {
                            return;
                        }

                        const currentVersion =
                            currentVersionSnapshot.data() as
                            OfferVersionDocument;

                        if (!currentVersion.immutable) {
                            throw new HttpsError(
                                'failed-precondition',
                                'The offer version is no longer locked.'
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
            } catch (error) {
                /*
                 * If Firestore persistence fails after upload, remove
                 * the unreferenced file so Storage and Firestore do
                 * not become inconsistent.
                 */
                await storageFile
                    .delete({
                        ignoreNotFound: true,
                    })
                    .catch(() => undefined);

                throw error;
            }

            return {
                documentUid,

                fileName:
                    generatedPdf.fileName,

                storagePath,

                pageCount:
                    generatedPdf.pageCount,

                hashAlgorithm:
                    'SHA-256',

                hashValue,
            };
        }
    );


function verifyDocumentAccess(
    offer: OfferDocument,
    version: OfferVersionDocument,
    userUid: string,
    offerVersionUid: string,
    documentType:
        GeneratedAgreementType
): void {
    const participant =
        offer.buyerUids.includes(
            userUid
        ) ||
        offer.sellerUids.includes(
            userUid
        );

    if (!participant) {
        throw new HttpsError(
            'permission-denied',
            'You do not have access to this offer.'
        );
    }

    if (
        version.offerUid !==
        offer.Uid
    ) {
        throw new HttpsError(
            'failed-precondition',
            'The offer version does not belong to this offer.'
        );
    }

    if (
        version.Uid !==
        offerVersionUid
    ) {
        throw new HttpsError(
            'failed-precondition',
            'The requested offer version is invalid.'
        );
    }

    if (!version.immutable) {
        throw new HttpsError(
            'failed-precondition',
            'The offer must be submitted and locked before generating a PDF.'
        );
    }

    if (
        !GENERATABLE_VERSION_STATUSES.has(
            version.status
        )
    ) {
        throw new HttpsError(
            'failed-precondition',
            'This offer version is not ready for document generation.'
        );
    }

    if (
        documentType ===
        'accepted_agreement' &&
        version.status !== 'accepted'
    ) {
        throw new HttpsError(
            'failed-precondition',
            'A final accepted agreement cannot be generated until the offer is accepted.'
        );
    }

    if (
        documentType ===
        'offer_agreement' &&
        version.versionNumber !== 1
    ) {
        throw new HttpsError(
            'failed-precondition',
            'Only the first version may be generated as the original offer agreement.'
        );
    }

    if (
        documentType ===
        'counteroffer_agreement' &&
        version.versionNumber === 1
    ) {
        throw new HttpsError(
            'failed-precondition',
            'The first offer version is not a counteroffer.'
        );
    }
}


function requireDocumentType(
    value: unknown
): GeneratedAgreementType {
    if (
        value === 'offer_agreement' ||
        value ===
        'counteroffer_agreement' ||
        value ===
        'accepted_agreement'
    ) {
        return value;
    }

    throw new HttpsError(
        'invalid-argument',
        'The offer document type is invalid.'
    );
}


function getDocumentTitle(
    documentType:
        GeneratedAgreementType,
    versionNumber: number
): string {
    switch (documentType) {
        case 'offer_agreement':
            return 'Residential Purchase Offer';

        case 'counteroffer_agreement':
            return `Residential Counteroffer — Version ${versionNumber}`;

        case 'accepted_agreement':
            return 'Final Accepted Residential Purchase Agreement';
    }
}


function readRequiredString(
    data: Record<string, unknown>,
    fieldName: string
): string {
    const value =
        data[fieldName];

    if (
        typeof value !== 'string' ||
        value.trim().length === 0
    ) {
        throw new HttpsError(
            'data-loss',
            `The stored document is missing ${fieldName}.`
        );
    }

    return value;
}


function readRequiredNumber(
    data: Record<string, unknown>,
    fieldName: string
): number {
    const value =
        data[fieldName];

    if (
        typeof value !== 'number' ||
        !Number.isFinite(value)
    ) {
        throw new HttpsError(
            'data-loss',
            `The stored document is missing ${fieldName}.`
        );
    }

    return value;
}


function readNestedHashValue(
    data: Record<string, unknown>
): string {
    const hash =
        data['hash'];

    if (
        hash === null ||
        typeof hash !== 'object' ||
        Array.isArray(hash)
    ) {
        throw new HttpsError(
            'data-loss',
            'The stored document hash is missing.'
        );
    }

    return readRequiredString(
        hash as
        Record<string, unknown>,
        'value'
    );
}


function requireIdentifier(
    value: unknown,
    fieldName: string
): string {
    if (
        typeof value !== 'string' ||
        value.trim().length === 0
    ) {
        throw new HttpsError(
            'invalid-argument',
            `${fieldName} is required.`
        );
    }

    const normalizedValue =
        value.trim();

    if (
        normalizedValue.length > 200 ||
        normalizedValue.includes('/')
    ) {
        throw new HttpsError(
            'invalid-argument',
            `${fieldName} is invalid.`
        );
    }

    return normalizedValue;
}