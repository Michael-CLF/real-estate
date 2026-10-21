import { HttpsError } from 'firebase-functions/v2/https';
import { isFederalLeadExcluded, normalizeFederalLeadTerms, preserveFederalLeadEvidence, type FederalLeadTermPolicy } from './federal-lead-policy';
import type { StateContractPackage, StateContractTerms, StateOfferVersionDocument } from './state-contract-package';
/** The state's rules operate on a pure applicability projection; stored signed versions are never rewritten. */
export function withFederalLeadContractPolicy<T extends StateContractTerms>(statePackage:StateContractPackage<T>,policy:FederalLeadTermPolicy):StateContractPackage<T> {
  const prepare=(terms:T)=>normalizeFederalLeadTerms(terms,policy);
  const hasSignatures=(version:StateOfferVersionDocument<T>)=>[...(version.buyers ?? []),...(version.sellers ?? [])].some(party=>party.signature?.status==='signed');
  const project=<I extends {version:StateOfferVersionDocument<T>}>(input:I):I=>({...input,version:{...input.version,terms:prepare(input.version.terms)}});
  return {...statePackage,federalLeadPolicyIntegrated:true,
    createInitialOfferTerms:input=>{
      const listingData=policy.listingStatementRequired && isFederalLeadExcluded(input.property) ? {...input.listingData,sellerStatements:{...(input.listingData['sellerStatements'] as Record<string,unknown>|undefined),leadBasedPaintApplies:false}} : input.listingData;
      return prepare(statePackage.createInitialOfferTerms({...input,listingData}));
    },
    sanitizeDraftTerms:input=>{
      const terms=statePackage.sanitizeDraftTerms(input);
      // Seller counters must retain the buyer's exact historic receipt statements and pins.
      return input.initiatedBy==='seller' ? preserveFederalLeadEvidence(input.currentTerms,terms,policy) : prepare(terms);
    },
    validateSubmission:input=>statePackage.validateSubmission(project(input)),
    ...(statePackage.validateBeforeSigning ? {validateBeforeSigning:input=>statePackage.validateBeforeSigning!(project(input))} : {}),
    prepareSubmissionTerms:({version,listingData})=>{
      if(version.status!=='draft' || version.immutable || hasSignatures(version))return version.terms;
      const currentYear=listingData?.['yearBuilt'],snapshotYear=version.terms.property.yearBuilt;
      if(typeof currentYear==='number' && Number.isInteger(currentYear) && typeof snapshotYear==='number' && Number.isInteger(snapshotYear) && (currentYear>=1978)!==(snapshotYear>=1978)) {
        throw new HttpsError('failed-precondition','The listing construction year changed across the federal disclosure cutoff. Refresh the listing and start an offer using the corrected property facts.');
      }
      return version.initiatedBy==='seller' ? version.terms : prepare(version.terms);
    },
    ...(statePackage.requiredListingDisclosures ? {requiredListingDisclosures:input=>{
      const historic = input.version.immutable || hasSignatures(input.version);
      const types = statePackage.requiredListingDisclosures!(historic ? input : project(input));
      return types.filter(type=>type!=='lead-based-paint' || historic || !isFederalLeadExcluded(input.version.terms.property));
    }} : {}),
  };
}
