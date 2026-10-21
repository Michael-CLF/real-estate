import { FieldValue, Timestamp, type DocumentReference } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { adminFirestore } from '../shared/firebase-admin';
import { callableFunctionOptions } from '../shared/function-options';
import { DRAFT_INACTIVITY_MS, isDiscardableUnsignedOffer, latestDraftActivity } from './unsigned-draft-policy';

/** Claim under the same transaction lock used by saving, submission and signing. */
export async function claimUnsignedDraftDeletion(reference: DocumentReference, actorUid?: string, cutoffMs?: number): Promise<boolean> {
  return adminFirestore.runTransaction(async transaction => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) return false;
    const offer = snapshot.data()!;
    if (actorUid && !(offer.buyerUids ?? []).includes(actorUid) && offer.primaryBuyerUid !== actorUid) {
      throw new HttpsError('permission-denied', 'Only a buyer on this unfinished offer can discard it.');
    }
    if (actorUid && offer.status === 'withdrawn' && offer.draftCleanupReason !== 'user_discard') throw new HttpsError('failed-precondition', 'Withdrawn offers are automatically deleted within 72 hours.');
    if (offer.draftCleanupPending === true) return true;
    const versionSnapshots = await transaction.get(reference.collection('versions'));
    const versions = versionSnapshots.docs.map(doc => ({...doc.data(), Uid: doc.id}));
    if (!isDiscardableUnsignedOffer({...offer, Uid: snapshot.id}, versions)) {
      if (actorUid) throw new HttpsError('failed-precondition', 'Only an initial offer with no signatures or delivery can be discarded. Sent offers and negotiation history must be retained.');
      return false;
    }
    const activity = latestDraftActivity(offer, versions);
    if (cutoffMs !== undefined && (activity === null || activity > cutoffMs)) return false;
    // Check permanent signature evidence too, not only version snapshots.
    const documents = await transaction.get(reference.collection('documents'));
    for (const doc of documents.docs) {
      const data = doc.data();
      if ((Array.isArray(data.deliveries) && data.deliveries.length > 0) || data.signatureRequest?.status === 'completed') {
        if (actorUid) throw new HttpsError('failed-precondition','Delivered or completed documents cannot be discarded.');
        return false;
      }
      if (data.signatureRequest?.signers?.some((signer: any) => signer.status === 'signed' || signer.signedAt)) {
        if (actorUid) throw new HttpsError('failed-precondition','A signed document cannot be discarded.');
        return false;
      }
      const signatures = await transaction.get(doc.ref.collection('signatures').limit(1));
      if (!signatures.empty) {
        if (actorUid) throw new HttpsError('failed-precondition','Permanent signature evidence cannot be discarded.');
        return false;
      }
    }
    const listingRef = adminFirestore.collection('listings').doc(offer.listingUid);
    const listingSnapshot = offer.pendingOfferCounted === true ? await transaction.get(listingRef) : null;
    if (listingSnapshot?.exists) transaction.update(listingRef, {
      pendingOfferCount: Math.max(0, (Number(listingSnapshot.get('pendingOfferCount')) || 0) - 1),
      updatedAt: FieldValue.serverTimestamp(),
    });
    // Existing lifecycle functions reject withdrawn versions; setting immutable false
    // also prevents an in-flight PDF job from persisting its stale document.
    transaction.update(versionSnapshots.docs[0].ref, {status:'withdrawn', immutable:false, updatedAt:FieldValue.serverTimestamp()});
    transaction.update(reference, {status:'withdrawn', pendingOfferCounted:false,
      draftCleanupPending:true, draftCleanupClaimedAt:Timestamp.now(),
      draftCleanupReason:actorUid ? 'user_discard' : 'seven_days_inactive',
      updatedAt:FieldValue.serverTimestamp()});
    return true;
  });
}
/** Keep the parent marker until children and private files are removed, allowing retries. */
export async function purgeClaimedUnsignedDraft(reference: DocumentReference): Promise<void> {
  const snapshot = await reference.get();
  if (!snapshot.exists || snapshot.get('draftCleanupPending') !== true) return;
  await getStorage().bucket().deleteFiles({prefix:`offers/${reference.id}/`});
  for (const collection of await reference.listCollections()) await adminFirestore.recursiveDelete(collection);
  await reference.delete();
}
export const discardOfferDraft = onCall<{offerUid:string}, Promise<{deleted:boolean}>>(
  {...callableFunctionOptions, cors:true, invoker:'public', timeoutSeconds:300}, async request => {
    if (!request.auth?.uid) throw new HttpsError('unauthenticated','Sign in to discard an offer draft.');
    const offerUid = request.data?.offerUid;
    if (typeof offerUid !== 'string' || !offerUid.trim() || offerUid.includes('/')) throw new HttpsError('invalid-argument','A valid offer identifier is required.');
    const reference = adminFirestore.collection('offers').doc(offerUid.trim());
    const claimed = await claimUnsignedDraftDeletion(reference, request.auth.uid);
    if (claimed) await purgeClaimedUnsignedDraft(reference);
    return {deleted:true};
  },
);
export { DRAFT_INACTIVITY_MS };
