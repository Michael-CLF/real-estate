import type { LouisianaOfferTerms } from '../../../../../core/domains/offers/state-contracts/louisiana/models/louisiana-offer-terms.model';
import type { StateOfferDisplayAdapter } from '../../../engine/display/state-offer-display.adapter';

export const louisianaOfferDisplayAdapter: StateOfferDisplayAdapter<LouisianaOfferTerms> = {
  stateCode: 'LA',
  display(terms) {
    return {
      agreementTitle: 'Louisiana Residential Agreement to Buy or Sell (LREC 01/2026)',
      documentLabel: 'Louisiana offer PDF',
      purchasePriceInCents: terms.purchase.purchasePriceInCents,
      fundingLabel: terms.purchase.financingType === 'cash' ? 'Cash' : terms.purchase.financingType === 'financed' ? 'Mortgage' : 'Undecided',
      depositLabel: 'Buyer deposit',
      depositInCents: terms.purchase.hasEarnestMoney ? terms.purchase.earnestMoneyInCents : 0,
      depositDelivery: { label: 'Buyer deposit', value: terms.purchase.hasEarnestMoney ? 'Within 72 hours after notice of acceptance' : 'No deposit' },
      escrowAgent: terms.purchase.hasEarnestMoney ? terms.purchase.earnestMoneyHolder : 'No deposit',
      importantDeadline: { label: 'Due diligence and inspection', value: `${terms.deadlines.inspectionPeriodDays} calendar days after acceptance` },
      closingDate: { label: 'Act of Sale', value: terms.deadlines.settlementDate },
      possessionLabel: 'At Act of Sale',
      signingBlockReason: terms.disclosures.propertyDisclosureStatus !== 'received' || terms.disclosures.leadPaintStatus === 'pending'
        ? 'The buyer must receive the applicable seller disclosure before submitting a new offer.'
        : undefined,
    };
  },
};