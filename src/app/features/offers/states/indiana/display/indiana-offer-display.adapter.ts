import type { IndianaOfferTerms } from '../../../../../core/domains/offers/state-contracts/indiana/models/indiana-offer-terms.model';
import type { StateOfferDisplayAdapter } from '../../../engine/display/state-offer-display.adapter';
export const indianaOfferDisplayAdapter: StateOfferDisplayAdapter<IndianaOfferTerms> = {
  stateCode: 'IN',
  display(terms) {
    return {
      agreementTitle: 'NavStreet Indiana Residential Purchase and Sale Agreement',
      documentLabel: 'NavStreet Indiana agreement PDF',
      purchasePriceInCents: terms.purchase.purchasePriceInCents,
      fundingLabel: terms.purchase.financingType === 'cash' ? 'Cash' : `${terms.purchase.financingType.toUpperCase()} loan`,
      depositLabel: 'Earnest money', depositInCents: terms.purchase.earnestMoneyInCents,
      depositDelivery: { label: 'Initial deposit delivery', value: terms.purchase.hasEarnestMoney ? `${terms.purchase.earnestMoneyDueDays} days after acceptance` : 'No initial deposit' },
      escrowAgent: terms.purchase.hasEarnestMoney ? terms.purchase.earnestMoneyHolder : 'No initial deposit',
      importantDeadline: { label: 'inspection period', value: `${terms.deadlines.inspectionPeriodDays} calendar days after acceptance` },
      closingDate: { label: 'Settlement deadline', value: terms.deadlines.settlementDate },
      possessionLabel: 'Vacant at closing',
      sellerSigningBlockReason: !['received','exempt'].includes(terms.disclosures.propertyConditionStatus)
        ? 'Before seller acceptance, deliver the Indiana condition disclosure or supported exemption. This version records it as pending; ask the buyer to withdraw and create a replacement offer acknowledging receipt after delivery.'
        : undefined,
      signingBlockReason:         
        (terms.disclosures.propertyConditionStatus === 'exempt' && !terms.disclosures.disclosureExemptionClaimed) || terms.disclosures.leadPaintStatus === 'pending'
        ? 'This offer records a required disclosure as not received. The buyer must withdraw this offer and create a new one after the seller uploads the missing document. An immutable submitted offer cannot be changed.'
        : undefined,
    };
  },
};