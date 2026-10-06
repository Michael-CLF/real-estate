import type { SouthCarolinaOfferTerms } from '../../../../../core/domains/offers/state-contracts/south-carolina/models/south-carolina-offer-terms.model';
import type { StateOfferDisplayAdapter } from '../../../engine/display/state-offer-display.adapter';
export const southCarolinaOfferDisplayAdapter: StateOfferDisplayAdapter<SouthCarolinaOfferTerms> = {
  stateCode:'SC', display(t) {return {
    agreementTitle:'NavStreet South Carolina Residential Purchase and Sale Agreement', documentLabel:'South Carolina agreement PDF',
    purchasePriceInCents:t.purchase.purchasePriceInCents,
    fundingLabel:t.purchase.financingType==='cash'?'Cash':t.purchase.financingType.toUpperCase()+' loan',
    depositLabel:'Escrow deposit',depositInCents:t.purchase.earnestMoneyInCents,
    depositDelivery:{label:'Deposit due',value:t.purchase.hasEarnestMoney?t.purchase.earnestMoneyDueDays+' calendar days after acceptance':'No initial deposit'},
    escrowAgent:t.purchase.earnestMoneyHolder || t.settlement.closingAgentName || 'To be jointly selected',
    importantDeadline:{label:'Inspection contingency review',value:t.deadlines.inspectionPeriodDays+' calendar days after acceptance; cancellation notice due by deadline'},
    closingDate:{label:'Closing date',value:t.deadlines.settlementDate},possessionLabel:t.disclosures.vacationRentalsApply?'Subject to disclosed vacation rentals':t.disclosures.sellerReportsExistingLeases?'Subject to agreed continuing occupancy':'At completed closing and recording',
    signingBlockReason:t.disclosures.leadPaintStatus==='pending' && (t.property.yearBuilt == null || t.property.yearBuilt < 1978)?'Receive applicable federal lead materials before signing.':undefined,
  };},
};