import { isFederalLeadExcluded } from '../../../../../core/domains/offers/federal-lead-policy';
import type { MarylandOfferTerms } from '../../../../../core/domains/offers/state-contracts/maryland/models/maryland-offer-terms.model';
import type { StateOfferDisplayAdapter } from '../../../engine/display/state-offer-display.adapter';
export const marylandOfferDisplayAdapter: StateOfferDisplayAdapter<MarylandOfferTerms> = {
  stateCode: 'MD',
  display(terms) {
    return {
      agreementTitle: terms.contractType === 'navstreet_maryland_condominium_resale_2026' ? 'NavStreet Maryland Condominium Resale Purchase and Sale Agreement' : 'NavStreet Maryland Residential Purchase and Sale Agreement',
      documentLabel: 'NavStreet Maryland agreement PDF',
      purchasePriceInCents: terms.purchase.purchasePriceInCents,
      fundingLabel: terms.purchase.financingType === 'cash' ? 'Cash' : `${terms.purchase.financingType.toUpperCase()} loan`,
      depositLabel: 'Earnest money', depositInCents: terms.purchase.earnestMoneyInCents,
      depositDelivery: { label: 'Initial deposit delivery', value: terms.purchase.hasEarnestMoney ? `${terms.purchase.earnestMoneyDueDays} days after acceptance` : 'No initial deposit' },
      escrowAgent: terms.purchase.hasEarnestMoney ? terms.purchase.earnestMoneyHolder : 'No initial deposit',
      importantDeadline: { label: 'inspection period', value: `${terms.deadlines.inspectionPeriodDays} calendar days after acceptance` },
      closingDate: { label: 'Settlement deadline', value: terms.deadlines.settlementDate },
      possessionLabel: 'Vacant at closing',
      sellerSigningBlockReason: !['received','exempt'].includes(terms.disclosures.propertyConditionStatus) ? "Maryland condition disclosure/disclaimer or supported exemption is required before seller acceptance. Required receipt is pending; review seller disclosures before submitting." : undefined,
      signingBlockReason: Date.now() >= Date.parse('2027-07-01T04:00:00Z') ? 'Maryland requires the July 2027 flood-form package update before signing.' :         
        (terms.disclosures.requiredKnownFacts && terms.disclosures.statutoryPacketStatus !== 'received') || (terms.disclosures.propertyConditionStatus === 'exempt' && !terms.disclosures.disclosureExemptionClaimed) || (terms.disclosures.leadPaintStatus === 'pending' && !isFederalLeadExcluded(terms.property))
        ? 'This offer records a required disclosure as not received. The buyer must withdraw this offer and create a new one after the seller uploads the missing document. An immutable submitted offer cannot be changed.'
        : undefined,
    };
  },
};