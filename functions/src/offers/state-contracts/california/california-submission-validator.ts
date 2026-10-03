import { HttpsError } from 'firebase-functions/v2/https';
import type { ValidateStateSubmissionInput } from '../state-contract-package';
import type { CaliforniaOfferTermsDocument } from './california-offer-terms.document';
import { californiaTermsIssues } from './california-terms-rules';
export function validateCaliforniaSubmission({offer,version}: ValidateStateSubmissionInput<CaliforniaOfferTermsDocument>): void {
  const fail=(ok:unknown,message:string)=> {if(!ok) throw new HttpsError('failed-precondition',message);};
  fail(offer.stateCode==='CA' && version.stateCode==='CA' && offer.currentVersionUid===version.Uid && version.offerUid===offer.Uid && version.status==='draft' && !version.immutable,'Only the current mutable California draft can be submitted.');
  fail(version.terms.property.listingUid===offer.listingUid,'The property snapshot does not match the offer.');
  fail(Array.isArray(version.terms.requiredDisclosureTypes), 'Start a new California offer after the seller completes Property Disclosures.');
  const issues=californiaTermsIssues(version.terms,new Date(),true);
  fail(!issues.length,issues.map(i=>i.message).join(' '));
  fail(version.expiresAt===version.terms.delivery.expiresAt,'Offer expiration must match its version.');
  fail(version.buyers.length>0 && version.sellers.length>0,'Identify both parties.');
  for(const p of [...version.buyers,...version.sellers]) fail(p.legalName?.trim() && p.phone?.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email),'Complete all party contact details.');
  const side=version.initiatedBy==='buyer'?version.buyers:version.sellers;
  fail(side.find(p=>p.userUid===version.initiatedByUid)?.identityVerification.status==='verified','The initiating signer must verify identity.');
}
