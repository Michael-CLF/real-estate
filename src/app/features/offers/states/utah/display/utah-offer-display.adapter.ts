import type { UtahOfferTerms } from '../../../../../core/domains/offers/state-contracts/utah/models/utah-offer-terms.model';
import type { StateOfferDisplayAdapter } from '../../../engine/display/state-offer-display.adapter';
export const utahOfferDisplayAdapter: StateOfferDisplayAdapter<UtahOfferTerms> = {
  stateCode: 'UT',
  display(terms) {
    return {
      agreementTitle: 'NavStreet Utah Residential Purchase and Sale Agreement',
      documentLabel: 'NavStreet Utah agreement PDF',
      purchasePriceInCents: terms.purchase.purchasePriceInCents,
      fundingLabel: terms.purchase.financingType === 'cash' ? 'Cash' : `${terms.purchase.financingType.toUpperCase()} loan`,
      depositLabel: 'Earnest money', depositInCents: terms.purchase.earnestMoneyInCents,
      depositDelivery: { label: 'Earnest money delivery', value: `${terms.purchase.earnestMoneyDueDays} days after acceptance` },
      escrowAgent: terms.purchase.earnestMoneyHolder || 'Not provided',
      importantDeadline: { label: 'Due diligence deadline', value: terms.deadlines.dueDiligenceDate || 'Not applicable' },
      closingDate: { label: 'Settlement deadline', value: terms.deadlines.settlementDate },
      possessionLabel: terms.settlement.possession === 'at_recording' ? 'At recording' : `${terms.settlement.possessionDelay} ${terms.settlement.possession === 'hours_after' ? 'hours' : 'days'} after recording`,
    };
  },
};
