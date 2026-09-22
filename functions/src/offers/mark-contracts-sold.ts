import {
  Timestamp,
} from 'firebase-admin/firestore';

import * as logger from
  'firebase-functions/logger';

import {
  onSchedule,
} from 'firebase-functions/v2/scheduler';

import {
  adminFirestore,
} from '../shared/firebase-admin';

import {
  FUNCTION_REGION,
} from '../shared/function-options';

import {
  addOfferNotificationToTransaction,
} from './offer-notification.service';

import type {
  OfferDocument,
} from './offer-types';


interface EffectiveContractDocument {
  offerUid: string;
  offerVersionUid: string;
  offerVersionNumber: number;
  listingUid: string;
  referenceNumber: string;

  buyerUids: string[];
  sellerUids: string[];

  status: string;
  transactionPhase: string;

  timeZone?: string;

  anticipatedClosingDate: string;
}


const MAXIMUM_CONTRACTS_PER_RUN = 200;


/*
 * Changes an under-contract listing to sold when its
 * contract closing date arrives.
 *
 * A seller's manual status change takes priority. The job
 * will not mark a listing sold unless that listing still
 * identifies this contract as its active contract.
 */
export const markContractsSold =
  onSchedule(
    {
      schedule:
        'every 60 minutes',
      timeZone:
        'UTC',
      region:
        FUNCTION_REGION,
      maxInstances: 1,
      timeoutSeconds: 300,
      memory: '256MiB',
    },
    async () => {
      const runAt =
        new Date();

      const candidatesSnapshot =
        await adminFirestore
          .collection('contracts')
          .where(
            'status',
            '==',
            'effective'
          )
          .limit(
            MAXIMUM_CONTRACTS_PER_RUN
          )
          .get();

      let soldCount = 0;
      let skippedCount = 0;
      let failedCount = 0;

      for (
        const candidateSnapshot of
        candidatesSnapshot.docs
      ) {
        try {
          const markedSold =
            await markContractSoldIfDue(
              candidateSnapshot.id,
              runAt
            );

          if (markedSold) {
            soldCount += 1;
          } else {
            skippedCount += 1;
          }
        } catch (error) {
          failedCount += 1;

          logger.error(
            'Unable to mark contract listing sold.',
            {
              contractUid:
                candidateSnapshot.id,
              error,
            }
          );
        }
      }

      logger.info(
        'Contract closing-date status run completed.',
        {
          runAt:
            runAt.toISOString(),

          candidateCount:
            candidatesSnapshot.size,
          soldCount,
          skippedCount,
          failedCount,
        }
      );
    }
  );


async function markContractSoldIfDue(
  contractUid: string,
  runAt: Date
): Promise<boolean> {
  const contractReference =
    adminFirestore
      .collection('contracts')
      .doc(contractUid);

  return adminFirestore.runTransaction(
    async transaction => {
      const contractSnapshot =
        await transaction.get(
          contractReference
        );

      if (!contractSnapshot.exists) {
        return false;
      }

      const contract =
        contractSnapshot.data() as
          EffectiveContractDocument;

      const contractTimeZone =
        resolveContractTimeZone(
          contract.timeZone
        );

      const contractDate =
        getDateKey(
          runAt,
          contractTimeZone
        );

      if (
        contract.status !== 'effective' ||
        !isDateKey(
          contract.anticipatedClosingDate
        ) ||
        contract.anticipatedClosingDate >
          contractDate
      ) {
        return false;
      }

      const listingUid =
        requireIdentifier(
          contract.listingUid,
          'listingUid'
        );

      const offerUid =
        requireIdentifier(
          contract.offerUid,
          'offerUid'
        );

      const offerVersionUid =
        requireIdentifier(
          contract.offerVersionUid,
          'offerVersionUid'
        );

      const listingReference =
        adminFirestore
          .collection('listings')
          .doc(listingUid);

      const offerReference =
        adminFirestore
          .collection('offers')
          .doc(offerUid);

      const [
        listingSnapshot,
        offerSnapshot,
      ] = await Promise.all([
        transaction.get(
          listingReference
        ),

        transaction.get(
          offerReference
        ),
      ]);

      if (!listingSnapshot.exists) {
        throw new Error(
          'The contract property listing could not be found.'
        );
      }

      if (!offerSnapshot.exists) {
        throw new Error(
          'The accepted offer could not be found.'
        );
      }

      const listingStatus =
        listingSnapshot.get('status');

      const activeContractUid =
        listingSnapshot.get(
          'activeContractUid'
        );

      if (
        activeContractUid !== contractUid ||
        (
          listingStatus !==
            'under_contract' &&
          listingStatus !== 'sold'
        )
      ) {
        return false;
      }

      const offer =
        offerSnapshot.data() as
          OfferDocument;

      const now =
        Timestamp.now();

      transaction.update(
        contractReference,
        {
          status: 'closed',
          transactionPhase: 'closed',
          closedAt: now,
          updatedAt: now,
        }
      );

      transaction.update(
        offerReference,
        {
          'contract.status': 'closed',
          'contract.transactionPhase':
            'closed',
          'contract.closedAt': now,
          lastActivityAt: now,
          updatedAt: now,
        }
      );

      if (
        listingStatus ===
        'under_contract'
      ) {
        transaction.update(
          listingReference,
          {
            status: 'sold',
            acceptingOffers: false,
            soldAt: now,
            updatedAt: now,
          }
        );
      }

      const recipientUids =
        Array.from(
          new Set([
            ...contract.buyerUids,
            ...contract.sellerUids,
          ])
        )
          .filter(Boolean);

      const propertyAddress =
        formatPropertyAddress(
          offer
        );

      for (
        const recipientUid of
        recipientUids
      ) {
        addOfferNotificationToTransaction(
          transaction,
          adminFirestore,
          {
            recipientUid,
            actorUid: null,
            offerUid,
            offerVersionUid,
            listingUid,
            type:
              'property_marked_sold',
            title:
              'Property marked sold',
            message:
              `${propertyAddress} was marked sold on the scheduled closing date. The seller can update the listing if the closing date changed or the transaction did not close.`,
            propertyAddress,
            channels: [
              'in_app',
              'email',
            ],
            eventKey:
              'scheduled-closing-date',
            metadata: {
              referenceNumber:
                contract.referenceNumber,
              versionNumber:
                contract.offerVersionNumber,
              anticipatedClosingDate:
                contract
                  .anticipatedClosingDate,
            },
          }
        );
      }

      return true;
    }
  );
}


function getDateKey(
  date: Date,
  timeZone: string
): string {
  const parts =
    new Intl.DateTimeFormat(
      'en-CA',
      {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone,
      }
    ).formatToParts(date);

  const year =
    parts.find(
      part => part.type === 'year'
    )?.value;

  const month =
    parts.find(
      part => part.type === 'month'
    )?.value;

  const day =
    parts.find(
      part => part.type === 'day'
    )?.value;

  if (!year || !month || !day) {
    throw new Error(
      `The date could not be determined for ${timeZone}.`
    );
  }

  return `${year}-${month}-${day}`;
}


function resolveContractTimeZone(
  value: unknown
): string {
  /*
   * Existing North Carolina contracts created before
   * timezone-aware milestones do not contain this field.
   */
  const timeZone =
    typeof value === 'string' &&
    value.trim().length > 0
      ? value.trim()
      : 'America/New_York';

  try {
    new Intl.DateTimeFormat(
      'en-US',
      {
        timeZone,
      }
    ).format(
      new Date(0)
    );
  } catch {
    throw new Error(
      `The contract timezone ${timeZone} is invalid.`
    );
  }

  return timeZone;
}


function isDateKey(
  value: unknown
): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  );
}


function formatPropertyAddress(
  offer: OfferDocument
): string {
  return [
    offer.property.addressLine1,
    offer.property.addressLine2,
    offer.property.city,
    offer.property.state,
    offer.property.zipCode,
  ]
    .filter(Boolean)
    .join(', ');
}


function requireIdentifier(
  value: unknown,
  fieldName: string
): string {
  if (
    typeof value !== 'string' ||
    !/^[A-Za-z0-9_-]{1,160}$/.test(
      value
    )
  ) {
    throw new Error(
      `${fieldName} is invalid.`
    );
  }

  return value;
}

