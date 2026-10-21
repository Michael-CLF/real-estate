import { isFederalLeadExcluded } from '../../../../../core/domains/offers/federal-lead-policy';
import type { NewMexicoOfferTerms } from '../../../../../core/domains/offers/state-contracts/new-mexico/models/new-mexico-offer-terms.model';
import type { StateOfferDisplayAdapter } from '../../../engine/display/state-offer-display.adapter';
export const newMexicoOfferDisplayAdapter: StateOfferDisplayAdapter<NewMexicoOfferTerms> = {
  stateCode: 'NM',
  display(terms) {
    return {
      agreementTitle: 'NavStreet New Mexico Residential Purchase and Sale Agreement',
      documentLabel: 'NavStreet New Mexico agreement PDF',
      purchasePriceInCents: terms.purchase.purchasePriceInCents,
      fundingLabel: terms.purchase.financingType === 'cash' ? 'Cash' : `${terms.purchase.financingType.toUpperCase()} loan`,
      depositLabel: 'Earnest money', depositInCents: terms.purchase.earnestMoneyInCents,
      depositDelivery: { label: 'Initial deposit delivery', value: terms.purchase.hasEarnestMoney ? `${terms.purchase.earnestMoneyDueDays} days after acceptance` : 'No initial deposit' },
      escrowAgent: terms.purchase.hasEarnestMoney ? terms.purchase.earnestMoneyHolder : 'No initial deposit',
      importantDeadline: { label: 'inspection period', value: `${terms.deadlines.inspectionPeriodDays} calendar days after acceptance` },
      closingDate: { label: 'Settlement deadline', value: terms.deadlines.settlementDate },
      possessionLabel: 'Vacant at closing',
      sellerSigningBlockReason: terms.disclosures.statutoryPacketStatus !== 'received' ? "New Mexico county assessor tax-levy estimate and buyer receipt are required before seller acceptance. If this immutable offer records Pending, deliver the document and have the buyer create a replacement offer acknowledging receipt." : undefined,
      signingBlockReason:         
        (terms.disclosures.requiredKnownFacts && terms.disclosures.statutoryPacketStatus !== 'received') || (terms.disclosures.leadPaintStatus === 'pending' && !isFederalLeadExcluded(terms.property))
        ? 'This offer records a required disclosure as not received. The buyer must withdraw this offer and create a new one after the seller uploads the missing document. An immutable submitted offer cannot be changed.'
        : undefined,
    };
  },
};