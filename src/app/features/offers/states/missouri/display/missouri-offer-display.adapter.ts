import { isFederalLeadExcluded } from '../../../../../core/domains/offers/federal-lead-policy';
import { MISSOURI_CONTRACT_NAMES } from '../../../../../core/domains/offers/state-contracts/missouri/missouri-contract-selection';
import type { MissouriOfferTerms } from '../../../../../core/domains/offers/state-contracts/missouri/models/missouri-offer-terms.model';
import type { StateOfferDisplayAdapter } from '../../../engine/display/state-offer-display.adapter';
export const missouriOfferDisplayAdapter: StateOfferDisplayAdapter<MissouriOfferTerms> = {
  stateCode: 'MO',
  display(terms) {
    return {
      agreementTitle: MISSOURI_CONTRACT_NAMES[terms.contractType],
      documentLabel: 'NavStreet Missouri agreement PDF',
      purchasePriceInCents: terms.purchase.purchasePriceInCents,
      fundingLabel: terms.purchase.financingType === 'cash' ? 'Cash' : `${terms.purchase.financingType.toUpperCase()} loan`,
      depositLabel: 'Earnest money', depositInCents: terms.purchase.earnestMoneyInCents,
      depositDelivery: { label: 'Initial deposit delivery', value: terms.purchase.hasEarnestMoney ? `${terms.purchase.earnestMoneyDueDays} days after acceptance` : 'No initial deposit' },
      escrowAgent: terms.purchase.hasEarnestMoney ? terms.purchase.earnestMoneyHolder : 'No initial deposit',
      importantDeadline: { label: 'inspection period', value: `${terms.deadlines.inspectionPeriodDays} calendar days after acceptance` },
      closingDate: { label: 'Settlement deadline', value: terms.deadlines.settlementDate },
      possessionLabel: terms.disclosures.sellerReportsExistingLeases ? 'Subject to disclosed lawful tenancies' : 'Vacant at closing',
      signingBlockReason: (terms.disclosures.methDisclosureRequired && terms.disclosures.statutoryPacketStatus !== 'received') || (terms.disclosures.leadPaintStatus === 'pending' && !isFederalLeadExcluded(terms.property))
        ? 'This offer records a required disclosure as not received. The buyer must withdraw this offer and create a new one after the seller uploads the missing document. An immutable submitted offer cannot be changed.'
        : undefined,
    };
  },
};