import {isFederalLeadExcluded} from './state-contracts/federal-lead-policy';
import {readMissingListingDisclosures} from './listing-disclosure-gate-reader';
import {HttpsError} from 'firebase-functions/v2/https';
import type {DocumentReference,Transaction} from 'firebase-admin/firestore';
export function tennesseeRequiredDisclosureTypes(listing:Record<string,unknown>):string[]{
 const s=listing['sellerStatements'] as Record<string,any>|undefined;
 return [...(true?['tennessee-seller-disclosure']:[]),...(false?['tennessee-association-documents']:[]),...((s?.['tennessee']?.['propertyNoticesApply']===true||listing['propertyType']==='pud')?['tennessee-statutory-packet']:[]),...(!isFederalLeadExcluded(listing)?['lead-based-paint']:[])];
}
export async function assertTennesseeListingDisclosures(transaction:Transaction,reference:DocumentReference,listing:Record<string,unknown>):Promise<void>{const missing=await readMissingListingDisclosures(transaction,reference,tennesseeRequiredDisclosureTypes(listing),(doc,type)=>!doc||doc['documentType']!==type||doc['listingUid']!==reference.id||doc['stateAbbreviation']!=='TN'||typeof doc['storagePath']!=='string'||!doc['storagePath']||typeof doc['versionId']!=='string'||!doc['versionId']);if(missing.length)throw new HttpsError('failed-precondition',`The seller must upload applicable Tennessee documents before offers: ${missing.join(', ')}.`);}
