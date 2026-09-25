import { HttpsError } from 'firebase-functions/v2/https';
import type { ValidateStateSubmissionInput } from '../state-contract-package';
import type { WisconsinOfferTermsDocument } from './wisconsin-offer-terms.document';
const requireValue = (condition: unknown, message: string): void => { if (!condition) throw new HttpsError('failed-precondition', message); };
const money = (n: number, positive = false) => Number.isSafeInteger(n) && (positive ? n > 0 : n >= 0);
const date = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T12:00:00Z`));
export function validateWisconsinSubmission(input: ValidateStateSubmissionInput<WisconsinOfferTermsDocument>): void {
  const { offer, version } = input; const t = version.terms; const p = t.purchase; const d = t.deadlines;
  requireValue(offer.stateCode === 'WI' && version.stateCode === 'WI' && t.stateCode === 'WI', 'The offer must belong to Wisconsin.');
  requireValue(offer.currentVersionUid === version.Uid && version.offerUid === offer.Uid && version.status === 'draft' && version.immutable === false, 'Only the current mutable version can be submitted.');
  requireValue(t.contractType === 'navstreet_wisconsin_residential_sale_2026' && t.property.listingUid === offer.listingUid && t.property.state === 'WI', 'The contract or property snapshot is invalid.');
  requireValue(['single_family', 'townhome', 'pud'].includes(t.property.propertyType), 'Condominium, vacant land and other property types need a separate Wisconsin agreement.');
  requireValue(version.buyers.length > 0 && version.sellers.length > 0, 'Both parties must be identified.');
  for (const party of [...version.buyers, ...version.sellers]) {
    requireValue(party.legalName?.trim(), 'Every party needs a legal name.');
    requireValue(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(party.email?.trim() ?? ''), 'Every party needs a contact email.');
    requireValue(party.phone?.trim(), 'Every party needs a phone number.');
  }
  const initiatingSide = version.initiatedBy === 'buyer' ? version.buyers : version.sellers;
  const initiator = initiatingSide.find(party => party.userUid === version.initiatedByUid);
  requireValue(initiator?.identityVerification.status === 'verified', 'The initiating signer must verify identity.');
  requireValue(t.legalDescription.trim(), 'Enter the legal description.');
  requireValue(money(p.purchasePriceInCents, true) && money(p.earnestMoneyInCents, true) && p.earnestMoneyHolder.trim(), 'Purchase price, earnest money and escrow holder are required.');
  requireValue(Number.isSafeInteger(p.earnestMoneyDueDays) && p.earnestMoneyDueDays >= 1 && p.earnestMoneyDueDays <= 30, 'Earnest money is due within 1 to 30 days.');
  requireValue(p.financingType !== 'unselected' && ['cash','conventional','fha','va','usda'].includes(p.financingType), 'Choose cash or financing.');
  requireValue(p.financingType === 'cash' || (money(p.loanAmountInCents, true) && p.loanAmountInCents <= p.purchasePriceInCents), 'Enter a valid loan amount.');
  requireValue(money(p.sellerConcessionsInCents) && p.sellerConcessionsInCents <= p.purchasePriceInCents, 'Enter valid seller concessions.');
  requireValue(!t.conditions.additionalEarnestMoney || money(p.additionalEarnestMoneyInCents, true), 'Enter the additional earnest money.');
  requireValue(t.propertyItems.fixturesIncluded !== null, 'Specify whether installed fixtures are included.');
  for (const k of ['dueDiligence','appraisal','financing','saleOfBuyersProperty','additionalEarnestMoney'] as const) requireValue(typeof t.conditions[k] === 'boolean', `Select the ${k} condition.`);
  requireValue(p.financingType !== 'cash' || t.conditions.financing === false, 'Cash offers cannot have a financing condition.');
  requireValue(date(d.sellerDisclosureDate) && date(d.settlementDate) && d.sellerDisclosureDate <= d.settlementDate, 'Disclosure and settlement deadlines must be valid and ordered.');
  requireValue(!t.conditions.dueDiligence || date(d.dueDiligenceDate), 'Set a due diligence deadline.');
  requireValue(!(t.conditions.appraisal || t.conditions.financing) || date(d.financingAppraisalDate), 'Set a financing and appraisal deadline.');
  requireValue(t.settlement.possession !== 'unselected' && t.settlement.specialAssessmentPayer !== 'unselected' && t.settlement.hoaTransferFeePayer !== 'unselected', 'Complete possession and costs.');
  requireValue(t.settlement.possession === 'at_recording' || (Number.isSafeInteger(t.settlement.possessionDelay) && t.settlement.possessionDelay >= 1 && t.settlement.possessionDelay <= 365), 'Enter the possession delay.');
  requireValue(t.disclosures.propertyConditionStatus === 'received' && t.disclosures.hoaDocumentsStatus !== 'unselected', 'The complete Wisconsin condition report must be received and association status selected.');
  requireValue(t.disclosures.leadPaintStatus !== 'unselected', 'Select lead paint status.');
  requireValue(t.property.yearBuilt == null || t.property.yearBuilt >= 1978 || ['received','exempt'].includes(t.disclosures.leadPaintStatus), 'The pre-1978 lead packet or exemption is required before signing.');
  requireValue(t.property.yearBuilt != null || t.disclosures.leadPaintStatus !== 'built_1978_or_later', 'The listing has no construction year; a post-1977 claim needs support.');
  requireValue(typeof t.disclosures.sellerReportsExistingLeases === 'boolean', 'Seller must state whether leases exist.');
  requireValue(!t.conditions.saleOfBuyersProperty || t.additionalTerms.trim(), 'Describe the sale of buyer’s property in additional terms.');
  requireValue(t.disclosures.leadPaintStatus !== 'received' || t.disclosures.leadInspectionSelection !== 'unselected', 'Choose the federal lead inspection opportunity.');
  requireValue(t.disclosures.leadInspectionSelection !== 'other_period' || (Number.isSafeInteger(t.disclosures.leadInspectionDays) && t.disclosures.leadInspectionDays >= 1 && t.disclosures.leadInspectionDays <= 60), 'Enter 1 to 60 agreed lead inspection days.');
  requireValue(t.disclosures.leaseStatementAcknowledged === true, 'Review the lease statement and condition report.');
  requireValue(t.delivery.timeZone === 'America/Chicago' && t.delivery.electronicDeliveryAuthorized === true, 'Electronic delivery consent and Central time are required.');
  const expiration = new Date(t.delivery.expiresAt);
  requireValue(Number.isFinite(expiration.getTime()) && expiration.getTime() > Date.now() && version.expiresAt === t.delivery.expiresAt, 'Enter a future offer expiration matching the version.');
}
