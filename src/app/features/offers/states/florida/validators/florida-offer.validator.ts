import type { OfferParty } from '../../../../../core/domains/offers/models/offer-party.model';
import type { OfferValidationContext, OfferValidationIssue, OfferValidationResult } from '../../../../../core/domains/offers/models/offer-validation.model';
import type { StateOfferValidator } from '../../../../../core/domains/offers/state-contracts/state-offer-validator';
import type { FloridaOfferTerms } from '../../../../../core/domains/offers/state-contracts/florida/models/florida-offer-terms.model';

export class FloridaOfferValidator implements StateOfferValidator<FloridaOfferTerms> {
  readonly stateCode = 'FL' as const;
  validate(terms: FloridaOfferTerms, buyers: OfferParty[], sellers: OfferParty[], context: OfferValidationContext): OfferValidationResult {
    const errors: OfferValidationIssue[] = [];
    const error = (fieldPath: string, message: string) => errors.push({ fieldPath, message, severity: 'error' });
    if (terms.stateCode !== 'FL' || terms.contractType !== 'navstreet_florida_residential_sale_2026') error('form', 'Select the NavStreet Florida residential agreement.');
    if (terms.property.state !== 'FL') error('property.state', 'The listing must be in Florida.');
    if (!['single_family', 'townhome', 'pud'].includes(terms.property.propertyType)) error('property.propertyType', 'Condominium, land and other property types need a separate agreement.');
    for (const [side, parties] of [['buyers', buyers], ['sellers', sellers]] as const) {
      if (!parties.length) error(side, `At least one ${side === 'buyers' ? 'buyer' : 'seller'} is required.`);
      parties.forEach((party, index) => {
        if (!party.legalName?.trim()) error(`${side}.${index}.legalName`, 'Enter the legal name.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(party.email?.trim() ?? '')) error(`${side}.${index}.email`, 'Enter a valid email.');
        if (!party.phone?.trim()) error(`${side}.${index}.phone`, 'Enter a phone number.');
      });
    }
    if (!terms.legalDescription.trim()) error('legalDescription', 'The seller must provide the recorded legal description on the listing.');
    const p = terms.purchase;
    if (!money(p.purchasePriceInCents, true)) error('purchase.purchasePriceInCents', 'Enter a price above $0.');
    if (typeof p.hasEarnestMoney !== 'boolean') error('purchase.hasEarnestMoney', 'Choose whether to offer an initial deposit.');
    if (p.hasEarnestMoney) {
      if (!money(p.earnestMoneyInCents, true)) error('purchase.earnestMoneyInCents', 'Enter the initial deposit.');
      if (!p.earnestMoneyHolder.trim()) error('purchase.earnestMoneyHolder', 'Identify the escrow holder.');
      if (!wholeDays(p.earnestMoneyDueDays, 1, 30)) error('purchase.earnestMoneyDueDays', 'Enter 1 to 30 days.');
      if (typeof terms.conditions.additionalEarnestMoney !== 'boolean') error('conditions.additionalEarnestMoney', 'Choose whether to add a second deposit.');
      if (terms.conditions.additionalEarnestMoney) {
        if (!money(p.additionalEarnestMoneyInCents, true)) error('purchase.additionalEarnestMoneyInCents', 'Enter the additional deposit.');
        if (!wholeDays(p.additionalEarnestMoneyDueDays, 1, 60)) error('purchase.additionalEarnestMoneyDueDays', 'Enter 1 to 60 days.');
      }
    } else if (p.hasEarnestMoney === false && (p.earnestMoneyInCents !== 0 || terms.conditions.additionalEarnestMoney === true)) error('purchase.hasEarnestMoney', 'A deposit cannot be due when no initial deposit is offered.');
    if (p.financingType === 'unselected') error('purchase.financingType', 'Choose the funding method.');
    if (p.financingType !== 'cash' && p.financingType !== 'unselected') {
      if (!money(p.loanAmountInCents, true) || p.loanAmountInCents > p.purchasePriceInCents) error('purchase.loanAmountInCents', 'Enter a loan amount greater than $0 and no more than the price.');
      if (!wholeDays(p.loanTermYears, 1, 40)) error('purchase.loanTermYears', 'Enter a loan term of 1 to 40 years.');
      if (typeof terms.conditions.financing !== 'boolean') error('conditions.financing', 'Choose whether approval is a condition.');
      if (typeof terms.conditions.appraisal !== 'boolean') error('conditions.appraisal', 'Choose whether an appraisal is a condition.');
      if (terms.conditions.financing) {
        if (!wholeDays(p.loanApplicationDays, 1, 30)) error('purchase.loanApplicationDays', 'Enter 1 to 30 days to apply.');
        if (!wholeDays(p.loanApprovalDays, 1, 90)) error('purchase.loanApprovalDays', 'Enter 1 to 90 days for loan approval.');
      }
    }
    if (p.financingType === 'cash' && (p.loanAmountInCents !== 0 || terms.conditions.financing !== false || terms.conditions.appraisal !== false)) error('purchase.financingType', 'Cash cannot include a loan or loan conditions.');
    if (!money(p.sellerConcessionsInCents) || p.sellerConcessionsInCents > p.purchasePriceInCents) error('purchase.sellerConcessionsInCents', 'Enter valid seller concessions.');
    if (terms.propertyItems.fixturesIncluded !== true) error('propertyItems.fixturesIncluded', 'Existing installed fixtures are included unless specifically excluded.');
    if (terms.conditions.dueDiligence !== true) error('conditions.dueDiligence', 'Set an AS IS inspection period.');
    if (typeof terms.conditions.saleOfBuyersProperty !== 'boolean') error('conditions.saleOfBuyersProperty', 'Select Yes or No.');
    const d = terms.deadlines;
    if (d.sellerDisclosureDate && !date(d.sellerDisclosureDate)) error('deadlines.sellerDisclosureDate', 'Enter a valid optional document deadline.');
    if (!date(d.settlementDate)) error('deadlines.settlementDate', 'Set a valid settlement deadline.');
    if (!wholeDays(d.inspectionPeriodDays, 1, 60)) error('deadlines.inspectionPeriodDays', 'Set an inspection period of 1 to 60 days.');
    if (date(d.settlementDate) && date(d.sellerDisclosureDate) && d.sellerDisclosureDate > d.settlementDate) error('deadlines.sellerDisclosureDate', 'Disclosure must be due no later than settlement.');
    if (terms.settlement.possession !== 'at_recording') error('settlement.possession', 'Vacant possession is due at closing; other arrangements require a separate agreement.');
    if (!['buyer', 'seller'].includes(terms.settlement.titlePolicyPayer)) error('settlement.titlePolicyPayer', 'Select who pays the owner’s title policy.');
    if (!terms.settlement.closingAgentName.trim()) error('settlement.closingAgentName', 'Name the closing agent.');
    if (!wholeDays(terms.settlement.titleEvidenceDaysBeforeClosing, 1, 45)) error('settlement.titleEvidenceDaysBeforeClosing', 'Enter 1 to 45 days.');
    if (terms.settlement.specialAssessmentPayer === 'unselected') error('settlement.specialAssessmentPayer', 'Select who pays special assessments.');
    if (terms.disclosures.sellerReportsHoa === true && terms.settlement.hoaTransferFeePayer === 'unselected') error('settlement.hoaTransferFeePayer', 'Select who pays association transfer fees.');
    if (!['received', 'pending'].includes(terms.disclosures.propertyConditionStatus)) error('disclosures.propertyConditionStatus', 'Select whether you received the seller condition statement.');
    if (!['received', 'pending'].includes(terms.disclosures.floodStatus)) error('disclosures.floodStatus', 'Select whether you received the statutory flood disclosure.');
    if (terms.disclosures.sellerReportsHoa === null) error('disclosures.sellerReportsHoa', 'The seller must answer the association question on the listing.');
    if (terms.disclosures.sellerReportsHoa === true && !['received', 'pending'].includes(terms.disclosures.hoaDocumentsStatus)) error('disclosures.hoaDocumentsStatus', 'Select whether you received the HOA disclosure summary.');
    if (terms.disclosures.sellerReportsHoa === false && terms.disclosures.hoaDocumentsStatus !== 'not_applicable') error('disclosures.hoaDocumentsStatus', 'Select that no HOA applies to match the seller’s listing.');
    if (terms.disclosures.taxNoticeAcknowledged !== true) error('disclosures.taxNoticeAcknowledged', 'Read and acknowledge the Florida property tax notice.');
    if (terms.disclosures.radonNoticeAcknowledged !== true) error('disclosures.radonNoticeAcknowledged', 'Read and acknowledge the Florida radon notice.');
    if (terms.disclosures.leadPaintStatus === 'unselected' || (terms.property.yearBuilt != null && terms.property.yearBuilt < 1978 && !['received', 'exempt', 'pending'].includes(terms.disclosures.leadPaintStatus))) error('disclosures.leadPaintStatus', 'For a pre-1978 home, select whether the signed lead packet has been received or is pending, or confirm a federal exemption.');
    if (terms.property.yearBuilt != null && terms.property.yearBuilt < 1978 && terms.disclosures.leadPaintStatus === 'built_1978_or_later') error('disclosures.leadPaintStatus', 'The listing year indicates this home was built before 1978.');
    if (terms.property.yearBuilt == null && terms.disclosures.leadPaintStatus === 'built_1978_or_later') error('disclosures.leadPaintStatus', 'The year built is unknown; obtain the lead packet or document an exemption.');
    if (terms.disclosures.leadPaintStatus === 'received' && terms.disclosures.leadInspectionSelection === 'unselected') error('disclosures.leadInspectionSelection', 'Select the buyer’s lead inspection option.');
    if (terms.disclosures.leadPaintStatus === 'received' && terms.disclosures.leadInspectionSelection === 'other_period' && (!Number.isSafeInteger(terms.disclosures.leadInspectionDays) || terms.disclosures.leadInspectionDays < 1 || terms.disclosures.leadInspectionDays > 60)) error('disclosures.leadInspectionDays', 'Set an agreed inspection period from 1 through 60 days.');
    if (terms.disclosures.sellerReportsExistingLeases === null) error('disclosures.sellerReportsExistingLeases', 'The seller must answer the leases question on the listing.');
    if (context.mode !== 'draft') {
      if (terms.disclosures.floodStatus !== 'received') error('disclosures.floodStatus', 'Review the uploaded flood disclosure before submitting.');
      if (terms.disclosures.sellerReportsHoa && terms.disclosures.hoaDocumentsStatus !== 'received') error('disclosures.hoaDocumentsStatus', 'Review the uploaded HOA summary before submitting.');
      if (terms.disclosures.leadPaintStatus === 'pending') error('disclosures.leadPaintStatus', 'Review the lead disclosure or confirm an applicable exemption before submitting.');
    }
    if (terms.conditions.saleOfBuyersProperty && !terms.additionalTerms.trim()) error('additionalTerms', 'Describe the sale of the buyer’s property in additional terms.');
    if (terms.disclosures.leaseStatementAcknowledged !== true) error('disclosures.leaseStatementAcknowledged', 'Acknowledge the lease statement and your report selection.');
    if (terms.delivery.electronicDeliveryAuthorized !== true) error('delivery.electronicDeliveryAuthorized', 'Electronic delivery consent is required.');
    const expiration = new Date(terms.delivery.expiresAt);
    if (!Number.isFinite(expiration.getTime()) || (context.mode !== 'draft' && expiration.getTime() <= (context.currentDateTime ?? new Date()).getTime())) error('delivery.expiresAt', 'Set a future expiration date and time.');
    return { valid: errors.length === 0, errors, warnings: [] };
  }
}
function money(value: number, positive = false): boolean { return Number.isSafeInteger(value) && (positive ? value > 0 : value >= 0); }
function wholeDays(value: number, min: number, max: number): boolean { return Number.isSafeInteger(value) && value >= min && value <= max; }
function date(value: string): boolean { return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`)); }