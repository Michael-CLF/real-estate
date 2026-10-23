import {isFederalLeadExcluded} from './state-contracts/federal-lead-policy';
import {readMissingListingDisclosures} from './listing-disclosure-gate-reader';
import {HttpsError} from 'firebase-functions/v2/https';
import type {DocumentReference,Transaction} from 'firebase-admin/firestore';
export function illinoisRequiredDisclosureTypes(listing:Record<string,unknown>):string[]{
 const facts=((listing['sellerStatements'] as Record<string,unknown>|undefined)?.['illinois']??{}) as Record<string,unknown>;
 const conditionRequired=facts['disclosureExemptionClaimed'] !== true;return [...(conditionRequired ? ['illinois-seller-disclosure'] : []),...(facts['radonExemptionClaimed']!==true ? ['illinois-statutory-packet'] : []),...(!isFederalLeadExcluded(listing) ? ['lead-based-paint'] : [])];
}
export async function assertIllinoisListingDisclosures(transaction:Transaction,reference:DocumentReference,listing:Record<string,unknown>):Promise<void>{
 const missing=await readMissingListingDisclosures(transaction,reference,illinoisRequiredDisclosureTypes(listing),(doc,type)=>!doc||doc['documentType']!==type||doc['listingUid']!==reference.id||doc['stateAbbreviation']!=='IL'||typeof doc['storagePath']!=='string'||!doc['storagePath']||typeof doc['versionId']!=='string'||!doc['versionId']);
 if(missing.length)throw new HttpsError('failed-precondition',`The seller must provide the legally applicable Illinois documents before this signed offer: ${missing.join(', ')}.`);
}
