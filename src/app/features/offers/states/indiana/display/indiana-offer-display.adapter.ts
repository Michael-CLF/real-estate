import { isFederalLeadExcluded } from '../../../../../core/domains/offers/federal-lead-policy';
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
        ? 'This saved version does not record buyer review of the Indiana condition disclosure or supported exception evidence. Its signatures and receipt answers cannot be changed. Acceptance is unavailable for this version.'
        : undefined,
      signingBlockReason:         
        !['received','exempt'].includes(terms.disclosures.propertyConditionStatus) || (terms.disclosures.propertyConditionStatus === 'exempt' && !terms.disclosures.disclosureExemptionClaimed) || (terms.disclosures.leadPaintStatus === 'pending' && !isFederalLeadExcluded(terms.property))
        ? 'This offer records a required disclosure as not received. Signing is unavailable for this saved version. Its existing signatures and receipt answers cannot be changed.'
        : undefined,
    };
  },
};