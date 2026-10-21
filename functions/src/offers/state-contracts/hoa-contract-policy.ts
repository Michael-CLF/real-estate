import { normalizeHoaTerms, projectHoaValidationTerms, preserveHoaEvidence, readHoaPath, setHoaPath, type HoaApplicabilityPolicy } from './hoa-applicability-policy';
import type { StateContractPackage,StateContractTerms,StateOfferVersionDocument } from './state-contract-package';
/** State-owned schema mappings; no signatures, acknowledgements or upload versions are synthesized. */
export function withHoaContractPolicy<T extends StateContractTerms>(statePackage:StateContractPackage<T>,policy:HoaApplicabilityPolicy):StateContractPackage<T> {
  const prepare=(terms:T)=>normalizeHoaTerms(terms,policy);
  const historic=(version:StateOfferVersionDocument<T>)=>version.immutable || [...(version.buyers??[]),...(version.sellers??[])].some(p=>p.signature?.status==='signed');
  const project=<I extends {version:StateOfferVersionDocument<T>}>(input:I):I=>({...input,version:{...input.version,terms:projectHoaValidationTerms(input.version.terms,policy)}});
  return {...statePackage,hoaPolicyIntegrated:true,
    createInitialOfferTerms:input=>{
      let terms=statePackage.createInitialOfferTerms(input);
      if(policy.snapshotSellerFact && policy.sellerFactPath) {
        const reported=readHoaPath(input.listingData,'sellerStatements.ownersAssociationApplies');
        const legacy=readHoaPath(input.listingData,'hoa.hasHoa');
        const fact=typeof reported==='boolean' ? reported : typeof legacy==='boolean' ? legacy : null;
        terms=setHoaPath(terms,policy.sellerFactPath,fact);
      }
      return prepare(terms);
    },
    sanitizeDraftTerms:input=>{
      let terms=statePackage.sanitizeDraftTerms(input);
      if(input.initiatedBy==='seller')return preserveHoaEvidence(input.currentTerms,terms,policy);
      // Clients cannot turn a seller's association answer into an exclusion.
      if(policy.sellerFactPath)terms=setHoaPath(terms,policy.sellerFactPath,readHoaPath(input.currentTerms,policy.sellerFactPath));
      return prepare(terms);
    },
    validateSubmission:input=>statePackage.validateSubmission(project(input)),
    ...(statePackage.validateBeforeSigning ? {validateBeforeSigning:input=>statePackage.validateBeforeSigning!(project(input))} : {}),
    prepareSubmissionTerms:input=>{
      const terms=statePackage.prepareSubmissionTerms ? statePackage.prepareSubmissionTerms(input) : input.version.terms;
      return input.version.status==='draft' && !historic(input.version) && input.version.initiatedBy!=='seller' ? prepare(terms) : terms;
    },
    ...(statePackage.requiredListingDisclosures ? {requiredListingDisclosures:input=>statePackage.requiredListingDisclosures!(historic(input.version) ? input : {...input,version:{...input.version,terms:prepare(input.version.terms)}})} : {}),
  };
}
