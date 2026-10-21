import { HttpsError } from 'firebase-functions/v2/https';
/** State packages supply their own capability metadata; the shared validator interprets listing facts. */
export function assertListingContractScope(scope:{supportedPropertyTypes?:readonly string[];maximumDwellingUnits?:number}, listing:Record<string,unknown>):void {
 const type=String(listing['propertyType']);
 const facts=(listing['sellerStatements'] as Record<string,any>|undefined)?.['contractFacts'];
 const construction=listing['construction'] as Record<string,unknown>|undefined;
 if(!scope.supportedPropertyTypes?.includes(type)) throw new HttpsError('failed-precondition','This property type needs a different agreement.');
 if(facts?.isDeveloperSale===true || construction?.['newConstruction']===true || facts?.isLeasehold===true) throw new HttpsError('failed-precondition','This transaction requires a developer or leasehold agreement outside this resale workflow.');
 if(facts?.isCondominium===true && !scope.supportedPropertyTypes.includes('condo')) throw new HttpsError('failed-precondition','The property has condominium ownership and cannot use this agreement.');
 if(type==='condo' && facts?.isCondominium===false) throw new HttpsError('failed-precondition','Correct the conflicting condominium ownership facts before signing.');
 if(type==='multi_family' && scope.maximumDwellingUnits && (!Number.isSafeInteger(facts?.dwellingUnitCount) || facts.dwellingUnitCount<2 || facts.dwellingUnitCount>scope.maximumDwellingUnits)) throw new HttpsError('failed-precondition','Confirm the dwelling unit count within this agreement’s supported range before submitting or signing.');
}
