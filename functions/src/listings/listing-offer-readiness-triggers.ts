import {onDocumentWritten} from 'firebase-functions/v2/firestore';
import {adminFirestore} from '../shared/firebase-admin';
import {FUNCTION_REGION} from '../shared/function-options';
import {offerReadinessInputKey,readListingOfferReadiness} from './listing-offer-readiness';
import {refreshListingOfferReadiness} from './refresh-listing-offer-readiness';

export const updateListingOfferReadiness=onDocumentWritten({document:'listings/{listingUid}',region:FUNCTION_REGION,retry:true},async event=>{
  const after=event.data?.after;
  if(!after?.exists)return;
  const listing=after.data(),before=event.data?.before.data();
  if(!listing)return;
  // Own summary writes and metrics writes must not cause a loop or unnecessary gate reads.
  if(before && offerReadinessInputKey(before)===offerReadinessInputKey(listing) && readListingOfferReadiness(listing['offerReadiness'],event.params.listingUid,listing))return;
  await refreshListingOfferReadiness(adminFirestore,event.params.listingUid);
});
export const updateDisclosureOfferReadiness=onDocumentWritten({document:'listings/{listingUid}/disclosures/{documentType}',region:FUNCTION_REGION,retry:true},async event=>{
  await refreshListingOfferReadiness(adminFirestore,event.params.listingUid);
});
