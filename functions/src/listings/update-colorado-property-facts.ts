import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '../shared/firebase-admin';
import { callableFunctionOptions } from '../shared/function-options';
import { COLORADO_FACT_DEFAULTS, type ColoradoPropertyFacts } from '../offers/state-contracts/colorado/colorado-contract-elections';

export const updateColoradoPropertyFacts = onCall({ ...callableFunctionOptions }, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in before editing seller facts.');
  const uid = request.data?.listingUid;
  const value = request.data?.facts;
  if (typeof uid !== 'string' || !uid || uid.includes('/') || !value || typeof value !== 'object' || Array.isArray(value))
    throw new HttpsError('invalid-argument', 'Identify the listing and Colorado property facts.');
  const facts = Object.fromEntries(Object.entries(COLORADO_FACT_DEFAULTS).map(([key, fallback]) =>
    [key, typeof value[key] === 'string' ? value[key].trim().slice(0, 4000) : fallback])) as unknown as ColoradoPropertyFacts;
  if (!facts.waterSource || !['covered', 'not_applicable'].includes(facts.metroDistrict) ||
    (facts.metroDistrict === 'covered' && (!/^https:\/\//.test(facts.metroDistrictWebsite) || !facts.metroDistrictDisclosure)))
    throw new HttpsError('invalid-argument', 'Complete the water source and district facts and any applicable district records reference.');
  const ref = adminFirestore.collection('listings').doc(uid);
  await adminFirestore.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw new HttpsError('not-found', 'Listing not found.');
    const listing = snapshot.data()!;
    if (listing['sellerUid'] !== request.auth!.uid) throw new HttpsError('permission-denied', 'Only the seller may edit these facts.');
    if (listing['state'] !== 'CO' || listing['status'] !== 'active' || listing['activeContractUid'])
      throw new HttpsError('failed-precondition', 'Only an active Colorado listing outside a contract can be edited.');
    transaction.update(ref, { coloradoPropertyFacts: facts, updatedAt: FieldValue.serverTimestamp() });
  });
  return { listingUid: uid, facts };
});