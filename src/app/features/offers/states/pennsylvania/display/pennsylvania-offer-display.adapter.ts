import { isFederalLeadExcluded } from '../../../../../core/domains/offers/federal-lead-policy';
import type { PennsylvaniaOfferTerms } from '../../../../../core/domains/offers/state-contracts/pennsylvania/models/pennsylvania-offer-terms.model';
import type { StateOfferDisplayAdapter } from '../../../engine/display/state-offer-display.adapter';
export const pennsylvaniaOfferDisplayAdapter: StateOfferDisplayAdapter<PennsylvaniaOfferTerms> = {
  stateCode: 'PA',
  display(terms) {
    return {
      agreementTitle: terms.contractType === 'navstreet_pennsylvania_condominium_resale_2026' ? 'NavStreet Pennsylvania Condominium Resale Purchase and Sale Agreement' : 'NavStreet Pennsylvania Residential Purchase and Sale Agreement',
      documentLabel: 'NavStreet Pennsylvania agreement PDF',
      purchasePriceInCents: terms.purchase.purchasePriceInCents,
      fundingLabel: terms.purchase.financingType === 'cash' ? 'Cash' : `${terms.purchase.financingType.toUpperCase()} loan`,
      depositLabel: 'Earnest money', depositInCents: terms.purchase.earnestMoneyInCents,
      depositDelivery: { label: 'Initial deposit delivery', value: terms.purchase.hasEarnestMoney ? `${terms.purchase.earnestMoneyDueDays} days after acceptance` : 'No initial deposit' },
      escrowAgent: terms.purchase.hasEarnestMoney ? terms.purchase.earnestMoneyHolder : 'No initial deposit',
      importantDeadline: { label: 'inspection period', value: `${terms.deadlines.inspectionPeriodDays} calendar days after acceptance` },
      closingDate: { label: 'Settlement deadline', value: terms.deadlines.settlementDate },
      possessionLabel: 'Vacant at closing',
      signingBlockReason:
        (terms.disclosures.requiredKnownFacts && terms.disclosures.statutoryPacketStatus !== 'received') || (terms.disclosures.leadPaintStatus === 'pending' && !isFederalLeadExcluded(terms.property))
        ? 'This offer records a required disclosure as not received. The buyer must withdraw this offer and create a new one after the seller uploads the missing document. An immutable submitted offer cannot be changed.'
        : undefined,
    };
  },
};
