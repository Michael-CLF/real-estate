import { HttpsError } from 'firebase-functions/v2/https';
import type { ValidateStateSubmissionInput } from '../state-contract-package';
import type { OklahomaOfferTermsDocument } from './oklahoma-offer-terms.document';

const FINANCING = new Set(['conventional_loan', 'fha_loan', 'va_loan', 'usda_loan', 'native_american_loan', 'assumption', 'seller_financing']);

export function validateOklahomaSubmission(
  input: ValidateStateSubmissionInput<OklahomaOfferTermsDocument>
): void {
  const { offer, version } = input;
  const terms = version.terms;
  assertCondition(offer.stateCode === 'OK' && version.stateCode === 'OK' && terms.stateCode === 'OK', 'The offer, version, and contract terms must all use state code OK.');
  assertCondition(offer.currentVersionUid === version.Uid && version.offerUid === offer.Uid, 'Only the current version of this offer may be submitted.');
  assertCondition(version.status === 'draft' && version.immutable === false, 'Only an editable draft offer may be submitted.');
  assertCondition(terms.contractType === 'residential_sale_2026' && terms.form.formId === 'OREC-RESIDENTIAL-SALE-2026' && terms.form.effectiveDate === '2026-01-01', 'The offer does not use the supported 2026 OREC Residential Sale form.');
  assertCondition(terms.property.listingUid === offer.listingUid && terms.property.state.trim().toUpperCase() === 'OK', 'The Oklahoma property snapshot does not match this offer.');
  assertCondition(version.buyers.length >= 1 && version.buyers.length <= 3, 'The OREC form supports one through three buyers.');
  assertCondition(version.sellers.length >= 1 && version.sellers.length <= 3, 'The OREC form supports one through three sellers.');
  [...version.buyers, ...version.sellers].forEach(party => {
    assertCondition(Boolean(party.legalName.trim()), 'Every party must have a legal name.');
    assertCondition(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(party.email.trim()), `${party.legalName} must have a valid email address.`);
    assertCondition(Boolean(party.phone.trim()), `${party.legalName} must have a phone number.`);
  });
  const initiator = [...version.buyers, ...version.sellers].find(party => party.userUid === version.initiatedByUid);
  assertCondition(Boolean(initiator), 'The initiating party is not included in this offer version.');
  assertCondition(initiator?.identityVerification.status === 'verified', 'The initiating party must complete identity verification before submitting.');

  assertCondition(Boolean(terms.legalDescription.trim()), 'The legal description is required.');
  assertCondition(positiveMoney(terms.purchase.purchasePriceInCents), 'Purchase price must be greater than zero.');
  assertCondition(positiveMoney(terms.purchase.earnestMoneyInCents), 'Earnest money must be greater than zero.');
  assertCondition(Boolean(terms.purchase.trustAccountHolder.trim()), 'The earnest-money trust-account holder is required.');
  assertCondition(validDate(terms.closing.closingDate), 'A valid closing date is required.');
  assertCondition(terms.contractDocuments.filter(value => FINANCING.has(value)).length <= 1, 'No more than one financing supplement may be selected.');
  assertCondition(integerBetween(terms.timePeriods.inspectionDays, 1, 180), 'The inspection period must be from 1 through 180 days.');
  assertCondition(integerBetween(terms.timePeriods.trrNegotiationDays, 1, 180), 'The TRR negotiation period must be from 1 through 180 days.');
  assertCondition(integerBetween(terms.timePeriods.titleCureDelayDays, 1, 180), 'The title-cure period must be from 1 through 180 days.');
  assertCondition(!terms.timePeriods.referenceDate || validDate(terms.timePeriods.referenceDate), 'The Time Reference Date is invalid.');
  assertCondition(terms.disclosures.propertyConditionStatus !== 'unselected', 'The property-condition disclosure status is required.');
  assertCondition(terms.disclosures.leadBasedPaintStatus !== 'unselected', 'The lead-based paint disclosure status is required.');
  assertCondition(terms.disclosures.costEstimateReceived && terms.disclosures.contractGuideAvailable, 'The required disclosure acknowledgments are incomplete.');
  assertCondition(terms.title.evidenceSelection !== 'unselected', 'The title-evidence selection is required.');
  assertCondition(terms.title.surveySelection !== 'unselected', 'The survey selection is required.');
  assertCondition(terms.title.surveySelection === 'none_unless_required' || terms.title.surveyExpensePayer !== 'unselected', 'The survey expense payer is required.');
  assertCondition(terms.serviceAgreement.selection !== 'unselected', 'The residential service-agreement selection is required.');
  if (terms.serviceAgreement.selection === 'buyer_selected') {
    assertCondition(positiveMoney(terms.serviceAgreement.approximateCostInCents), 'The service-agreement cost must be greater than zero.');
    assertCondition(nonNegativeMoney(terms.serviceAgreement.sellerContributionInCents) && terms.serviceAgreement.sellerContributionInCents <= terms.serviceAgreement.approximateCostInCents, 'The seller service-agreement contribution is invalid.');
  }
  assertCondition(!terms.additionalProvisions.included || Boolean(terms.additionalProvisions.partyProvidedText.trim()), 'Included additional provisions must contain party- or attorney-provided text.');
  assertCondition(terms.buyerAffidavitComplianceConfirmed, 'Buyer affidavit-compliance confirmation is required.');
  assertCondition(terms.delivery.timeZone === 'America/Chicago', 'The Oklahoma contract must use the America/Chicago time zone.');
  const expiration = new Date(terms.delivery.expiresAt);
  assertCondition(Number.isFinite(expiration.getTime()) && expiration.getTime() > Date.now(), 'The offer expiration must be a valid future date and time.');
  assertCondition(terms.delivery.electronicDeliveryAuthorized === true, 'Electronic-delivery authorization is required.');
  assertCondition(version.expiresAt === terms.delivery.expiresAt, 'The version expiration does not match the Oklahoma contract terms.');
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) throw new HttpsError('failed-precondition', message);
}
function positiveMoney(value: number): boolean { return Number.isSafeInteger(value) && value > 0; }
function nonNegativeMoney(value: number): boolean { return Number.isSafeInteger(value) && value >= 0; }
function integerBetween(value: number, minimum: number, maximum: number): boolean { return Number.isSafeInteger(value) && value >= minimum && value <= maximum; }
function validDate(value: string): boolean { return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(new Date(`${value}T00:00:00Z`).getTime()); }
