import {isFederalLeadExcluded} from './state-contracts/federal-lead-policy';
import {readMissingListingDisclosures} from './listing-disclosure-gate-reader';
import {HttpsError} from 'firebase-functions/v2/https';
import type {DocumentReference,Transaction} from 'firebase-admin/firestore';
export function rhodeIslandRequiredDisclosureTypes(listing:Record<string,unknown>):string[]{
 const s=listing['sellerStatements'] as Record<string,any>|undefined;
 return [...(true?['rhode-island-seller-disclosure']:[]),...((s?.['contractFacts']?.['isCondominium']===true||listing['propertyType']==='condo')?['rhode-island-association-documents']:[]),...(false?['rhode-island-statutory-packet']:[]),...(!isFederalLeadExcluded(listing)?['lead-based-paint']:[])];
}
export async function assertRhodeIslandListingDisclosures(transaction:Transaction,reference:DocumentReference,listing:Record<string,unknown>):Promise<void>{const missing=await readMissingListingDisclosures(transaction,reference,rhodeIslandRequiredDisclosureTypes(listing),(doc,type)=>!doc||doc['documentType']!==type||doc['listingUid']!==reference.id||doc['stateAbbreviation']!=='RI'||typeof doc['storagePath']!=='string'||!doc['storagePath']||typeof doc['versionId']!=='string'||!doc['versionId']);if(missing.length)throw new HttpsError('failed-precondition',`The seller must upload applicable Rhode Island documents before offers: ${missing.join(', ')}.`);}
