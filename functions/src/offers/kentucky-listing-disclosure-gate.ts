import {isFederalLeadExcluded} from './state-contracts/federal-lead-policy';
import {readMissingListingDisclosures} from './listing-disclosure-gate-reader';
import {HttpsError} from 'firebase-functions/v2/https';
import type {DocumentReference,Transaction} from 'firebase-admin/firestore';
export function kentuckyRequiredDisclosureTypes(listing:Record<string,unknown>):string[]{
 const s=listing['sellerStatements'] as Record<string,any>|undefined;
 return [...(false?['kentucky-seller-disclosure']:[]),...((s?.['contractFacts']?.['isCondominium']===true||listing['propertyType']==='condo')?['kentucky-association-documents']:[]),...(false?['kentucky-statutory-packet']:[]),...(!isFederalLeadExcluded(listing)?['lead-based-paint']:[])];
}
export async function assertKentuckyListingDisclosures(transaction:Transaction,reference:DocumentReference,listing:Record<string,unknown>):Promise<void>{const missing=await readMissingListingDisclosures(transaction,reference,kentuckyRequiredDisclosureTypes(listing),(doc,type)=>!doc||doc['documentType']!==type||doc['listingUid']!==reference.id||doc['stateAbbreviation']!=='KY'||typeof doc['storagePath']!=='string'||!doc['storagePath']||typeof doc['versionId']!=='string'||!doc['versionId']);if(missing.length)throw new HttpsError('failed-precondition',`The seller must upload applicable Kentucky documents before offers: ${missing.join(', ')}.`);}
