import {tennesseeSubmissionReceiptProblem} from '../../../../../core/domains/offers/state-contracts/tennessee/tennessee-disclosure-policy';
import { isTennesseeContractCompatible } from '../../../../../core/domains/offers/state-contracts/tennessee/tennessee-contract-selection';
import { resolveTennesseePropertyTimeZone } from '../../../../../core/domains/offers/state-contracts/tennessee/tennessee-property-time-zone';
import type { OfferParty } from '../../../../../core/domains/offers/models/offer-party.model';
import type { OfferValidationContext, OfferValidationIssue, OfferValidationResult } from '../../../../../core/domains/offers/models/offer-validation.model';
import type { StateOfferValidator } from '../../../../../core/domains/offers/state-contracts/state-offer-validator';
import type { TennesseeOfferTerms } from '../../../../../core/domains/offers/state-contracts/tennessee/models/tennessee-offer-terms.model';

export class TennesseeOfferValidator implements StateOfferValidator<TennesseeOfferTerms> {
  readonly stateCode = 'TN' as const;
  validate(terms: TennesseeOfferTerms, buyers: OfferParty[], sellers: OfferParty[], context: OfferValidationContext): OfferValidationResult {
    const errors: OfferValidationIssue[] = [];
    const error = (fieldPath: string, message: string) => errors.push({ fieldPath, message, severity: 'error' });
    if (terms.stateCode !== 'TN' || !['navstreet_tennessee_residential_sale_2026','navstreet_tennessee_condominium_resale_2026'].includes(terms.contractType)) error('form', 'Select the NavStreet Tennessee residential agreement.');
    if (terms.property.state !== 'TN') error('property.state', 'The listing must be in Tennessee.');
    if (!isTennesseeContractCompatible(terms.contractType,terms.property.propertyType,terms.property.contractFacts)) error('property.propertyType', 'Condominium, land and other property types need a separate agreement.');
    for (const [side, parties] of [['buyers', buyers], ['sellers', sellers]] as const) {
      if (!parties.length) error(side, `At least one ${side === 'buyers' ? 'buyer' : 'seller'} is required.`);
      parties.forEach((party, index) => {
        if (!party.legalName?.trim()) error(`${side}.${index}.legalName`, 'Enter the legal name.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(party.email?.trim() ?? '')) error(`${side}.${index}.email`, 'Enter a valid email.');
        if (!party.phone?.trim()) error(`${side}.${index}.phone`, 'Enter a phone number.');
      });
    }
    const p = terms.purchase;
    if (!money(p.purchasePriceInCents, true)) error('purchase.purchasePriceInCents', 'Enter a price above $0.');
    if (typeof p.hasEarnestMoney !== 'boolean') error('purchase.hasEarnestMoney', 'Choose whether to offer an initial deposit.');
    if (p.hasEarnestMoney) {
      if (!money(p.earnestMoneyInCents, true)) error('purchase.earnestMoneyInCents', 'Enter the initial deposit.');

      if (!wholeDays(p.earnestMoneyDueDays, 1, 30)) error('purchase.earnestMoneyDueDays', 'Enter 1 to 30 days.');
      if (typeof terms.conditions.additionalEarnestMoney !== 'boolean') error('conditions.additionalEarnestMoney', 'Choose whether to add a second deposit.');
      if (terms.conditions.additionalEarnestMoney) {
        if (!money(p.additionalEarnestMoneyInCents, true)) error('purchase.additionalEarnestMoneyInCents', 'Enter the additional deposit.');
        if (!wholeDays(p.additionalEarnestMoneyDueDays, 1, 60)) error('purchase.additionalEarnestMoneyDueDays', 'Enter 1 to 60 days.');
      }
    } else if (p.hasEarnestMoney === false && (p.earnestMoneyInCents !== 0 || terms.conditions.additionalEarnestMoney === true)) error('purchase.hasEarnestMoney', 'A deposit cannot be due when no initial deposit is offered.');
    if (!['cash', 'conventional'].includes(p.financingType)) error('purchase.financingType', 'Choose the funding method.');
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
    if (terms.conditions.appraisal && !wholeDays(p.loanApprovalDays, 1, 90)) error('purchase.loanApprovalDays', 'Set the appraisal decision period from 1 to 90 days.');
    if ((p.hasEarnestMoney ? p.earnestMoneyInCents : 0) + (terms.conditions.additionalEarnestMoney ? p.additionalEarnestMoneyInCents : 0) > p.purchasePriceInCents) error('purchase.earnestMoneyInCents', 'Total deposits cannot exceed the purchase price.');
    if (p.financingType === 'cash' && (p.loanAmountInCents !== 0 || terms.conditions.financing !== false || terms.conditions.appraisal !== false)) error('purchase.financingType', 'Cash cannot include a loan or loan conditions.');
    if (!money(p.sellerConcessionsInCents) || p.sellerConcessionsInCents > p.purchasePriceInCents) error('purchase.sellerConcessionsInCents', 'Enter valid seller concessions.');
    if (terms.propertyItems.fixturesIncluded !== true) error('propertyItems.fixturesIncluded', 'Existing installed fixtures are included unless specifically excluded.');
    if (terms.conditions.dueDiligence !== true) error('conditions.dueDiligence', 'Set an inspection period.');
    if (typeof terms.conditions.saleOfBuyersProperty !== 'boolean') error('conditions.saleOfBuyersProperty', 'Select Yes or No.');
    const d = terms.deadlines;
    if (d.sellerDisclosureDate && !date(d.sellerDisclosureDate)) error('deadlines.sellerDisclosureDate', 'Enter a valid optional document deadline.');
    if (!date(d.settlementDate)) error('deadlines.settlementDate', 'Set a valid settlement deadline.');
    if (!wholeDays(d.inspectionPeriodDays, 1, 60)) error('deadlines.inspectionPeriodDays', 'Set an inspection period of 1 to 60 days.');
    if (date(d.settlementDate) && date(d.sellerDisclosureDate) && d.sellerDisclosureDate > d.settlementDate) error('deadlines.sellerDisclosureDate', 'Disclosure must be due no later than settlement.');
    if (terms.settlement.possession !== 'at_recording') error('settlement.possession', 'Vacant possession is due at closing; other arrangements require a separate agreement.');
    if (!['buyer', 'seller'].includes(terms.settlement.titlePolicyPayer)) error('settlement.titlePolicyPayer', 'Select who pays the owner’s title policy.');
    if (!wholeDays(terms.settlement.titleEvidenceDaysBeforeClosing, 1, 45)) error('settlement.titleEvidenceDaysBeforeClosing', 'Enter 1 to 45 days.');
    if (terms.settlement.specialAssessmentPayer === 'unselected') error('settlement.specialAssessmentPayer', 'Select who pays special assessments.');
    if (terms.disclosures.sellerReportsHoa === true && terms.settlement.hoaTransferFeePayer === 'unselected') error('settlement.hoaTransferFeePayer', 'Select who pays association transfer fees.');
    if (terms.disclosures.sellerReportsHoa === null) error('disclosures.sellerReportsHoa', 'The seller must answer the association question on the listing.');
    if (terms.disclosures.sellerReportsHoa === true && !['received', 'pending'].includes(terms.disclosures.hoaDocumentsStatus)) error('disclosures.hoaDocumentsStatus', 'Select whether you received the association resale packet.');
    if (terms.disclosures.sellerReportsHoa === false && terms.disclosures.hoaDocumentsStatus !== 'not_applicable') error('disclosures.hoaDocumentsStatus', 'Select that no HOA applies to match the seller’s listing.');
    if (terms.disclosures.leadPaintStatus === 'unselected' || (terms.property.yearBuilt != null && terms.property.yearBuilt < 1978 && !['received', 'exempt', 'pending'].includes(terms.disclosures.leadPaintStatus))) error('disclosures.leadPaintStatus', 'For a pre-1978 home, select whether the signed lead packet has been received or is pending, or confirm a federal exemption.');
    if (terms.property.yearBuilt != null && terms.property.yearBuilt < 1978 && terms.disclosures.leadPaintStatus === 'built_1978_or_later') error('disclosures.leadPaintStatus', 'The listing year indicates this home was built before 1978.');
    if (terms.property.yearBuilt == null && terms.disclosures.leadPaintStatus === 'built_1978_or_later') error('disclosures.leadPaintStatus', 'The year built is unknown; obtain the lead packet or document an exemption.');
    if (terms.disclosures.leadPaintStatus === 'received' && terms.disclosures.leadInspectionSelection === 'unselected') error('disclosures.leadInspectionSelection', 'Select the buyer’s lead inspection option.');
    if (terms.disclosures.leadPaintStatus === 'received' && terms.disclosures.leadInspectionSelection === 'other_period' && (!Number.isSafeInteger(terms.disclosures.leadInspectionDays) || terms.disclosures.leadInspectionDays < 1 || terms.disclosures.leadInspectionDays > 60)) error('disclosures.leadInspectionDays', 'Set an agreed inspection period from 1 through 60 days.');
    if (terms.disclosures.sellerReportsExistingLeases === null) error('disclosures.sellerReportsExistingLeases', 'The seller must answer the leases question on the listing.');
    if (context.mode !== 'draft') {

      const receiptProblem=tennesseeSubmissionReceiptProblem(terms);
      if(receiptProblem) {
        const receipt = [
          [terms.disclosures.conditionDisclosureRequired,'propertyConditionStatus','tennessee-seller-disclosure'],
          [terms.disclosures.requiredKnownFacts,'statutoryPacketStatus','tennessee-statutory-packet'],
          [terms.disclosures.associationPacketRequired,'hoaDocumentsStatus','tennessee-association-documents'],
        ] as const;
        const missing=receipt.find(([required,field,type])=>required&&(terms.disclosures[field]!=='received'||!terms.documentVersions?.[type]));
        error('disclosures.'+(missing?.[1]??'propertyConditionStatus'),receiptProblem);
      }
      if (terms.disclosures.leadPaintStatus === 'pending') error('disclosures.leadPaintStatus', 'Review the lead disclosure or confirm an applicable exemption before submitting.');
    }
    if (terms.conditions.saleOfBuyersProperty && !terms.additionalTerms.trim()) error('additionalTerms', 'Describe the sale of the buyer’s property in additional terms.');
    if (terms.delivery.electronicDeliveryAuthorized !== true) error('delivery.electronicDeliveryAuthorized', 'Electronic delivery consent is required.');
    try { if (terms.delivery.timeZone !== resolveTennesseePropertyTimeZone(terms.property.county,terms.delivery.timeZone)) error('delivery.timeZone', 'Use the property county time zone.'); }
    catch { error('property.county', 'The seller must provide a recognized Tennessee county.'); }
    const expiration = new Date(terms.delivery.expiresAt);
    if (!Number.isFinite(expiration.getTime()) || (context.mode !== 'draft' && expiration.getTime() <= (context.currentDateTime ?? new Date()).getTime())) error('delivery.expiresAt', 'Set a future expiration date and time.');
    return { valid: errors.length === 0, errors, warnings: [] };
  }
}
function money(value: number, positive = false): boolean { return Number.isSafeInteger(value) && (positive ? value > 0 : value >= 0); }
function wholeDays(value: number, min: number, max: number): boolean { return Number.isSafeInteger(value) && value >= min && value <= max; }
function date(value: string): boolean { return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value; }
