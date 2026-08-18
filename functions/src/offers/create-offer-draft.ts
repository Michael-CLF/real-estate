import {
  HttpsError,
  onCall,
} from 'firebase-functions/v2/https';

import {
  FieldValue,
  Timestamp,
} from 'firebase-admin/firestore';

import {
  adminAuth,
  adminFirestore,
} from '../shared/firebase-admin';

import {
  callableFunctionOptions,
} from '../shared/function-options';

import {
  verifyOfferEligibility,
} from './verify-offer-eligibility';

import type {
  CreateOfferDraftData,
  CreateOfferDraftResponse,
  OfferEligibleListing,
  OfferUserProfile,
  OfferVersionPartySnapshotDocument,
} from './offer-types';


const OPEN_OFFER_STATUSES = [
  'draft',
  'submitted',
  'viewed',
  'countered',
] as const;


/*
 * Creates the first editable offer version or resumes the
 * buyer's existing open offer thread for the listing.
 */
export const createOfferDraft =
  onCall<
    CreateOfferDraftData,
    Promise<CreateOfferDraftResponse>
  >(
    callableFunctionOptions,
    async request => {
      const buyerUid =
        request.auth?.uid;

      if (!buyerUid) {
        throw new HttpsError(
          'unauthenticated',
          'You must sign in before making an offer.'
        );
      }

      const listingUid =
        requireIdentifier(
          request.data?.listingUid,
          'listingUid'
        );

      /*
       * Initial eligibility check provides clear errors
       * before user-profile and transaction work begins.
       */
      const eligibleListing =
        await verifyOfferEligibility(
          listingUid,
          buyerUid
        );

      const [
        buyerProfile,
        sellerProfile,
        buyerAuthUser,
        sellerAuthUser,
      ] = await Promise.all([
        loadUserProfile(buyerUid),
        loadUserProfile(
          eligibleListing.sellerUid
        ),
        adminAuth.getUser(buyerUid),
        adminAuth.getUser(
          eligibleListing.sellerUid
        ),
      ]);

      const offerReference =
        adminFirestore
          .collection('offers')
          .doc();

      const versionReference =
        offerReference
          .collection('versions')
          .doc();

      const now =
        Timestamp.now();

      const referenceNumber =
        createReferenceNumber(
          eligibleListing.state,
          offerReference.id,
          now.toDate()
        );

      const result =
        await adminFirestore.runTransaction(
          async transaction => {
            const listingReference =
              adminFirestore
                .collection('listings')
                .doc(listingUid);

            /*
             * Recheck the listing inside the transaction so
             * a stale browser cannot create an offer after
             * the listing changes status.
             */
            const currentListingSnapshot =
              await transaction.get(
                listingReference
              );

            if (!currentListingSnapshot.exists) {
              throw new HttpsError(
                'not-found',
                'The property listing could not be found.'
              );
            }

            const currentListingData =
              currentListingSnapshot.data();

            if (!currentListingData) {
              throw new HttpsError(
                'not-found',
                'The property listing does not contain any data.'
              );
            }

            const currentSellerUid =
              readRequiredString(
                currentListingData,
                'sellerUid',
                'The listing does not identify its seller.'
              );

            const currentStatus =
              readRequiredString(
                currentListingData,
                'status',
                'The listing does not contain a valid status.'
              )
                .toLowerCase();

            if (
              currentSellerUid !==
              eligibleListing.sellerUid
            ) {
              throw new HttpsError(
                'aborted',
                'The listing seller changed while the offer was being created. Please try again.'
              );
            }

            if (
              currentStatus !== 'active' ||
              currentListingData[
                'acceptingOffers'
              ] === false
            ) {
              throw new HttpsError(
                'failed-precondition',
                'This property is not currently accepting offers.'
              );
            }

            const existingOfferQuery =
              adminFirestore
                .collection('offers')
                .where(
                  'buyerUids',
                  'array-contains',
                  buyerUid
                )
                .where(
                  'listingUid',
                  '==',
                  listingUid
                )
                .where(
                  'status',
                  'in',
                  [
                    ...OPEN_OFFER_STATUSES,
                  ]
                )
                .limit(1);

            const existingOfferSnapshot =
              await transaction.get(
                existingOfferQuery
              );

            if (
              !existingOfferSnapshot.empty
            ) {
              const existingOfferDocument =
                existingOfferSnapshot.docs[0];

              const existingOfferData =
                existingOfferDocument.data();

              return {
                offerUid:
                  existingOfferDocument.id,

                offerVersionUid:
                  readRequiredString(
                    existingOfferData,
                    'currentVersionUid',
                    'The existing offer does not identify its current version.'
                  ),

                referenceNumber:
                  readRequiredString(
                    existingOfferData,
                    'referenceNumber',
                    'The existing offer does not contain a reference number.'
                  ),

                resumedExistingDraft: true,
              };
            }

            const propertySnapshot =
              createPropertySnapshot(
                eligibleListing
              );

            const buyerParty =
              createPartySnapshot({
                role: 'buyer',

                partyUid:
                  offerReference
                    .collection('parties')
                    .doc().id,

                userUid: buyerUid,

                profile: buyerProfile,

                fallbackEmail:
                  buyerAuthUser.email ?? '',

                sequence: 1,
                primaryParty: true,

                now,
              });

            const sellerParty =
              createPartySnapshot({
                role: 'seller',

                partyUid:
                  offerReference
                    .collection('parties')
                    .doc().id,

                userUid:
                  eligibleListing.sellerUid,

                profile: sellerProfile,

                fallbackEmail:
                  sellerAuthUser.email ?? '',

                sequence: 1,
                primaryParty: true,

                now,
              });

            const initialTerms =
              createInitialOfferTerms(
                propertySnapshot,
                buyerParty,
                sellerParty
              );

            const offerData =
              removeUndefinedValues({
                Uid: offerReference.id,

                referenceNumber,

                listingUid,
                stateCode:
                  eligibleListing.state,

                property:
                  propertySnapshot,

                primaryBuyerUid:
                  buyerUid,

                buyerUids: [
                  buyerUid,
                ],

                primarySellerUid:
                  eligibleListing.sellerUid,

                sellerUids: [
                  eligibleListing.sellerUid,
                ],

                status: 'draft',

                currentVersionUid:
                  versionReference.id,

                currentVersionNumber: 1,

                initialVersionUid:
                  versionReference.id,

                versionUids: [
                  versionReference.id,
                ],

                totalVersions: 1,

                statusHistory: [
                  {
                    toStatus: 'draft',

                    action:
                      'draft_created',

                    actorUid: buyerUid,
                    actorRole: 'buyer',

                    offerVersionUid:
                      versionReference.id,

                    offerVersionNumber: 1,

                    occurredAt: now,
                  },
                ],

                lastActivityAt: now,
                createdAt: now,
                updatedAt: now,
              });

            const versionData =
              removeUndefinedValues({
                Uid: versionReference.id,

                offerUid:
                  offerReference.id,

                versionNumber: 1,

                initiatedBy: 'buyer',
                initiatedByUid: buyerUid,

                status: 'draft',

                stateCode:
                  eligibleListing.state,

                terms: initialTerms,

                buyers: [
                  buyerParty,
                ],

                sellers: [
                  sellerParty,
                ],

                changesFromPreviousVersion: [],

                documents: [],

                statusHistory: [
                  {
                    toStatus: 'draft',

                    action: 'created',

                    actorUid: buyerUid,
                    actorRole: 'buyer',

                    occurredAt: now,
                  },
                ],

                immutable: false,

                expiresAt: '',

                createdAt: now,
                updatedAt: now,
              });

            transaction.create(
              offerReference,
              offerData
            );

            transaction.create(
              versionReference,
              versionData
            );

            return {
              offerUid:
                offerReference.id,

              offerVersionUid:
                versionReference.id,

              referenceNumber,

              resumedExistingDraft: false,
            };
          }
        );

      return result;
    }
  );


function createPropertySnapshot(
  listing: OfferEligibleListing
): Record<string, unknown> {
  return removeUndefinedValues({
    listingUid: listing.Uid,

    addressLine1:
      listing.addressLine1,

    addressLine2:
      listing.addressLine2,

    city: listing.city,
    state: listing.state,
    zipCode: listing.zipCode,
    county: listing.county,

    parcelIdentificationNumber:
      listing
        .parcelIdentificationNumber,

    deedBook:
      listing.deedBook,

    deedPage:
      listing.deedPage,

    legalDescription:
      listing.legalDescription,

    propertyType:
      listing.propertyType,

    /*
     * Published listing prices are currently stored as
     * dollars. Offer currency is stored as whole cents.
     */
    listPriceInCents:
      Math.round(
        listing.listPrice * 100
      ),
  });
}


function createPartySnapshot(
  input: {
    role: 'buyer' | 'seller';

    partyUid: string;
    userUid: string;

    profile: OfferUserProfile | null;

    fallbackEmail: string;

    sequence: number;
    primaryParty: boolean;

    now: Timestamp;
  }
): OfferVersionPartySnapshotDocument {
  const firstName =
    input.profile?.firstName?.trim() ??
    '';

  const lastName =
    input.profile?.lastName?.trim() ??
    '';

  const verifiedFirstName =
    input.profile
      ?.verifiedFirstName
      ?.trim();

  const verifiedMiddleName =
    input.profile
      ?.verifiedMiddleName
      ?.trim();

  const verifiedLastName =
    input.profile
      ?.verifiedLastName
      ?.trim();

  const identityVerified =
    input.profile?.identityStatus ===
      'verified' ||
    (
      Boolean(verifiedFirstName) &&
      Boolean(verifiedLastName)
    );

  const legalNameParts =
    identityVerified
      ? [
        verifiedFirstName,
        verifiedMiddleName,
        verifiedLastName,
      ]
      : [
        firstName,
        lastName,
      ];

  const legalName =
    legalNameParts
      .filter(
        (
          value
        ): value is string =>
          typeof value === 'string' &&
          value.trim().length > 0
      )
      .join(' ');

  return removeUndefinedValues({
    partyUid: input.partyUid,
    userUid: input.userUid,

    role: input.role,

    capacity: 'individual',

    firstName:
      verifiedFirstName ??
      firstName,

    middleName:
      verifiedMiddleName,

    lastName:
      verifiedLastName ??
      lastName,

    legalName,

    email:
      input.profile?.email?.trim() ||
      input.fallbackEmail.trim(),

    phone:
      input.profile?.phone?.trim() ??
      '',

    mailingAddress: {
      addressLine1:
        input.profile
          ?.addressLine1
          ?.trim() ?? '',

      addressLine2:
        input.profile
          ?.addressLine2
          ?.trim(),

      city:
        input.profile
          ?.city
          ?.trim() ?? '',

      state:
        input.profile
          ?.state
          ?.trim()
          .toUpperCase() ?? '',

      zipCode:
        input.profile
          ?.zipCode
          ?.trim() ?? '',

      country:
        input.profile
          ?.country
          ?.trim()
          .toUpperCase() ??
        'US',
    },

    sequence: input.sequence,

    primaryParty:
      input.primaryParty,

    intendedUse:
      input.role === 'buyer'
        ? undefined
        : undefined,

    proposedDeedName:
      input.role === 'buyer'
        ? legalName
        : undefined,

    requiredSigner: true,

    identityVerification: {
      status:
        identityVerified
          ? 'verified'
          : 'not_started',

      provider:
        'stripe_identity',

      providerVerificationUid:
        input.profile
          ?.stripeIdentityVerificationSessionId,

      verifiedFirstName,
      verifiedMiddleName,
      verifiedLastName,

      verifiedAt:
        input.profile
          ?.identityVerifiedAt,

      legalNameApplied:
        identityVerified,
    },

    signature: {
      status: 'not_started',
    },

    electronicTransactionsConsentAccepted:
      false,
  }) as unknown as
    OfferVersionPartySnapshotDocument;
}


function createInitialOfferTerms(
  property:
    Record<string, unknown>,

  buyer:
    OfferVersionPartySnapshotDocument,

  seller:
    OfferVersionPartySnapshotDocument
): Record<string, unknown> {
  const listPriceInCents =
    typeof property[
      'listPriceInCents'
    ] === 'number'
      ? property[
        'listPriceInCents'
      ]
      : 0;

  return {
    stateCode:
      property['state'],

    property,

    purchase: {
      purchasePriceInCents:
        listPriceInCents,

      financingType:
        'unselected',

      loanType:
        'not_applicable',

      preapprovalProvided:
        false,

      proofOfFundsProvided:
        false,

      loanRequiredToCompletePurchase:
        false,

      lenderAppraisalAnticipated:
        false,
    },

    existingPropertySale: {
      required: false,

      status:
        'not_applicable',

      approvedAddendumRequired:
        false,
    },

    deposits: {
      dueDiligenceFeeInCents: 0,

      dueDiligenceFeePaymentMethod:
        'not_applicable',

      dueDiligenceFeeDeliveryDeadline:
        '',

      dueDiligenceExpiration:
        '',

      initialEarnestMoneyInCents: 0,

      initialEarnestMoneyPaymentMethod:
        'not_applicable',

      initialEarnestMoneyDeliveryDeadline:
        '',

      additionalEarnestMoneyInCents: 0,

      additionalEarnestMoneyPaymentMethod:
        'not_applicable',

      escrowAgentName: '',
    },

    investigations: {
      generalHomeInspection:
        'not_applicable',

      woodDestroyingInsectInspection:
        'not_applicable',

      radonTesting:
        'not_applicable',

      wellWaterTesting:
        'not_applicable',

      septicInspection:
        'not_applicable',

      survey:
        'not_applicable',

      appraisal:
        'not_applicable',

      insuranceReview:
        'not_applicable',

      floodZoneReview:
        'not_applicable',

      environmentalReview:
        'not_applicable',

      hoaDocumentReview:
        'not_applicable',

      titleAndCovenantReview:
        'not_applicable',

      otherInvestigationRequested:
        false,
    },

    concessions: {
      sellerPaidBuyerExpensesRequested:
        false,

      sellerPaidBuyerExpensesInCents:
        0,

      homeWarrantyRequested:
        false,

      homeWarrantyInCents: 0,

      buyerAgentCompensationRequested:
        false,

      buyerAgentCompensationInCents:
        0,

      otherConcessionRequested:
        false,

      otherConcessionInCents: 0,
    },

    propertyInclusions: {
      items: [],

      additionalPersonalPropertyRequested:
        false,

      leasedEquipmentPresent:
        false,

      leasedEquipmentObligationsAccepted:
        false,
    },

    settlement: {
      settlementDate: '',
      closingDate: '',

      possessionTiming:
        'at_closing',

      possessionAddendumRequired:
        false,

      proposedDeedName:
        buyer.proposedDeedName ??
        buyer.legalName,
    },

    disclosures: [],

    addenda: [],

    additionalTermRequests: [],

    delivery: {
      expiresAt: '',

      timeZone:
        'America/New_York',

      buyerDeliveryEmail:
        buyer.email,

      sellerDeliveryEmail:
        seller.email,

      electronicDeliveryAuthorized:
        false,
    },
  };
}


async function loadUserProfile(
  userUid: string
): Promise<OfferUserProfile | null> {
  const snapshot =
    await adminFirestore
      .collection('users')
      .doc(userUid)
      .get();

  if (!snapshot.exists) {
    return null;
  }

  const data =
    snapshot.data();

  if (!data) {
    return null;
  }

  return {
    uid: userUid,

    firstName:
      readOptionalString(
        data,
        'firstName'
      ) ?? '',

    lastName:
      readOptionalString(
        data,
        'lastName'
      ) ?? '',

    email:
      readOptionalString(
        data,
        'email'
      ) ?? '',

    phone:
      readOptionalString(
        data,
        'phone'
      ) ?? '',

    addressLine1:
      readOptionalString(
        data,
        'addressLine1'
      ),

    addressLine2:
      readOptionalString(
        data,
        'addressLine2'
      ),

    city:
      readOptionalString(
        data,
        'city'
      ),

    state:
      readOptionalString(
        data,
        'state'
      ),

    zipCode:
      readOptionalString(
        data,
        'zipCode'
      ),

    country:
      readOptionalString(
        data,
        'country'
      ),

    identityStatus:
      readFirstOptionalString(
        data,
        [
          'identityStatus',
          'identityVerificationStatus',
        ]
      ),

    stripeIdentityVerificationSessionId:
      readFirstOptionalString(
        data,
        [
          'stripeIdentityVerificationSessionId',
          'identityVerificationSessionId',
        ]
      ),

    verifiedFirstName:
      readOptionalString(
        data,
        'verifiedFirstName'
      ),

    verifiedMiddleName:
      readOptionalString(
        data,
        'verifiedMiddleName'
      ),

    verifiedLastName:
      readOptionalString(
        data,
        'verifiedLastName'
      ),

    identityVerifiedAt:
      data['identityVerifiedAt'],
  };
}


function createReferenceNumber(
  stateCode: string,
  offerUid: string,
  createdAt: Date
): string {
  const year =
    createdAt
      .getUTCFullYear()
      .toString();

  const month =
    (createdAt.getUTCMonth() + 1)
      .toString()
      .padStart(2, '0');

  const day =
    createdAt
      .getUTCDate()
      .toString()
      .padStart(2, '0');

  const suffix =
    offerUid
      .replace(
        /[^A-Za-z0-9]/g,
        ''
      )
      .slice(0, 8)
      .toUpperCase();

  return [
    'NS',
    stateCode,
    `${year}${month}${day}`,
    suffix,
  ].join('-');
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


function readRequiredString(
  data: Record<string, unknown>,
  fieldName: string,
  errorMessage: string
): string {
  const value =
    data[fieldName];

  if (
    typeof value !== 'string' ||
    value.trim().length === 0
  ) {
    throw new HttpsError(
      'failed-precondition',
      errorMessage
    );
  }

  return value.trim();
}


function readOptionalString(
  data: Record<string, unknown>,
  fieldName: string
): string | undefined {
  const value =
    data[fieldName];

  if (typeof value !== 'string') {
    return undefined;
  }

  const normalizedValue =
    value.trim();

  return normalizedValue.length > 0
    ? normalizedValue
    : undefined;
}


function readFirstOptionalString(
  data: Record<string, unknown>,
  fieldNames: string[]
): string | undefined {
  for (const fieldName of fieldNames) {
    const value =
      readOptionalString(
        data,
        fieldName
      );

    if (value) {
      return value;
    }
  }

  return undefined;
}


function removeUndefinedValues<T>(
  value: T
): T {
  if (Array.isArray(value)) {
    return value
      .map(
        item =>
          removeUndefinedValues(item)
      ) as T;
  }

  if (
    value !== null &&
    typeof value === 'object' &&
    !(value instanceof Timestamp) &&
    !(value instanceof FieldValue)
  ) {
    return Object.fromEntries(
      Object.entries(
        value as Record<string, unknown>
      )
        .filter(
          ([, nestedValue]) =>
            nestedValue !== undefined
        )
        .map(
          ([key, nestedValue]) => [
            key,
            removeUndefinedValues(
              nestedValue
            ),
          ]
        )
    ) as T;
  }

  return value;
}