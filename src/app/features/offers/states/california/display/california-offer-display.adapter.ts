import type { CaliforniaOfferTerms } from '../../../../../core/domains/offers/state-contracts/california/models/california-offer-terms.model';
import type { StateOfferDisplayAdapter } from '../../../engine/display/state-offer-display.adapter';
export const californiaOfferDisplayAdapter: StateOfferDisplayAdapter<CaliforniaOfferTerms> = {
  stateCode:'CA', display(t) {return {
    agreementTitle:'NavStreet California Residential Purchase and Sale Agreement', documentLabel:'California agreement PDF',
    purchasePriceInCents:t.purchase.purchasePriceInCents,
    fundingLabel:t.purchase.financingType==='cash'?'Cash':t.purchase.financingType.toUpperCase()+' loan',
    depositLabel:'Escrow deposit',depositInCents:t.purchase.earnestMoneyInCents,
    depositDelivery:{label:'Deposit due',value:t.purchase.hasEarnestMoney?t.purchase.earnestMoneyDueDays+' calendar days after acceptance':'No initial deposit'},
    escrowAgent:t.purchase.earnestMoneyHolder || t.settlement.closingAgentName || 'To be jointly selected',
    importantDeadline:{label:'Inspection contingency review',value:t.deadlines.inspectionPeriodDays+' calendar days after acceptance; written removal required'},
    closingDate:{label:'Close of escrow',value:t.deadlines.settlementDate},possessionLabel:'Vacant on recording',
    signingBlockReason:t.disclosures.leadPaintStatus==='pending'?'Receive applicable federal lead materials before signing.':undefined,
  };},
};