import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { adminFirestore } from '../shared/firebase-admin';
import { callableFunctionOptions } from '../shared/function-options';
import type { OfferDocument, OfferVersionDocument } from './offer-types';

/** Repairs only a stale parent Draft status; signed version data is never written. */
export const reconcileOfferStatus = onCall<{offerUid: string}>(callableFunctionOptions, async request => {
  const userUid = request.auth?.uid;
  if (!userUid) throw new HttpsError('unauthenticated', 'Sign in to refresh the offer status.');
  const offerUid = request.data?.offerUid;
  if (typeof offerUid !== 'string' || !/^[A-Za-z0-9_-]{1,200}$/.test(offerUid)) {
    throw new HttpsError('invalid-argument', 'A valid offer identifier is required.');
  }
  const reference = adminFirestore.collection('offers').doc(offerUid);
  return adminFirestore.runTransaction(async transaction => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) throw new HttpsError('not-found', 'The offer could not be found.');
    const offer = snapshot.data() as OfferDocument;
    const isBuyer = Array.isArray(offer.buyerUids) && offer.buyerUids.includes(userUid);
    const isSeller = Array.isArray(offer.sellerUids) && offer.sellerUids.includes(userUid);
    if (!isBuyer && !isSeller) {
      throw new HttpsError('permission-denied', 'Only an offer participant can refresh its status.');
    }
    if (offer.status !== 'draft' || offer.contract?.contractUid ||
        (offer as OfferDocument & {draftCleanupPending?:boolean}).draftCleanupPending === true) return {repaired:false};
    const versionUid = offer.currentVersionUid;
    if (typeof versionUid !== 'string' || !/^[A-Za-z0-9_-]{1,200}$/.test(versionUid)) return {repaired:false};
    const versionSnapshot = await transaction.get(reference.collection('versions').doc(versionUid));
    if (!versionSnapshot.exists) return {repaired:false};
    const version = versionSnapshot.data() as OfferVersionDocument;
    const validTime = (value: unknown): value is Timestamp => value instanceof Timestamp && Number.isFinite(value.toMillis()) && value.toMillis() > 0;
    if (typeof offer.stateCode !== 'string' || !/^[A-Z]{2}$/.test(offer.stateCode) ||
        version.offerUid !== offerUid || version.stateCode !== offer.stateCode ||
        version.status !== 'delivered' || version.immutable !== true || !validTime(version.deliveredAt) ||
        !Number.isSafeInteger(version.versionNumber) || version.versionNumber < 1 ||
        !['buyer','seller'].includes(version.initiatedBy)) return {repaired:false};
    if (version.versionNumber === 1 && version.initiatedBy !== 'buyer') return {repaired:false};
    const initiatingParties = version.initiatedBy === 'buyer' ? version.buyers : version.sellers;
    if (!Array.isArray(initiatingParties)) return {repaired:false};
    const initiating = initiatingParties.filter(party => party.requiredSigner === true);
    if (!initiating?.length || !initiating.every(party => party.signature?.status === 'signed' && validTime(party.signature.signedAt))) return {repaired:false};
    if (typeof offer.listingUid !== 'string' || !/^[A-Za-z0-9_-]{1,200}$/.test(offer.listingUid)) return {repaired:false};
    const listingSnapshot = await transaction.get(adminFirestore.collection('listings').doc(offer.listingUid));
    const listing = listingSnapshot.data();
    if (!listingSnapshot.exists || listing?.['status'] !== 'active' || listing['activeContractUid']) return {repaired:false};
    const status = version.versionNumber === 1 ? 'submitted' : 'countered';
    const now = Timestamp.now();
    transaction.update(reference, {
      status,
      lastDeliveredVersionUid: versionUid,
      submittedAt: offer.submittedAt ?? version.deliveredAt,
      updatedAt: now,
      statusHistory: FieldValue.arrayUnion({
        fromStatus:'draft', toStatus:status, action:status, actorUid:userUid,
        actorRole:isBuyer ? 'buyer' : 'seller',
        offerVersionUid:versionUid, offerVersionNumber:version.versionNumber,
        note:'Reconciled a stale Draft thread status from its already delivered, immutable version and completed initiating-side signatures. No terms, signatures or delivery timestamps were changed.',
        occurredAt:now,
      }),
    });
    return {repaired:true};
  });
});
