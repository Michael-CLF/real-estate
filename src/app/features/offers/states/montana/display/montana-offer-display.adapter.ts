import { montanaCondominiumAcceptanceProblem } from '../../../../../core/domains/offers/state-contracts/montana/montana-condominium-policy';
import { isFederalLeadExcluded } from '../../../../../core/domains/offers/federal-lead-policy';
import type { MontanaOfferTerms } from '../../../../../core/domains/offers/state-contracts/montana/models/montana-offer-terms.model';
import type { StateOfferDisplayAdapter } from '../../../engine/display/state-offer-display.adapter';
export const montanaOfferDisplayAdapter: StateOfferDisplayAdapter<MontanaOfferTerms> = {
  stateCode: 'MT',
  display(terms, context) {
    return {
      agreementTitle: terms.contractType === 'navstreet_montana_condominium_resale_2026' ? 'NavStreet Montana Condominium Resale Purchase and Sale Agreement' : 'NavStreet Montana Residential Purchase and Sale Agreement',
      buyerWithdrawalEndsAt: terms.condominiumAcceptancePolicy === 'accept_during_review_v2' && terms.condominiumReceiptAt
        ? new Date(Date.parse(terms.condominiumReceiptAt) + 72 * 60 * 60 * 1000).toISOString() : undefined,
      documentLabel: 'NavStreet Montana agreement PDF',
      purchasePriceInCents: terms.purchase.purchasePriceInCents,
      fundingLabel: terms.purchase.financingType === 'cash' ? 'Cash' : `${terms.purchase.financingType.toUpperCase()} loan`,
      depositLabel: 'Earnest money', depositInCents: terms.purchase.earnestMoneyInCents,
      depositDelivery: { label: 'Initial deposit delivery', value: terms.purchase.hasEarnestMoney ? `${terms.purchase.earnestMoneyDueDays} days after the effective date` : 'No initial deposit' },
      escrowAgent: terms.purchase.hasEarnestMoney ? terms.purchase.earnestMoneyHolder : 'No initial deposit',
      importantDeadline: { label: 'inspection period', value: `${terms.deadlines.inspectionPeriodDays} calendar days after the effective date` },
      closingDate: { label: 'Settlement deadline', value: terms.deadlines.settlementDate },
      possessionLabel: 'Vacant at closing',
      buyerSigningBlockReason: (context?.version as {initiatedBy?:string} | undefined)?.initiatedBy === 'seller' ? montanaCondominiumAcceptanceProblem(terms) : undefined,
      sellerSigningBlockReason: (context?.version as {initiatedBy?:string} | undefined)?.initiatedBy !== 'seller' ? montanaCondominiumAcceptanceProblem(terms) : undefined,
      signingBlockReason:         
        (terms.disclosures.propertyConditionStatus === 'exempt' && !terms.disclosures.disclosureExemptionClaimed) || (terms.disclosures.requiredKnownFacts && terms.disclosures.statutoryPacketStatus !== 'received') || (!['received','exempt'].includes(terms.disclosures.propertyConditionStatus)) || (terms.disclosures.leadPaintStatus === 'pending' && !isFederalLeadExcluded(terms.property))
        ? 'This offer records a required disclosure as not received. The buyer must withdraw this offer and create a new one after the seller uploads the missing document. An immutable submitted offer cannot be changed.'
        : undefined,
    };
  },
};