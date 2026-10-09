import { record, text, money, integer, bool, choice } from '../draft-term-values';
import type { SanitizeDraftTermsInput } from '../state-contract-package';
import type { UtahOfferTermsDocument } from './utah-offer-terms.document';
export function sanitizeUtahDraftTerms(input: SanitizeDraftTermsInput<UtahOfferTermsDocument>): UtahOfferTermsDocument {
  const request = record(input.requestedTerms); const purchase = record(request['purchase']); const deadlines = record(request['deadlines']);
  const conditions = record(request['conditions']); const items = record(request['propertyItems']); const settlement = record(request['settlement']);
  const disclosures = record(request['disclosures']); const delivery = record(request['delivery']);
  return {
    ...input.currentTerms, // Preserve state, contract type, and immutable property snapshot.
    legalDescription: input.currentTerms.legalDescription, // Seller-supplied listing snapshot; the buyer cannot replace it.
    purchase: { purchasePriceInCents: money(purchase['purchasePriceInCents']), earnestMoneyInCents: money(purchase['earnestMoneyInCents']), additionalEarnestMoneyInCents: money(purchase['additionalEarnestMoneyInCents']), earnestMoneyHolder: text(purchase['earnestMoneyHolder'], 300), earnestMoneyDueDays: integer(purchase['earnestMoneyDueDays']), financingType: choice(purchase['financingType'], ['unselected', 'cash', 'conventional', 'fha', 'va', 'usda'] as const, 'unselected'), loanAmountInCents: money(purchase['loanAmountInCents']), sellerConcessionsInCents: money(purchase['sellerConcessionsInCents']) },
    deadlines: { sellerDisclosureDate: text(deadlines['sellerDisclosureDate'], 10), dueDiligenceDate: text(deadlines['dueDiligenceDate'], 10), financingAppraisalDate: text(deadlines['financingAppraisalDate'], 10), settlementDate: text(deadlines['settlementDate'], 10) },
    conditions: { dueDiligence: bool(conditions['dueDiligence']), appraisal: bool(conditions['appraisal']), financing: bool(conditions['financing']), saleOfBuyersProperty: bool(conditions['saleOfBuyersProperty']), additionalEarnestMoney: bool(conditions['additionalEarnestMoney']) },
    propertyItems: { included: text(items['included'], 3000), excluded: text(items['excluded'], 3000), waterRightsIncluded: bool(items['waterRightsIncluded']), excludedWaterRights: text(items['excludedWaterRights'], 2000) },
    settlement: { possession: choice(settlement['possession'], ['unselected', 'at_recording', 'hours_after', 'days_after'] as const, 'unselected'), possessionDelay: integer(settlement['possessionDelay']), specialAssessmentPayer: choice(settlement['specialAssessmentPayer'], ['unselected', 'buyer', 'seller', 'split'] as const, 'unselected'), hoaTransferFeePayer: choice(settlement['hoaTransferFeePayer'], ['unselected', 'buyer', 'seller', 'split'] as const, 'unselected') },
    disclosures: { sellerReportsCurrentMethContamination: input.currentTerms.disclosures.sellerReportsCurrentMethContamination, propertyConditionStatus: choice(disclosures['propertyConditionStatus'], ['unselected', 'received', 'pending'] as const, 'unselected'), leadPaintStatus: choice(disclosures['leadPaintStatus'], ['unselected', 'received', 'built_1978_or_later', 'exempt'] as const, 'unselected'), leadInspectionSelection: choice(disclosures['leadInspectionSelection'], ['unselected', 'ten_days', 'waived', 'other_period'] as const, 'unselected'), leadInspectionDays: integer(disclosures['leadInspectionDays']), hoaDocumentsStatus: choice(disclosures['hoaDocumentsStatus'], ['unselected', 'received', 'pending', 'not_applicable'] as const, 'unselected'), methamphetamineContaminationAcknowledged: bool(disclosures['methamphetamineContaminationAcknowledged']) },
    additionalTerms: text(request['additionalTerms'], 5000),
    delivery: { expiresAt: text(delivery['expiresAt'], 40), timeZone: 'America/Denver', electronicDeliveryAuthorized: bool(delivery['electronicDeliveryAuthorized']) },
  };
}
