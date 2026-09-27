import type { FloridaOfferTerms } from '../../../../../core/domains/offers/state-contracts/florida/models/florida-offer-terms.model';
import type { StateOfferDisplayAdapter } from '../../../engine/display/state-offer-display.adapter';
export const floridaOfferDisplayAdapter: StateOfferDisplayAdapter<FloridaOfferTerms> = {
  stateCode: 'FL',
  display(terms) {
    return {
      agreementTitle: 'NavStreet Florida Residential Purchase and Sale Agreement',
      documentLabel: 'NavStreet Florida agreement PDF',
      purchasePriceInCents: terms.purchase.purchasePriceInCents,
      fundingLabel: terms.purchase.financingType === 'cash' ? 'Cash' : `${terms.purchase.financingType.toUpperCase()} loan`,
      depositLabel: 'Earnest money', depositInCents: terms.purchase.earnestMoneyInCents,
      depositDelivery: { label: 'Initial deposit delivery', value: terms.purchase.hasEarnestMoney ? `${terms.purchase.earnestMoneyDueDays} days after acceptance` : 'No initial deposit' },
      escrowAgent: terms.purchase.hasEarnestMoney ? terms.purchase.earnestMoneyHolder : 'No initial deposit',
      importantDeadline: { label: 'AS IS inspection period', value: `${terms.deadlines.inspectionPeriodDays} calendar days after acceptance` },
      closingDate: { label: 'Settlement deadline', value: terms.deadlines.settlementDate },
      possessionLabel: 'Vacant at closing',
      signingBlockReason: terms.disclosures.floodStatus !== 'received' ||
        (terms.disclosures.sellerReportsHoa === true && terms.disclosures.hoaDocumentsStatus !== 'received') ||
        terms.disclosures.leadPaintStatus === 'pending'
        ? 'This offer records a required disclosure as not received. The buyer must withdraw this offer and create a new one after the seller uploads the missing document. An immutable submitted offer cannot be changed.'
        : undefined,
    };
  },
};