import { minnesotaAssociationPacketProblem } from './minnesota-association-packet';
import { validateSubmissionParties } from '../submission-parties';
import { requireValue, money, days } from '../submission-values';
import type { ValidateStateSubmissionInput } from '../state-contract-package';
import type { MinnesotaOfferTermsDocument } from './minnesota-offer-terms.document';
export function validateMinnesotaSubmission(input: ValidateStateSubmissionInput<MinnesotaOfferTermsDocument>): void {
  const { offer, version } = input; const t = version.terms; const p = t.purchase; const d = t.deadlines;
  requireValue(offer.stateCode === 'MN' && version.stateCode === 'MN' && t.stateCode === 'MN', 'The offer must belong to Minnesota.');
  requireValue(offer.currentVersionUid === version.Uid && version.offerUid === offer.Uid && version.status === 'draft' && version.immutable === false, 'Only the current mutable version can be submitted.');
  requireValue(t.contractType === 'navstreet_minnesota_residential_sale_2026' && t.property.listingUid === offer.listingUid && t.property.state === 'MN', 'The contract or property snapshot is invalid.');
  requireValue(['single_family', 'townhome', 'pud'].includes(t.property.propertyType), 'Condominium, vacant land and other property types need a separate Minnesota agreement.');
  validateSubmissionParties(version);
  requireValue(t.legalDescription.trim(), 'The seller must provide the recorded legal description on the listing.');
  requireValue(money(p.purchasePriceInCents, true) && typeof p.hasEarnestMoney === 'boolean', 'Select a valid price and whether a deposit is offered.');
  if (p.hasEarnestMoney) {
    requireValue(money(p.earnestMoneyInCents, true) && p.earnestMoneyHolder.trim() && days(p.earnestMoneyDueDays, 1, 30), 'Complete the initial deposit, escrow holder and delivery period.');
    requireValue(typeof t.conditions.additionalEarnestMoney === 'boolean', 'Select whether an additional deposit is due.');
    if (t.conditions.additionalEarnestMoney) requireValue(money(p.additionalEarnestMoneyInCents, true) && days(p.additionalEarnestMoneyDueDays, 1, 60), 'Complete the additional deposit and delivery period.');
  } else requireValue(p.earnestMoneyInCents === 0 && t.conditions.additionalEarnestMoney === false, 'No deposit is due when no initial deposit is offered.');
  requireValue(p.financingType !== 'unselected' && ['cash','conventional'].includes(p.financingType), 'Choose cash or financing.');
  if (p.financingType === 'cash') requireValue(p.loanAmountInCents === 0 && t.conditions.financing === false && t.conditions.appraisal === false, 'Cash cannot include a loan or loan conditions.');
  else {
    requireValue(money(p.loanAmountInCents, true) && p.loanAmountInCents <= p.purchasePriceInCents && days(p.loanTermYears, 1, 40), 'Enter the loan amount and term.');
    requireValue(typeof t.conditions.financing === 'boolean' && typeof t.conditions.appraisal === 'boolean', 'Choose financing and appraisal conditions.');
    if (t.conditions.financing) requireValue(days(p.loanApplicationDays, 1, 30) && days(p.loanApprovalDays, 1, 90), 'Choose the application and approval periods.');
  }
  requireValue(!t.conditions.appraisal || days(p.loanApprovalDays, 1, 90), 'Set an appraisal decision period from 1 to 90 days.');
  requireValue((p.hasEarnestMoney ? p.earnestMoneyInCents : 0) + (t.conditions.additionalEarnestMoney ? p.additionalEarnestMoneyInCents : 0) <= p.purchasePriceInCents, 'Total deposits cannot exceed the purchase price.');
  requireValue(money(p.sellerConcessionsInCents) && p.sellerConcessionsInCents <= p.purchasePriceInCents, 'Enter valid seller concessions.');
  requireValue(t.propertyItems.fixturesIncluded === true && t.conditions.dueDiligence === true, 'Installed fixtures and an inspection period are required.');
  requireValue(typeof t.conditions.saleOfBuyersProperty === 'boolean', 'Select whether another property must sell.');
  requireValue(date(d.settlementDate) && (!d.sellerDisclosureDate || (date(d.sellerDisclosureDate) && d.sellerDisclosureDate <= d.settlementDate)), 'Optional document and settlement deadlines must be valid and ordered.');
  requireValue(days(d.inspectionPeriodDays, 1, 60), 'Choose an inspection period of 1 to 60 days.');
  requireValue(t.settlement.possession === 'at_recording' && t.settlement.specialAssessmentPayer !== 'unselected', 'Complete possession and special assessment allocation.');
  requireValue(['buyer', 'seller'].includes(t.settlement.titlePolicyPayer) && t.settlement.closingAgentName.trim() && days(t.settlement.titleEvidenceDaysBeforeClosing, 1, 45), 'Complete title insurance, closing agent and title evidence period.');
  requireValue(t.disclosures.sellerReportsHoa !== true || t.settlement.hoaTransferFeePayer !== 'unselected', 'Allocate association transfer fees.');
  requireValue(t.disclosures.propertyConditionStatus === 'received', 'Select whether you received the seller condition statement.');
  requireValue(t.disclosures.statutoryPacketStatus === 'received', 'Review the seller-signed Minnesota property-specific statutory disclosure packet before submitting. Ask the seller to upload it if it is missing.');
  requireValue(typeof t.disclosures.sellerReportsHoa === 'boolean', 'The listing must state whether an HOA applies.');
  requireValue(t.disclosures.sellerReportsHoa ? t.disclosures.hoaDocumentsStatus === 'received' : t.disclosures.hoaDocumentsStatus === 'not_applicable', 'Review the association resale packet before submitting when an association applies.');
  requireValue(t.disclosures.taxNoticeAcknowledged === true && t.disclosures.radonNoticeAcknowledged === true, 'Read and acknowledge the Minnesota tax and radon notices.');
  requireValue(t.disclosures.leadPaintStatus !== 'unselected', 'Select lead paint status.');
  requireValue(t.property.yearBuilt == null || t.property.yearBuilt >= 1978 || ['received','exempt','pending'].includes(t.disclosures.leadPaintStatus), 'Choose whether the pre-1978 lead packet is received, pending, or exempt.');
  requireValue(t.disclosures.leadPaintStatus !== 'pending', 'Review the applicable lead disclosure before submitting, or document a valid exemption.');
  requireValue(t.property.yearBuilt != null || t.disclosures.leadPaintStatus !== 'built_1978_or_later', 'The listing has no construction year; a post-1977 claim needs support.');
  requireValue(typeof t.disclosures.sellerReportsExistingLeases === 'boolean', 'Seller must state whether leases exist.');
  requireValue(!t.conditions.saleOfBuyersProperty || t.additionalTerms.trim(), 'Describe the sale of buyer’s property in additional terms.');
  requireValue(t.disclosures.leadPaintStatus !== 'received' || t.disclosures.leadInspectionSelection !== 'unselected', 'Choose the federal lead inspection opportunity.');
  requireValue(t.disclosures.leadInspectionSelection !== 'other_period' || (Number.isSafeInteger(t.disclosures.leadInspectionDays) && t.disclosures.leadInspectionDays >= 1 && t.disclosures.leadInspectionDays <= 60), 'Enter 1 to 60 agreed lead inspection days.');
  requireValue(t.disclosures.leaseStatementAcknowledged === true, 'Acknowledge the lease statement and your report selection.');
  requireValue(t.delivery.timeZone === 'America/Chicago' && t.delivery.electronicDeliveryAuthorized === true, 'Electronic delivery consent and property time zone are required.');
  if (t.disclosures.sellerReportsHoa) requireValue(!minnesotaAssociationPacketProblem(t.disclosures.associationCertificateDate, t.disclosures.associationPacketReceivedDate), 'Review a complete association packet and a certificate not more than 90 days old.');
  const expiration = new Date(t.delivery.expiresAt);
  requireValue(Number.isFinite(expiration.getTime()) && expiration.getTime() > Date.now() && version.expiresAt === t.delivery.expiresAt, 'Enter a future offer expiration matching the version.');
}
function date(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = Date.parse(value + 'T12:00:00Z');
  return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === value;
}
