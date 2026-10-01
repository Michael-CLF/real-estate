import { HttpsError } from 'firebase-functions/v2/https';
import type { ValidateStateSubmissionInput } from '../state-contract-package';
import type { ColoradoOfferTermsDocument } from './colorado-offer-terms.document';
import { coloradoTermIssues } from './colorado-terms-rules';

const demand = (ok: unknown, message: string): void => { if (!ok) throw new HttpsError('failed-precondition', message); };

export function validateColoradoSubmission({ offer, version }: ValidateStateSubmissionInput<ColoradoOfferTermsDocument>): void {
  const t = version.terms;
  demand(offer.stateCode === 'CO' && version.stateCode === 'CO' && t.stateCode === 'CO', 'Colorado state mismatch.');
  demand(offer.currentVersionUid === version.Uid && version.offerUid === offer.Uid && version.status === 'draft' && !version.immutable, 'Submit the current editable version.');
  demand(t.contractType === 'navstreet_colorado_residential_2026' && t.property.listingUid === offer.listingUid && t.property.state === 'CO', 'Colorado property or agreement mismatch.');
  demand(['single_family', 'townhome', 'condo'].includes(t.property.propertyType), 'This Colorado agreement supports homes, townhomes and condos only.');
  demand(t.legalDescription.trim(), 'The seller must enter the recorded legal description.');
  demand(version.buyers.length && version.sellers.length, 'Identify buyer and seller.');
  for (const party of [...version.buyers, ...version.sellers]) {
    demand(party.legalName?.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(party.email?.trim() ?? '') && party.phone?.trim(), 'Every party needs a name, email and phone.');
  }
  const initiatingParty = version.initiatedBy === 'buyer' ? version.buyers : version.sellers;
  demand(initiatingParty.some(party => party.userUid === version.initiatedByUid && party.identityVerification.status === 'verified'), 'The initiating signer must verify identity.');
  const issue = coloradoTermIssues(t)[0];
  demand(!issue, issue?.message ?? 'Complete the Colorado contract questions.');
  demand(t.delivery.timeZone === 'America/Denver' && t.delivery.electronicDeliveryAuthorized === true, 'Authorize electronic delivery using Colorado local time.');
  demand(Number.isFinite(Date.parse(t.delivery.expiresAt)) && Date.parse(t.delivery.expiresAt) > Date.now() && version.expiresAt === t.delivery.expiresAt, 'Choose a future offer expiration.');
}