import {isFederalLeadExcluded} from './state-contracts/federal-lead-policy';
import {readMissingListingDisclosures} from './listing-disclosure-gate-reader';
import {HttpsError} from 'firebase-functions/v2/https';
import type {DocumentReference,Transaction} from 'firebase-admin/firestore';
export function arkansasRequiredDisclosureTypes(listing:Record<string,unknown>):string[]{
 const conditionRequired=false;return [...(conditionRequired ? ['arkansas-seller-disclosure'] : []),...(!isFederalLeadExcluded(listing) ? ['lead-based-paint'] : [])];
}
export async function assertArkansasListingDisclosures(transaction:Transaction,reference:DocumentReference,listing:Record<string,unknown>):Promise<void>{
 const missing=await readMissingListingDisclosures(transaction,reference,arkansasRequiredDisclosureTypes(listing),(doc,type)=>!doc||doc['documentType']!==type||doc['listingUid']!==reference.id||doc['stateAbbreviation']!=='AR'||typeof doc['storagePath']!=='string'||!doc['storagePath']||typeof doc['versionId']!=='string'||!doc['versionId']);
 if(missing.length)throw new HttpsError('failed-precondition',`The seller must provide the legally applicable Arkansas documents before this signed offer: ${missing.join(', ')}.`);
}
