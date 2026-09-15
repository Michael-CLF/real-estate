import {
  Timestamp,
} from 'firebase-admin/firestore';

import {
  HttpsError,
  onCall,
} from 'firebase-functions/v2/https';

import {
  adminFirestore,
} from '../shared/firebase-admin';

import {
  callableFunctionOptions,
} from '../shared/function-options';

import {
  addOfferNotificationToTransaction,
} from './offer-notification.service';

import type {
  OfferDocument,
} from './offer-types';


interface ConfirmPropertySoldData {
  offerUid: string;
}


interface ConfirmPropertySoldResponse {
  success: true;
  listingUid: string;
  alreadySold: boolean;
}


export const confirmPropertySold =
  onCall<
    ConfirmPropertySoldData,
    Promise<ConfirmPropertySoldResponse>
  >(
    callableFunctionOptions,
    async request => {
      const sellerUid =
        request.auth?.uid;

      if (!sellerUid) {
        throw new HttpsError(
          'unauthenticated',
          'You must sign in before confirming a property sale.'
        );
      }

      const offerUid =
        requireIdentifier(
          request.data?.offerUid,
          'offerUid'
        );

      const offerReference =
        adminFirestore
          .collection('offers')
          .doc(offerUid);

      return adminFirestore.runTransaction(
        async transaction => {
          const offerSnapshot =
            await transaction.get(
              offerReference
            );

          if (!offerSnapshot.exists) {
            throw new HttpsError(
              'not-found',
              'The accepted offer could not be found.'
            );
          }

          const offer =
            offerSnapshot.data() as
              OfferDocument;

          if (
            !offer.sellerUids.includes(
              sellerUid
            )
          ) {
            throw new HttpsError(
              'permission-denied',
              'Only the property seller can confirm that the closing was completed.'
            );
          }

          if (
            offer.status !==
              'converted_to_contract' ||
            !offer.contract
          ) {
            throw new HttpsError(
              'failed-precondition',
              'This offer has not become an effective contract.'
            );
          }

          const contract =
            offer.contract;

          const listingUid =
            requireIdentifier(
              offer.listingUid,
              'listingUid'
            );

          const contractUid =
            requireIdentifier(
              contract.contractUid,
              'contractUid'
            );

          const listingReference =
            adminFirestore
              .collection('listings')
              .doc(listingUid);

          const contractReference =
            adminFirestore
              .collection('contracts')
              .doc(contractUid);

          const [
            listingSnapshot,
            contractSnapshot,
          ] = await Promise.all([
            transaction.get(
              listingReference
            ),
            transaction.get(
              contractReference
            ),
          ]);

          if (!listingSnapshot.exists) {
            throw new HttpsError(
              'not-found',
              'The property listing could not be found.'
            );
          }

          if (!contractSnapshot.exists) {
            throw new HttpsError(
              'not-found',
              'The effective contract could not be found.'
            );
          }

          const listingStatus =
            listingSnapshot.get('status');

          const activeContractUid =
            listingSnapshot.get(
              'activeContractUid'
            );

          if (
            listingStatus === 'sold' &&
            activeContractUid === contractUid
          ) {
            return {
              success: true,
              listingUid,
              alreadySold: true,
            };
          }

          if (
            listingStatus !==
              'under_contract' ||
            activeContractUid !==
              contractUid
          ) {
            throw new HttpsError(
              'failed-precondition',
              'This listing is not associated with the active contract.'
            );
          }

          const contractStatus =
            contractSnapshot.get('status');

          if (contractStatus !== 'effective') {
            throw new HttpsError(
              'failed-precondition',
              'Only an effective contract can be confirmed as sold.'
            );
          }

          const now = Timestamp.now();

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

          transaction.update(
            listingReference,
            {
              status: 'sold',
              acceptingOffers: false,
              soldAt: now,
              updatedAt: now,
            }
          );

          const propertyAddress =
            formatPropertyAddress(
              offer
            );

          const recipientUids =
            Array.from(
              new Set([
                ...offer.buyerUids,
                ...offer.sellerUids,
              ])
            ).filter(Boolean);

          for (
            const recipientUid of
              recipientUids
          ) {
            addOfferNotificationToTransaction(
              transaction,
              adminFirestore,
              {
                recipientUid,
                actorUid: sellerUid,
                offerUid,
                offerVersionUid:
                  contract
                    .acceptedOfferVersionUid,
                listingUid,
                type:
                  'property_marked_sold',
                title:
                  'Property marked sold',
                message:
                  `${propertyAddress} was marked sold after the seller confirmed that closing was completed.`,
                propertyAddress,
                channels: [
                  'in_app',
                  'email',
                ],
                eventKey:
                  `seller-confirmed-${contractUid}`,
                metadata: {
                  referenceNumber:
                    offer.referenceNumber,
                  contractUid,
                },
              }
            );
          }

          return {
            success: true,
            listingUid,
            alreadySold: false,
          };
        }
      );
    }
  );


function requireIdentifier(
  value: unknown,
  fieldName: string
): string {
  if (
    typeof value !== 'string' ||
    !/^[A-Za-z0-9_-]{1,200}$/.test(
      value.trim()
    )
  ) {
    throw new HttpsError(
      'invalid-argument',
      `${fieldName} is invalid.`
    );
  }

  return value.trim();
}


function formatPropertyAddress(
  offer: OfferDocument
): string {
  const street = [
    offer.property.addressLine1,
    offer.property.addressLine2,
  ]
    .filter(Boolean)
    .join(', ');

  return [
    street,
    offer.property.city,
    offer.property.state,
    offer.property.zipCode,
  ]
    .filter(Boolean)
    .join(', ');
}
