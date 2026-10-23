import {isFederalLeadExcluded} from './state-contracts/federal-lead-policy';
import {readMissingListingDisclosures} from './listing-disclosure-gate-reader';
import {HttpsError} from 'firebase-functions/v2/https';
import type {DocumentReference,Transaction} from 'firebase-admin/firestore';
export function mississippiRequiredDisclosureTypes(listing:Record<string,unknown>):string[]{
 return !isFederalLeadExcluded(listing) ? ['lead-based-paint'] : [];
}
export async function assertMississippiListingDisclosures(transaction:Transaction,reference:DocumentReference,listing:Record<string,unknown>):Promise<void>{
 const missing=await readMissingListingDisclosures(transaction,reference,mississippiRequiredDisclosureTypes(listing),(doc,type)=>!doc||doc['documentType']!==type||doc['listingUid']!==reference.id||doc['stateAbbreviation']!=='MS'||typeof doc['storagePath']!=='string'||!doc['storagePath']||typeof doc['versionId']!=='string'||!doc['versionId']);
 if(missing.length)throw new HttpsError('failed-precondition',`The seller must provide the legally applicable Mississippi documents before this signed offer: ${missing.join(', ')}.`);
}
