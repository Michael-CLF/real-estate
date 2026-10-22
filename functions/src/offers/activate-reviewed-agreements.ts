import {FieldValue, Timestamp} from 'firebase-admin/firestore';
import {onSchedule} from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';
import {adminFirestore} from '../shared/firebase-admin';
import {FUNCTION_REGION} from '../shared/function-options';
import {requireStateContractPackage} from './state-contracts/state-contract-registry';
import {closeCompetingOffers, notifyFullyExecuted} from './sign-offer';
import type {OfferDocument, OfferVersionDocument} from './offer-types';

/** Only accepted agreements are scanned; offer expiration no longer applies after timely acceptance. */
export const activateReviewedAgreements = onSchedule({
  schedule: 'every 1 minutes', timeZone: 'UTC', region: FUNCTION_REGION,
  maxInstances: 1, timeoutSeconds: 300, memory: '256MiB',
}, async () => {
  // One equality filter uses the automatic single-field index; no composite index is needed.
  const pending = await adminFirestore.collection('offers').where('status', '==', 'accepted_pending_review').get();
  for (const snapshot of pending.docs) {
    try { await activateReviewedAgreement(snapshot.id); }
    catch (error) { logger.error('Review-period activation failed', {offerUid: snapshot.id, error}); }
  }
});

export async function activateReviewedAgreement(offerUid: string): Promise<boolean> {
  return adminFirestore.runTransaction(async transaction => {
    const reference = adminFirestore.collection('offers').doc(offerUid);
    const offerSnapshot = await transaction.get(reference);
    const offer = offerSnapshot.data() as OfferDocument | undefined;
    if (!offer || offer.status !== 'accepted_pending_review' || offer.contract?.status !== 'pending_review') return false;
    const versionReference = reference.collection('versions').doc(offer.currentVersionUid);
    const listingReference = adminFirestore.collection('listings').doc(offer.listingUid);
    const contractReference = adminFirestore.collection('contracts').doc(offer.contract.contractUid);
    const [versionSnapshot, listingSnapshot, contractSnapshot] = await Promise.all([
      transaction.get(versionReference), transaction.get(listingReference), transaction.get(contractReference),
    ]);
    const version = versionSnapshot.data() as OfferVersionDocument | undefined;
    const listing = listingSnapshot.data();
    if (!version || !listing || !contractSnapshot.exists || version.status !== 'accepted' ||
        !version.immutable || version.stateCode !== offer.stateCode || version.terms.stateCode !== offer.stateCode ||
        offer.contract.acceptedOfferVersionUid !== version.Uid ||
        contractSnapshot.get('status') !== 'pending_review' ||
        listing['pendingAgreementOfferUid'] !== offerUid ||
        (listing['activeContractUid'] && listing['activeContractUid'] !== offer.contract.contractUid)) {
      throw new Error('Accepted agreement, listing reservation or immutable version is inconsistent.');
    }
    const parties = [...version.buyers, ...version.sellers].filter(party => party.requiredSigner);
    if (!parties.length || parties.some(party => party.signature.status !== 'signed')) throw new Error('Required signatures are incomplete.');
    const statePackage = requireStateContractPackage(offer.stateCode);
    const reviewEndsAt = statePackage.agreementEffectiveNotBefore?.({offer, version});
    if (!reviewEndsAt || !Number.isFinite(reviewEndsAt.getTime()) ||
        reviewEndsAt.getTime() !== offer.contract.reviewEndsAt?.toMillis()) throw new Error('Recorded review deadline does not match the immutable agreement.');
    const now = Timestamp.now();
    if (reviewEndsAt.getTime() > now.toMillis()) return false;
    // Expiry governed acceptance. It must not invalidate an already accepted agreement.
    const effectiveAt = Timestamp.fromDate(reviewEndsAt);
    const milestones = statePackage.createContractMilestones({version, effectiveAt: reviewEndsAt});
    const competingSnapshot = await transaction.get(adminFirestore.collection('offers').where('listingUid', '==', offer.listingUid));
    const competing = competingSnapshot.docs.filter(doc => doc.id !== offerUid && doc.get('pendingOfferCounted') === true)
      .map(doc => ({offerUid: doc.id, offerReference: doc.ref, offer: doc.data() as OfferDocument,
        versionReference: doc.ref.collection('versions').doc(doc.get('currentVersionUid')),
        version: undefined as OfferVersionDocument | undefined}));
    const competingVersions = await Promise.all(competing.map(candidate => transaction.get(candidate.versionReference)));
    competingVersions.forEach((doc, index) => { if (doc.exists) competing[index].version = doc.data() as OfferVersionDocument; });
    transaction.update(reference, {
      status: 'converted_to_contract', pendingOfferCounted: false,
      contract: {...offer.contract, status: 'effective', effectiveAt, ...milestones},
      closedReason: 'converted_to_contract', closedAt: now, lastActivityAt: now, updatedAt: now,
      statusHistory: FieldValue.arrayUnion({fromStatus: offer.status, toStatus: 'converted_to_contract',
        action: 'converted_to_contract', actorUid: 'system', actorRole: 'system',
        offerVersionUid: version.Uid, offerVersionNumber: version.versionNumber,
        note: 'The document review period ended without buyer withdrawal; the accepted agreement is effective.', occurredAt: now}),
    });
    transaction.update(contractReference, {status: 'effective', effectiveAt, ...milestones, updatedAt: now});
    transaction.update(listingReference, {status: 'under_contract', acceptingOffers: false, pendingOfferCount: 0,
      activeContractUid: offer.contract.contractUid, pendingAgreementOfferUid: FieldValue.delete(), underContractAt: effectiveAt, updatedAt: now});
    closeCompetingOffers(transaction, competing, offer, version, now);
    notifyFullyExecuted(transaction, offer, version, 'system');
    return true;
  });
}
