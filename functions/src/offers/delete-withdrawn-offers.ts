import { FieldPath, FieldValue, Timestamp, type DocumentReference } from 'firebase-admin/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';
import { adminFirestore } from '../shared/firebase-admin';
import { FUNCTION_REGION } from '../shared/function-options';
import { purgeClaimedUnsignedDraft } from './discard-offer-draft';

export const WITHDRAWN_RETENTION_MS = 72 * 60 * 60 * 1000;
const INTERVAL_MS = 15 * 60 * 1000;
export async function claimWithdrawnOfferDeletion(reference: DocumentReference, nowMs: number): Promise<boolean> {
  return adminFirestore.runTransaction(async transaction => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) return false;
    const offer = snapshot.data()!;
    // Never remove a linked contract, even if a malformed offer says withdrawn.
    if (offer.status !== 'withdrawn' || offer.contract || offer.contractUid) return false;
    if (offer.draftCleanupPending === true) return true;
    const withdrawnAt = offer.withdrawnAt?.toMillis?.();
    if (!Number.isFinite(withdrawnAt) || withdrawnAt > nowMs - WITHDRAWN_RETENTION_MS + INTERVAL_MS) return false;
    const versions = await transaction.get(reference.collection('versions'));
    const listingRef = adminFirestore.collection('listings').doc(offer.listingUid);
    const listing = offer.pendingOfferCounted === true ? await transaction.get(listingRef) : null;
    if (listing?.exists) transaction.update(listingRef, {
      pendingOfferCount: Math.max(0, (Number(listing.get('pendingOfferCount')) || 0) - 1),
      updatedAt: FieldValue.serverTimestamp(),
    });
    for (const version of versions.docs) transaction.update(version.ref, {status:'withdrawn', immutable:false, updatedAt:FieldValue.serverTimestamp()});
    transaction.update(reference, {draftCleanupPending:true, draftCleanupReason:'withdrawn_retention',
      draftCleanupClaimedAt:Timestamp.now(), pendingOfferCounted:false, updatedAt:FieldValue.serverTimestamp()});
    return true;
  });
}
export const deleteWithdrawnOffers = onSchedule({schedule:'every 15 minutes',timeZone:'UTC',
  region:FUNCTION_REGION,maxInstances:1,timeoutSeconds:540,memory:'256MiB'}, async () => {
  const cursorRef = adminFirestore.collection('maintenance').doc('withdrawn-offer-cleanup');
  const cursor = await cursorRef.get();
  let query = adminFirestore.collection('offers').where('status','==','withdrawn').orderBy(FieldPath.documentId()).limit(100);
  const lastUid = cursor.get('lastOfferUid');
  if (typeof lastUid === 'string' && lastUid) query = query.startAfter(lastUid);
  const startedAt = Date.now();
  while (Date.now() - startedAt < 420000) {
    const page = await query.get();
    if (page.empty) {await cursorRef.set({lastOfferUid:null});break;}
    for (const candidate of page.docs) {
      try {
        if (await claimWithdrawnOfferDeletion(candidate.ref, Date.now())) await purgeClaimedUnsignedDraft(candidate.ref);
      } catch (error) {logger.error('Withdrawn offer cleanup failed', {offerUid:candidate.id,error});}
    }
    const last = page.docs[page.docs.length-1];
    await cursorRef.set({lastOfferUid:page.size<100?null:last.id});
    if (page.size<100) break;
    query = adminFirestore.collection('offers').where('status','==','withdrawn').orderBy(FieldPath.documentId()).startAfter(last.id).limit(100);
  }
});
