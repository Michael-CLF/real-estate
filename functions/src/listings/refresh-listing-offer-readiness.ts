import type {Firestore,Transaction,DocumentReference} from 'firebase-admin/firestore';
import {requireEnabledStateContractPackage} from '../offers/state-contracts/state-contract-registry';
import {offerReadinessInputKey,readinessStateCode,readListingOfferReadiness,OFFER_READINESS_POLICY_REVISION,OFFER_READINESS_MAX_AGE_MS,type ListingOfferReadiness} from './listing-offer-readiness';

/** Uses the same transaction-aware, state-owned gate as createOfferDraft. Never trusts event contents. */
export async function refreshListingOfferReadiness(firestore: Firestore, listingUid: string): Promise<boolean> {
  const reference=firestore.collection('listings').doc(listingUid);
  return firestore.runTransaction(async transaction=>{
    const snapshot=await transaction.get(reference);
    if(!snapshot.exists)return false; // Do not resurrect deleted listings.
    const listing=snapshot.data()!;
    const now=Date.now(),inputKey=offerReadinessInputKey(listing),stateCode=readinessStateCode(listing);
    if(!inputKey)return false; // Oversized/unusual facts use normal live checks; never write an unusable summary in a loop.
    let ready=false,validUntil=now+OFFER_READINESS_MAX_AGE_MS;
    let gate: ((transaction:Transaction,reference:DocumentReference,listing:Record<string,unknown>)=>Promise<void>)|undefined;
    try {
      const policy=requireEnabledStateContractPackage(stateCode).listingDisclosurePolicy;
      gate=policy?.assertReady;
      const boundary=policy?.readinessValidUntil?.(listing,now);
      if(boundary!==undefined)validUntil=Math.min(validUntil,boundary);
    } catch(error:unknown) {
      if(!error || typeof error!=='object' || !('code' in error) || error.code!=='failed-precondition')throw error;
    }
    if(listing['status']==='active' && inputKey && gate) {
      try {await gate(transaction,reference,listing);ready=true;}
      catch(error:unknown) {
        if(!error || typeof error!=='object' || !('code' in error) || error.code!=='failed-precondition')throw error;
      }
    }
    const previous=readListingOfferReadiness(listing['offerReadiness'],listingUid,listing,now);
    if(previous && previous.ready===ready && previous.expiresAtMillis<=validUntil)return false;
    const summary:ListingOfferReadiness={schemaVersion:1,policyRevision:OFFER_READINESS_POLICY_REVISION,listingUid,stateCode,ready,inputKey,checkedAtMillis:now,expiresAtMillis:validUntil};
    // Every gate read is complete before the single write; concurrent changes cause a retry.
    transaction.update(reference,{offerReadiness:summary});
    return true;
  });
}
