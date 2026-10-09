import type { OfferVersionDocument } from '../offer-types';
import { requireValue } from './submission-values';

/** Shared only by states with matching contact messages and first-matching-initiator behavior. */
export function validateSubmissionParties(
  version: Pick<OfferVersionDocument, 'buyers' | 'sellers' | 'initiatedBy' | 'initiatedByUid'>,
): void {
  requireValue(version.buyers.length > 0 && version.sellers.length > 0, 'Both parties must be identified.');
  for (const party of [...version.buyers, ...version.sellers]) {
    requireValue(party.legalName?.trim(), 'Every party needs a legal name.');
    requireValue(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(party.email?.trim() ?? ''), 'Every party needs a contact email.');
    requireValue(party.phone?.trim(), 'Every party needs a phone number.');
  }
  const initiatingSide = version.initiatedBy === 'buyer' ? version.buyers : version.sellers;
  const initiator = initiatingSide.find(party => party.userUid === version.initiatedByUid);
  requireValue(initiator?.identityVerification.status === 'verified', 'The initiating signer must verify identity.');
}
