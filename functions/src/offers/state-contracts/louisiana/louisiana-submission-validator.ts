import { HttpsError } from 'firebase-functions/v2/https';
import type { ValidateStateSubmissionInput } from '../state-contract-package';
import type { LouisianaOfferTermsDocument } from './louisiana-offer-terms.document';

const requireValue = (ok: unknown, message: string): void => { if (!ok) throw new HttpsError('failed-precondition', message); };
const money = (v: number, positive = false) => Number.isSafeInteger(v) && (positive ? v > 0 : v >= 0);
const days = (v: number, min: number, max: number) => Number.isSafeInteger(v) && v >= min && v <= max;
const date = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T12:00:00Z`));

export function validateLouisianaSubmission({ offer, version }: ValidateStateSubmissionInput<LouisianaOfferTermsDocument>): void {
  const t = version.terms, p = t.purchase, c = t.conditions, d = t.deadlines;
  requireValue(offer.stateCode === 'LA' && version.stateCode === 'LA' && t.stateCode === 'LA', 'Louisiana offer state mismatch.');
  requireValue(offer.currentVersionUid === version.Uid && version.offerUid === offer.Uid && version.status === 'draft' && version.immutable === false, 'Submit the current mutable draft version.');
  requireValue(t.contractType === 'lrec_louisiana_residential_agreement_2026' && t.property.listingUid === offer.listingUid && t.property.state === 'LA', 'The Louisiana contract or property snapshot is invalid.');
  requireValue(['single_family', 'townhome', 'pud'].includes(t.property.propertyType), 'The LREC residential agreement is not configured for this property type.');
  requireValue(version.buyers.length > 0 && version.sellers.length > 0, 'Identify at least one buyer and one seller.');
  for (const party of [...version.buyers, ...version.sellers]) {
    requireValue(party.legalName?.trim(), 'Every party needs a legal name.');
    requireValue(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(party.email?.trim() ?? ''), 'Every party needs a valid email.');
    requireValue(party.phone?.trim(), 'Every party needs a phone number.');
  }
  const initiatingSide = version.initiatedBy === 'buyer' ? version.buyers : version.sellers;
  requireValue(initiatingSide.some(party => party.userUid === version.initiatedByUid && party.identityVerification.status === 'verified'), 'The initiating signer must verify identity.');
  requireValue(t.legalDescription.trim(), 'The seller must provide the recorded legal description.');
  requireValue(typeof t.propertyItems.mineralRightsReserved === 'boolean', 'Select whether mineral rights are reserved.');
  requireValue(!t.propertyItems.mineralRightsReserved || (t.propertyItems.mineralRightsPercent > 0 && t.propertyItems.mineralRightsPercent <= 100), 'Enter 1 to 100 percent of seller-owned mineral rights reserved.');
  requireValue(money(p.purchasePriceInCents, true) && typeof p.hasEarnestMoney === 'boolean', 'Choose a valid price and buyer deposit.');
  if (p.hasEarnestMoney) {
    requireValue(money(p.earnestMoneyInCents, true) && p.earnestMoneyHolder.trim() && ['check', 'certified_funds', 'electronic_transfer'].includes(p.depositMethod), 'Complete the buyer deposit, holder, and payment method.');
  } else requireValue(p.earnestMoneyInCents === 0 && p.depositMethod === 'none', 'A no-deposit offer cannot promise a deposit.');
  requireValue(['cash', 'financed'].includes(p.financingType), 'Choose all cash or financed sale.');
  if (p.financingType === 'cash') requireValue(p.loanAmountInCents === 0 && days(p.cashProofDays, 1, 30), 'Enter 1 to 30 days for cash proof and no loan.');
  if (p.financingType === 'financed') {
    requireValue(money(p.loanAmountInCents, true) && p.loanAmountInCents <= p.purchasePriceInCents, 'Enter a proposed loan no greater than the sale price.');
    requireValue(p.maxInterestRatePercent > 0 && p.maxInterestRatePercent <= 30 && days(p.loanTermYears, 1, 40), 'Enter the maximum initial interest rate and loan term.');
    requireValue(p.financingSource !== 'unselected' && days(p.loanApplicationDays, 1, 30), 'Choose financing and loan application deadline.');
    requireValue(p.financingSource !== 'other' || p.otherFinancingConditions.trim(), 'Describe other financing conditions.');
  }
  requireValue(money(p.sellerConcessionsInCents) && money(p.buyerBrokerCompensationInCents), 'Enter valid nonnegative seller contributions.');
  requireValue(typeof c.saleOfBuyersProperty === 'boolean' && (!c.saleOfBuyersProperty || c.saleOfBuyersPropertyTerms.trim()), 'Describe any other-property sale condition.');
  requireValue(days(d.inspectionPeriodDays, 1, 90) && date(d.settlementDate) && days(d.titleCureDays, 1, 180), 'Complete inspection, Act of Sale, and title cure deadlines.');
  requireValue(days(c.privateWaterSystems, 0, 20) && days(c.privateSepticSystems, 0, 20), 'State the private water and septic system counts.');
  requireValue(typeof c.appraisal === 'boolean', 'Select the appraisal condition.');
  requireValue(!c.appraisal || (days(d.appraisalCopyDays, 1, 30) && days(d.appraisalResponseDays, 1, 30)), 'Complete low-appraisal delivery and decision periods.');
  requireValue(['with_warranties', 'as_is', 'new_home_warranty'].includes(c.warranty), 'Choose the Louisiana warranty election.');
  requireValue(['will', 'will_not'].includes(c.homeServiceWarranty), 'Choose whether to buy a home service warranty.');
  if (c.homeServiceWarranty === 'will') requireValue(money(c.homeServiceWarrantyCostInCents, true) && c.homeServiceWarrantyPayer !== 'unselected' && c.homeServiceWarrantyOrderedBy.trim(), 'Complete home service warranty cost, payer and orderer.');
  requireValue(t.disclosures.propertyDisclosureStatus === 'received', 'The buyer must receive the seller-signed Louisiana Property Disclosure Document before submitting an offer.');
  requireValue(
    t.disclosures.leadPaintStatus !== 'pending' &&
    t.disclosures.leadPaintStatus !== 'unselected' &&
    t.disclosures.leadPaintStatus !== 'exempt',
    'Review the uploaded federal lead packet and select the applicable lead disclosure status before submitting.'
  );
  requireValue(!(t.property.yearBuilt != null && t.property.yearBuilt < 1978 && t.disclosures.leadPaintStatus === 'built_1978_or_later'), 'The listing year indicates a pre-1978 home.');
  requireValue(t.property.yearBuilt != null || t.disclosures.leadPaintStatus !== 'built_1978_or_later', 'A post-1977 claim requires a known construction year.');
  requireValue(t.disclosures.leadPaintStatus !== 'received' || t.disclosures.leadInspectionSelection !== 'unselected', 'Select the buyer lead inspection opportunity.');
  requireValue(t.disclosures.leadInspectionSelection !== 'other_period' || days(t.disclosures.leadInspectionDays, 1, 60), 'Enter 1 to 60 agreed lead inspection days.');
  requireValue(t.delivery.timeZone === 'America/Chicago' && t.delivery.electronicDeliveryAuthorized === true, 'Louisiana time and electronic delivery consent are required.');
  const expiration = new Date(t.delivery.expiresAt);
  requireValue(Number.isFinite(expiration.getTime()) && expiration.getTime() > Date.now() && version.expiresAt === t.delivery.expiresAt, 'Enter a matching future offer expiration.');
}