import type { OfferParty } from '../../../../../core/domains/offers/models/offer-party.model';
import type { OfferValidationContext, OfferValidationIssue, OfferValidationResult } from '../../../../../core/domains/offers/models/offer-validation.model';
import type { StateOfferValidator } from '../../../../../core/domains/offers/state-contracts/state-offer-validator';
import type { UtahOfferTerms } from '../../../../../core/domains/offers/state-contracts/utah/models/utah-offer-terms.model';

export class UtahOfferValidator implements StateOfferValidator<UtahOfferTerms> {
  readonly stateCode = 'UT' as const;
  validate(terms: UtahOfferTerms, buyers: OfferParty[], sellers: OfferParty[], context: OfferValidationContext): OfferValidationResult {
    const errors: OfferValidationIssue[] = [];
    const error = (fieldPath: string, message: string) => errors.push({ fieldPath, message, severity: 'error' });
    if (terms.stateCode !== 'UT' || terms.contractType !== 'navstreet_utah_residential_sale_2026') error('form', 'Select the NavStreet Utah residential agreement.');
    if (terms.property.state !== 'UT') error('property.state', 'The listing must be in Utah.');
    for (const [side, parties] of [['buyers', buyers], ['sellers', sellers]] as const) {
      if (!parties.length) error(side, `At least one ${side === 'buyers' ? 'buyer' : 'seller'} is required.`);
      parties.forEach((party, index) => {
        if (!party.legalName?.trim()) error(`${side}.${index}.legalName`, 'Enter the legal name.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(party.email?.trim() ?? '')) error(`${side}.${index}.email`, 'Enter a valid email.');
        if (!party.phone?.trim()) error(`${side}.${index}.phone`, 'Enter a phone number.');
      });
    }
    if (!terms.legalDescription.trim()) error('legalDescription', 'Enter the recorded legal description.');
    const p = terms.purchase;
    if (!money(p.purchasePriceInCents, true)) error('purchase.purchasePriceInCents', 'Enter a price above $0.');
    if (!money(p.earnestMoneyInCents, true)) error('purchase.earnestMoneyInCents', 'Enter earnest money above $0.');
    if (!p.earnestMoneyHolder.trim()) error('purchase.earnestMoneyHolder', 'Identify the earnest money holder.');
    if (!Number.isSafeInteger(p.earnestMoneyDueDays) || p.earnestMoneyDueDays < 1 || p.earnestMoneyDueDays > 30) error('purchase.earnestMoneyDueDays', 'Enter 1 to 30 days.');
    if (p.financingType === 'unselected') error('purchase.financingType', 'Choose the funding method.');
    if (p.financingType !== 'cash' && (!money(p.loanAmountInCents, true) || p.loanAmountInCents > p.purchasePriceInCents)) error('purchase.loanAmountInCents', 'Enter a loan amount greater than $0 and no more than the price.');
    if (!money(p.sellerConcessionsInCents) || p.sellerConcessionsInCents > p.purchasePriceInCents) error('purchase.sellerConcessionsInCents', 'Enter valid seller concessions.');
    if (terms.conditions.additionalEarnestMoney && !money(p.additionalEarnestMoneyInCents, true)) error('purchase.additionalEarnestMoneyInCents', 'Enter the additional earnest money.');
    if (terms.propertyItems.waterRightsIncluded === null) error('propertyItems.waterRightsIncluded', 'Select whether water rights are included.');
    for (const key of ['dueDiligence', 'appraisal', 'financing', 'saleOfBuyersProperty', 'additionalEarnestMoney'] as const) if (terms.conditions[key] === null) error(`conditions.${key}`, 'Select Yes or No.');
    if (p.financingType === 'cash' && terms.conditions.financing) error('conditions.financing', 'A cash purchase cannot be conditioned on financing.');
    const d = terms.deadlines;
    for (const [key, label] of [['sellerDisclosureDate', 'seller disclosure'], ['settlementDate', 'settlement']] as const) if (!date(d[key])) error(`deadlines.${key}`, `Set a valid ${label} deadline.`);
    if (terms.conditions.dueDiligence && !date(d.dueDiligenceDate)) error('deadlines.dueDiligenceDate', 'Set the due diligence deadline.');
    if ((terms.conditions.financing || terms.conditions.appraisal) && !date(d.financingAppraisalDate)) error('deadlines.financingAppraisalDate', 'Set the financing and appraisal deadline.');
    if (date(d.settlementDate) && date(d.sellerDisclosureDate) && d.sellerDisclosureDate > d.settlementDate) error('deadlines.sellerDisclosureDate', 'Disclosure must be due no later than settlement.');
    if (terms.settlement.possession === 'unselected') error('settlement.possession', 'Select possession timing.');
    if (terms.settlement.possession !== 'unselected' && terms.settlement.possession !== 'at_recording' && (!Number.isSafeInteger(terms.settlement.possessionDelay) || terms.settlement.possessionDelay < 1 || terms.settlement.possessionDelay > 365)) error('settlement.possessionDelay', 'Enter a delay from 1 through 365.');
    if (terms.settlement.specialAssessmentPayer === 'unselected') error('settlement.specialAssessmentPayer', 'Select who pays special assessments.');
    if (terms.settlement.hoaTransferFeePayer === 'unselected') error('settlement.hoaTransferFeePayer', 'Select who pays association transfer fees.');
    if (terms.disclosures.propertyConditionStatus === 'unselected') error('disclosures.propertyConditionStatus', 'Select the property condition statement status.');
    if (terms.disclosures.leadPaintStatus === 'unselected' || (terms.property.yearBuilt != null && terms.property.yearBuilt < 1978 && terms.disclosures.leadPaintStatus !== 'received' && terms.disclosures.leadPaintStatus !== 'exempt')) error('disclosures.leadPaintStatus', 'For a pre-1978 home, receive the signed lead packet or confirm a federal exemption before signing.');
    if (terms.property.yearBuilt != null && terms.property.yearBuilt < 1978 && terms.disclosures.leadPaintStatus === 'built_1978_or_later') error('disclosures.leadPaintStatus', 'The listing year indicates this home was built before 1978.');
    if (terms.disclosures.leadPaintStatus === 'received' && terms.disclosures.leadInspectionSelection === 'unselected') error('disclosures.leadInspectionSelection', 'Select the buyer’s lead inspection option.');
    if (terms.disclosures.leadPaintStatus === 'received' && terms.disclosures.leadInspectionSelection === 'other_period' && (!Number.isSafeInteger(terms.disclosures.leadInspectionDays) || terms.disclosures.leadInspectionDays < 1 || terms.disclosures.leadInspectionDays > 60)) error('disclosures.leadInspectionDays', 'Set an agreed inspection period from 1 through 60 days.');
    if (terms.disclosures.hoaDocumentsStatus === 'unselected') error('disclosures.hoaDocumentsStatus', 'Select the association documents status.');
    if (terms.disclosures.sellerReportsCurrentMethContamination === null) error('disclosures.sellerReportsCurrentMethContamination', 'The seller must answer the contamination question on the listing.');
    if (terms.conditions.saleOfBuyersProperty && !terms.additionalTerms.trim()) error('additionalTerms', 'Describe the sale of the buyer’s property in additional terms.');
    if (terms.disclosures.methamphetamineContaminationAcknowledged !== true) error('disclosures.methamphetamineContaminationAcknowledged', 'Review and acknowledge the seller statement.');
    if (terms.delivery.electronicDeliveryAuthorized !== true) error('delivery.electronicDeliveryAuthorized', 'Electronic delivery consent is required.');
    const expiration = new Date(terms.delivery.expiresAt);
    if (!Number.isFinite(expiration.getTime()) || (context.mode !== 'draft' && expiration.getTime() <= (context.currentDateTime ?? new Date()).getTime())) error('delivery.expiresAt', 'Set a future expiration date and time.');
    return { valid: errors.length === 0, errors, warnings: [] };
  }
}
function money(value: number, positive = false): boolean { return Number.isSafeInteger(value) && (positive ? value > 0 : value >= 0); }
function date(value: string): boolean { return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`)); }
