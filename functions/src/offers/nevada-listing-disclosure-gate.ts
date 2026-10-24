import {isFederalLeadExcluded} from './state-contracts/federal-lead-policy';
import {readMissingListingDisclosures} from './listing-disclosure-gate-reader';
import {HttpsError} from 'firebase-functions/v2/https';
import type {DocumentReference,Transaction} from 'firebase-admin/firestore';
export function nevadaRequiredDisclosureTypes(listing:Record<string,unknown>):string[]{
 const s=listing['sellerStatements'] as Record<string,any>|undefined;
 return [...(s?.['nevada']?.['openRangeAdjacent']===true?['nevada-statutory-packet']:[]),...(!isFederalLeadExcluded(listing)?['lead-based-paint']:[])];
}
export async function assertNevadaListingDisclosures(transaction:Transaction,reference:DocumentReference,listing:Record<string,unknown>):Promise<void>{
 const missing=await readMissingListingDisclosures(transaction,reference,nevadaRequiredDisclosureTypes(listing),(doc,type)=>!doc||doc['documentType']!==type||doc['listingUid']!==reference.id||doc['stateAbbreviation']!=='NV'||typeof doc['storagePath']!=='string'||!doc['storagePath']||typeof doc['versionId']!=='string'||!doc['versionId']);
 if(missing.length)throw new HttpsError('failed-precondition',`The seller must provide the legally applicable Nevada documents before this signed offer: ${missing.join(', ')}.`);
}
