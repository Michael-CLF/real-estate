import {isFederalLeadExcluded} from './state-contracts/federal-lead-policy';
import {readMissingListingDisclosures} from './listing-disclosure-gate-reader';
import {HttpsError} from 'firebase-functions/v2/https';
import type {DocumentReference,Transaction} from 'firebase-admin/firestore';
export function westVirginiaRequiredDisclosureTypes(listing:Record<string,unknown>):string[]{
 const s=listing['sellerStatements'] as Record<string,any>|undefined;
 return [...(false?['west-virginia-seller-disclosure']:[]),...((s?.['ownersAssociationApplies']===true||s?.['contractFacts']?.['isCondominium']===true||listing['propertyType']==='condo')?['west-virginia-association-documents']:[]),...(false?['west-virginia-statutory-packet']:[]),...(!isFederalLeadExcluded(listing)?['lead-based-paint']:[])];
}
export async function assertWestVirginiaListingDisclosures(transaction:Transaction,reference:DocumentReference,listing:Record<string,unknown>):Promise<void>{const missing=await readMissingListingDisclosures(transaction,reference,westVirginiaRequiredDisclosureTypes(listing),(doc,type)=>!doc||doc['documentType']!==type||doc['listingUid']!==reference.id||doc['stateAbbreviation']!=='WV'||typeof doc['storagePath']!=='string'||!doc['storagePath']||typeof doc['versionId']!=='string'||!doc['versionId']);if(missing.length)throw new HttpsError('failed-precondition',`The seller must upload applicable West Virginia documents before offers: ${missing.join(', ')}.`);}
