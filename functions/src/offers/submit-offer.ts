import {
  HttpsError,
  onCall,
} from 'firebase-functions/v2/https';

import {
  FieldValue,
  Timestamp,
} from 'firebase-admin/firestore';

import {
  adminFirestore,
} from '../shared/firebase-admin';

import {
  callableFunctionOptions,
} from '../shared/function-options';

import {
  verifyOfferSubmissionEligibility,
} from './verify-offer-eligibility';

import type {
  OfferDocument,
  OfferVersionDocument,
  SubmitOfferData,
  SubmitOfferResponse,
} from './offer-types';


/*
 * Validates and freezes the current offer or counteroffer
 * version before electronic signatures begin.
 *
 * Once submitted, the version can never be edited.
 */
export const submitOffer =
  onCall<
    SubmitOfferData,
    Promise<SubmitOfferResponse>
  >(
    callableFunctionOptions,
    async request => {
      const userUid =
        request.auth?.uid;

      if (!userUid) {
        throw new HttpsError(
          'unauthenticated',
          'You must sign in before submitting an offer.'
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

      const offerReference =
        adminFirestore
          .collection('offers')
          .doc(offerUid);

      const versionReference =
        offerReference
          .collection('versions')
          .doc(offerVersionUid);

      const [
        initialOfferSnapshot,
        initialVersionSnapshot,
      ] = await Promise.all([
        offerReference.get(),
        versionReference.get(),
      ]);

      if (!initialOfferSnapshot.exists) {
        throw new HttpsError(
          'not-found',
          'The offer could not be found.'
        );
      }

      if (!initialVersionSnapshot.exists) {
        throw new HttpsError(
          'not-found',
          'The offer version could not be found.'
        );
      }

      const initialOffer =
        initialOfferSnapshot.data() as
          OfferDocument;

      /*
       * This also verifies that the listing remains active,
       * is accepting offers and is still owned by someone
       * other than the buyer.
       */
      await verifyOfferSubmissionEligibility(
        initialOffer.listingUid,
        initialOffer.primaryBuyerUid
      );

      await adminFirestore.runTransaction(
        async transaction => {
          const listingReference =
            adminFirestore
              .collection('listings')
              .doc(
                initialOffer.listingUid
              );

          const [
            offerSnapshot,
            versionSnapshot,
            listingSnapshot,
          ] = await Promise.all([
            transaction.get(
              offerReference
            ),

            transaction.get(
              versionReference
            ),

            transaction.get(
              listingReference
            ),
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

          if (!listingSnapshot.exists) {
            throw new HttpsError(
              'not-found',
              'The property listing could not be found.'
            );
          }

          const offer =
            offerSnapshot.data() as
              OfferDocument;

          const version =
            versionSnapshot.data() as
              OfferVersionDocument;

                   const listingData =
            listingSnapshot.data();

          if (!listingData) {
            throw new HttpsError(
              'data-loss',
              'The property listing contains no data.'
            );
          }

          verifySubmissionAccess(
            offer,
            version,
            userUid,
            offerVersionUid
          );

          verifyListingStillActive(
            listingData
          );

          validateVersionForSubmission(
            offer,
            version
          );

          const now =
            Timestamp.now();

          transaction.update(
            versionReference,
            {
              status:
                'awaiting_signatures',

              immutable: true,

              lockedAt: now,
              lockedByUid: userUid,

              submittedAt: now,
              updatedAt: now,

              statusHistory:
                FieldValue.arrayUnion({
                  fromStatus: 'draft',

                  toStatus:
                    'awaiting_signatures',

                  action: 'submitted',

                  actorUid: userUid,

                  actorRole:
                    version.initiatedBy,

                  note:
                    'Offer version locked for document generation and electronic signatures.',

                  occurredAt: now,
                }),
            }
          );

          transaction.update(
            offerReference,
            {
              status: 'submitted',

              submittedAt:
                offer.submittedAt ??
                now,

              lastActivityAt: now,
              updatedAt: now,

              statusHistory:
                FieldValue.arrayUnion({
                  fromStatus:
                    offer.status,

                  toStatus:
                    'submitted',

                  action:
                    'submitted',

                  actorUid: userUid,

                  actorRole:
                    version.initiatedBy,

                  offerVersionUid,
                  offerVersionNumber:
                    version.versionNumber,

                  occurredAt: now,
                }),
            }
          );
        }
      );

      return {
        success: true,
      };
    }
  );


function verifySubmissionAccess(
  offer: OfferDocument,
  version: OfferVersionDocument,
  userUid: string,
  offerVersionUid: string
): void {
  if (
    offer.currentVersionUid !==
    offerVersionUid
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This is no longer the current offer version. Refresh the offer before submitting.'
    );
  }

  if (
    version.status !== 'draft' ||
    version.immutable
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This offer version has already been submitted or locked.'
    );
  }

  if (
    version.initiatedByUid !==
    userUid
  ) {
    throw new HttpsError(
      'permission-denied',
      'Only the party who created this version may submit it.'
    );
  }

  const authorized =
    version.initiatedBy === 'buyer'
      ? offer.buyerUids.includes(
        userUid
      )
      : offer.sellerUids.includes(
        userUid
      );

  if (!authorized) {
    throw new HttpsError(
      'permission-denied',
      'You do not have permission to submit this offer version.'
    );
  }
}


function verifyListingStillActive(
  listingData:
    Record<string, unknown>
): void {
  const status =
    listingData['status'];

  if (
    typeof status !== 'string' ||
    status.trim().toLowerCase() !==
      'active'
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This property is no longer active.'
    );
  }

  if (
    listingData[
      'acceptingOffers'
    ] === false
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This property is not currently accepting offers.'
    );
  }
}


function validateVersionForSubmission(
  offer: OfferDocument,
  version: OfferVersionDocument
): void {
  const terms =
    requireObject(
      version.terms,
      'The offer terms are missing.'
    );

  const stateCode =
    readRequiredString(
      terms,
      'stateCode',
      'The contract state is required.'
    )
      .toUpperCase();

  if (stateCode !== offer.stateCode) {
    throw new HttpsError(
      'failed-precondition',
      'The offer state does not match the listing state.'
    );
  }

  if (stateCode !== 'NC') {
    throw new HttpsError(
      'failed-precondition',
      'NavStreet offers are currently available only for North Carolina properties.'
    );
  }

  validateParties(
    version
  );

  validateProperty(
    terms,
    offer
  );

  validatePurchaseTerms(
    terms
  );

  validateDeposits(
    terms
  );

  validateSettlement(
    terms
  );

  validateDelivery(
    terms,
    version
  );

  validateDisclosures(
    terms
  );

  validateAdditionalTerms(
    terms
  );

  validateChronology(
    terms
  );
}


function validateParties(
  version: OfferVersionDocument
): void {
  if (version.buyers.length === 0) {
    throw new HttpsError(
      'failed-precondition',
      'At least one buyer is required.'
    );
  }

  if (version.sellers.length === 0) {
    throw new HttpsError(
      'failed-precondition',
      'At least one seller is required.'
    );
  }

  for (
    const party of [
      ...version.buyers,
      ...version.sellers,
    ]
  ) {
    if (
      !party.legalName ||
      party.legalName.trim().length === 0
    ) {
      throw new HttpsError(
        'failed-precondition',
        'Every party must have a legal name.'
      );
    }

    if (!isValidEmail(party.email)) {
      throw new HttpsError(
        'failed-precondition',
        `${party.legalName} must have a valid email address.`
      );
    }

    if (
      !party.phone ||
      party.phone.trim().length === 0
    ) {
      throw new HttpsError(
        'failed-precondition',
        `${party.legalName} must have a phone number.`
      );
    }

    const address =
      party.mailingAddress;

    if (
      !address.addressLine1 ||
      !address.city ||
      !address.state ||
      !address.zipCode ||
      !address.country
    ) {
      throw new HttpsError(
        'failed-precondition',
        `${party.legalName} must have a complete mailing address.`
      );
    }
  }

  /*
   * The initiating party must be identity verified before
   * the document is generated for signature.
   */
  const initiatingParties =
    version.initiatedBy === 'buyer'
      ? version.buyers
      : version.sellers;

  for (
    const party of initiatingParties
  ) {
    if (
      party.requiredSigner &&
      party.identityVerification
        .status !== 'verified'
    ) {
      throw new HttpsError(
        'failed-precondition',
        `${party.legalName} must complete identity verification before submitting this offer.`
      );
    }
  }
}


function validateProperty(
  terms: Record<string, unknown>,
  offer: OfferDocument
): void {
  const property =
    requireObject(
      terms['property'],
      'The property information is missing.'
    );

  const listingUid =
    readRequiredString(
      property,
      'listingUid',
      'The property listing identifier is missing.'
    );

  if (listingUid !== offer.listingUid) {
    throw new HttpsError(
      'failed-precondition',
      'The property information does not match this offer.'
    );
  }

  readRequiredString(
    property,
    'addressLine1',
    'The property street address is required.'
  );

  readRequiredString(
    property,
    'city',
    'The property city is required.'
  );

  readRequiredString(
    property,
    'state',
    'The property state is required.'
  );

  readRequiredString(
    property,
    'zipCode',
    'The property ZIP code is required.'
  );

  readRequiredString(
    property,
    'county',
    'The property county is required.'
  );
}


function validatePurchaseTerms(
  terms: Record<string, unknown>
): void {
  const purchase =
    requireObject(
      terms['purchase'],
      'Purchase terms are required.'
    );

  const purchasePrice =
    readRequiredInteger(
      purchase,
      'purchasePriceInCents',
      'Enter a valid purchase price.'
    );

  if (purchasePrice <= 0) {
    throw new HttpsError(
      'failed-precondition',
      'The purchase price must be greater than zero.'
    );
  }

  const financingType =
    readRequiredString(
      purchase,
      'financingType',
      'Select cash or financing.'
    );

  if (
    financingType !== 'cash' &&
    financingType !== 'financing'
  ) {
    throw new HttpsError(
      'failed-precondition',
      'Select cash or financing.'
    );
  }

  if (financingType === 'financing') {
    const loanType =
      readRequiredString(
        purchase,
        'loanType',
        'Select a loan type.'
      );

    if (
      loanType ===
      'not_applicable'
    ) {
      throw new HttpsError(
        'failed-precondition',
        'Select a loan type.'
      );
    }

    const loanAmount =
      readRequiredInteger(
        purchase,
        'proposedLoanAmountInCents',
        'Enter the proposed loan amount.'
      );

    if (loanAmount <= 0) {
      throw new HttpsError(
        'failed-precondition',
        'The proposed loan amount must be greater than zero.'
      );
    }
  }
}


function validateDeposits(
  terms: Record<string, unknown>
): void {
  const deposits =
    requireObject(
      terms['deposits'],
      'Deposit and due-diligence terms are required.'
    );

  validateNonNegativeMoney(
    deposits,
    'dueDiligenceFeeInCents',
    'The due-diligence fee'
  );

  validateNonNegativeMoney(
    deposits,
    'initialEarnestMoneyInCents',
    'The initial earnest-money deposit'
  );

  const additionalEarnestMoney =
    validateNonNegativeMoney(
      deposits,
      'additionalEarnestMoneyInCents',
      'The additional earnest-money deposit'
    );

  requireValidDateTime(
    deposits[
      'dueDiligenceFeeDeliveryDeadline'
    ],
    'Enter a valid due-diligence fee delivery deadline.'
  );

  requireValidDateTime(
    deposits[
      'dueDiligenceExpiration'
    ],
    'Enter a valid due-diligence expiration date and time.'
  );

  requireValidDateTime(
    deposits[
      'initialEarnestMoneyDeliveryDeadline'
    ],
    'Enter a valid initial earnest-money delivery deadline.'
  );

  if (
    additionalEarnestMoney > 0
  ) {
    requireValidDateTime(
      deposits[
        'additionalEarnestMoneyDeliveryDeadline'
      ],
      'Enter a valid additional earnest-money delivery deadline.'
    );
  }

  readRequiredString(
    deposits,
    'escrowAgentName',
    'An escrow agent is required.'
  );
}


function validateSettlement(
  terms: Record<string, unknown>
): void {
  const settlement =
    requireObject(
      terms['settlement'],
      'Settlement terms are required.'
    );

  requireValidDate(
    settlement['settlementDate'],
    'Enter a valid settlement date.'
  );

  requireValidDate(
    settlement['closingDate'],
    'Enter a valid closing date.'
  );

  readRequiredString(
    settlement,
    'proposedDeedName',
    'Enter the proposed deed recipient name.'
  );

  const possessionTiming =
    readRequiredString(
      settlement,
      'possessionTiming',
      'Select when possession will be delivered.'
    );

  if (
    possessionTiming !==
      'at_closing'
  ) {
    requireValidDate(
      settlement['possessionDate'],
      'Enter a valid possession date.'
    );

    readRequiredString(
      settlement,
      'possessionTime',
      'Enter a possession time.'
    );
  }
}


function validateDelivery(
  terms: Record<string, unknown>,
  version: OfferVersionDocument
): void {
  const delivery =
    requireObject(
      terms['delivery'],
      'Offer delivery terms are required.'
    );

  const expiresAt =
    requireValidDateTime(
      delivery['expiresAt'],
      'Enter a valid offer expiration date and time.'
    );

  if (
    expiresAt.getTime() <=
    Date.now()
  ) {
    throw new HttpsError(
      'failed-precondition',
      'The offer expiration must be in the future.'
    );
  }

  if (
    version.expiresAt !==
    delivery['expiresAt']
  ) {
    throw new HttpsError(
      'failed-precondition',
      'The offer expiration values do not match. Save the offer and try again.'
    );
  }

  if (
    delivery[
      'electronicDeliveryAuthorized'
    ] !== true
  ) {
    throw new HttpsError(
      'failed-precondition',
      'Electronic delivery must be authorized before submission.'
    );
  }

  if (
    !isValidEmail(
      delivery[
        'buyerDeliveryEmail'
      ]
    ) ||
    !isValidEmail(
      delivery[
        'sellerDeliveryEmail'
      ]
    )
  ) {
    throw new HttpsError(
      'failed-precondition',
      'Valid buyer and seller delivery emails are required.'
    );
  }
}


function validateDisclosures(
  terms: Record<string, unknown>
): void {
  const disclosures =
    terms['disclosures'];

  if (!Array.isArray(disclosures)) {
    throw new HttpsError(
      'failed-precondition',
      'The offer disclosures are invalid.'
    );
  }

  for (
    const disclosure of disclosures
  ) {
    const disclosureData =
      requireObject(
        disclosure,
        'An offer disclosure is invalid.'
      );

    if (
      disclosureData['required'] ===
        true &&
      (
        disclosureData['received'] !==
          true ||
        disclosureData[
          'acknowledged'
        ] !== true
      )
    ) {
      throw new HttpsError(
        'failed-precondition',
        `${readRequiredString(
          disclosureData,
          'title',
          'A required disclosure is incomplete.'
        )} must be received and acknowledged.`
      );
    }
  }

  const addenda =
    terms['addenda'];

  if (!Array.isArray(addenda)) {
    throw new HttpsError(
      'failed-precondition',
      'The offer addenda are invalid.'
    );
  }

  for (const addendum of addenda) {
    const addendumData =
      requireObject(
        addendum,
        'An offer addendum is invalid.'
      );

    if (
      addendumData['required'] ===
        true &&
      addendumData['selected'] !==
        true
    ) {
      throw new HttpsError(
        'failed-precondition',
        `${readRequiredString(
          addendumData,
          'title',
          'A required addendum is incomplete.'
        )} is required.`
      );
    }
  }
}


function validateAdditionalTerms(
  terms: Record<string, unknown>
): void {
  const requests =
    terms[
      'additionalTermRequests'
    ];

  if (!Array.isArray(requests)) {
    throw new HttpsError(
      'failed-precondition',
      'The additional-term requests are invalid.'
    );
  }

  for (const request of requests) {
    const requestData =
      requireObject(
        request,
        'An additional-term request is invalid.'
      );

    const resolution =
      readRequiredString(
        requestData,
        'resolution',
        'An additional-term request has not been resolved.'
      );

    if (
      resolution ===
        'pending_review' ||
      resolution ===
        'attorney_language_required'
    ) {
      throw new HttpsError(
        'failed-precondition',
        'Every additional-term request must be resolved before submission.'
      );
    }

    if (
      resolution ===
        'attorney_language_received' &&
      (
        requestData[
          'approvedByBuyer'
        ] !== true ||
        requestData[
          'approvedBySeller'
        ] !== true
      )
    ) {
      throw new HttpsError(
        'failed-precondition',
        'Attorney-prepared language must be approved by both parties.'
      );
    }
  }
}


function validateChronology(
  terms: Record<string, unknown>
): void {
  const deposits =
    requireObject(
      terms['deposits'],
      'Deposit terms are required.'
    );

  const settlement =
    requireObject(
      terms['settlement'],
      'Settlement terms are required.'
    );

  const delivery =
    requireObject(
      terms['delivery'],
      'Delivery terms are required.'
    );

  const offerExpiration =
    requireValidDateTime(
      delivery['expiresAt'],
      'The offer expiration is invalid.'
    );

  const dueDiligenceExpiration =
    requireValidDateTime(
      deposits[
        'dueDiligenceExpiration'
      ],
      'The due-diligence expiration is invalid.'
    );

  const settlementDate =
    requireValidDate(
      settlement['settlementDate'],
      'The settlement date is invalid.'
    );

  const closingDate =
    requireValidDate(
      settlement['closingDate'],
      'The closing date is invalid.'
    );

  if (
    offerExpiration.getTime() >=
    dueDiligenceExpiration.getTime()
  ) {
    throw new HttpsError(
      'failed-precondition',
      'The offer must expire before the proposed due-diligence period ends.'
    );
  }

  if (
    dueDiligenceExpiration.getTime() >=
    settlementDate.getTime()
  ) {
    throw new HttpsError(
      'failed-precondition',
      'The due-diligence period must end before settlement.'
    );
  }

  if (
    closingDate.getTime() <
    settlementDate.getTime()
  ) {
    throw new HttpsError(
      'failed-precondition',
      'Closing cannot occur before settlement.'
    );
  }
}


function validateNonNegativeMoney(
  data: Record<string, unknown>,
  fieldName: string,
  label: string
): number {
  const amount =
    readRequiredInteger(
      data,
      fieldName,
      `${label} must be a valid amount.`
    );

  if (amount < 0) {
    throw new HttpsError(
      'failed-precondition',
      `${label} cannot be negative.`
    );
  }

  return amount;
}


function requireValidDateTime(
  value: unknown,
  message: string
): Date {
  if (
    typeof value !== 'string' ||
    !/(Z|[+-]\d{2}:\d{2})$/.test(
      value
    )
  ) {
    throw new HttpsError(
      'failed-precondition',
      message
    );
  }

  const parsedDate =
    new Date(value);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    throw new HttpsError(
      'failed-precondition',
      message
    );
  }

  return parsedDate;
}


function requireValidDate(
  value: unknown,
  message: string
): Date {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    throw new HttpsError(
      'failed-precondition',
      message
    );
  }

  const parsedDate =
    new Date(
      `${value}T12:00:00Z`
    );

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    throw new HttpsError(
      'failed-precondition',
      message
    );
  }

  return parsedDate;
}


function requireObject(
  value: unknown,
  message: string
): Record<string, unknown> {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    throw new HttpsError(
      'failed-precondition',
      message
    );
  }

  return value as
    Record<string, unknown>;
}


function readRequiredString(
  data: Record<string, unknown>,
  fieldName: string,
  message: string
): string {
  const value =
    data[fieldName];

  if (
    typeof value !== 'string' ||
    value.trim().length === 0
  ) {
    throw new HttpsError(
      'failed-precondition',
      message
    );
  }

  return value.trim();
}


function readRequiredInteger(
  data: Record<string, unknown>,
  fieldName: string,
  message: string
): number {
  const value =
    data[fieldName];

  if (
    typeof value !== 'number' ||
    !Number.isInteger(value)
  ) {
    throw new HttpsError(
      'failed-precondition',
      message
    );
  }

  return value;
}


function isValidEmail(
  value: unknown
): boolean {
  return (
    typeof value === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      value.trim()
    )
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