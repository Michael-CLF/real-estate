import { FieldPath } from 'firebase-admin/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';
import { adminFirestore } from '../shared/firebase-admin';
import { FUNCTION_REGION } from '../shared/function-options';
import { claimUnsignedDraftDeletion, purgeClaimedUnsignedDraft, DRAFT_INACTIVITY_MS } from './discard-offer-draft';
import { UNSENT_OFFER_STATUSES } from './unsigned-draft-policy';

export const deleteInactiveOfferDrafts = onSchedule({schedule:'every 60 minutes',timeZone:'UTC',
  region:FUNCTION_REGION,maxInstances:1,timeoutSeconds:540,memory:'256MiB'}, async () => {
  const cutoffMs = Date.now() - DRAFT_INACTIVITY_MS;
  // One-field queries use existing automatic indexes; paginate rather than repeatedly
  // scanning only the first group of recent drafts.
  const cursorRef = adminFirestore.collection('maintenance').doc('unsigned-offer-draft-cleanup');
  const cursor = await cursorRef.get();
  let query = adminFirestore.collection('offers').where('status','in',UNSENT_OFFER_STATUSES).orderBy(FieldPath.documentId()).limit(100);
  const lastUid = cursor.get('lastOfferUid');
  if (typeof lastUid === 'string' && lastUid) query = query.startAfter(lastUid);
  let deleted=0,failed=0;
  const startedAt=Date.now();
  for (let page=0; page<5 && Date.now()-startedAt<420000; page++) {
    const snapshot = await query.get();
    if (snapshot.empty) {await cursorRef.set({lastOfferUid:null});break;}
    for (const candidate of snapshot.docs) {
      try {if (candidate.get('status') !== 'withdrawn' && await claimUnsignedDraftDeletion(candidate.ref,undefined,cutoffMs)) {await purgeClaimedUnsignedDraft(candidate.ref);deleted++;}}
      catch(error) {failed++;logger.error('Unsigned draft cleanup failed',{offerUid:candidate.id,error});}
    }
    const last=snapshot.docs[snapshot.docs.length-1];
    await cursorRef.set({lastOfferUid:snapshot.size<100?null:last.id});
    if(snapshot.size<100)break;
    query=adminFirestore.collection('offers').where('status','in',UNSENT_OFFER_STATUSES).orderBy(FieldPath.documentId()).startAfter(last.id).limit(100);
  }
  logger.info('Unsigned offer draft cleanup complete',{deleted,failed});
});
