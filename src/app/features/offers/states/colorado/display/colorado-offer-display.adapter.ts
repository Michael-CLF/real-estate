import type { ColoradoOfferTerms } from '../../../../../core/domains/offers/state-contracts/colorado/models/colorado-offer-terms.model';
import type { StateOfferDisplayAdapter } from '../../../engine/display/state-offer-display.adapter';
export const coloradoOfferDisplayAdapter: StateOfferDisplayAdapter<ColoradoOfferTerms> = {
  stateCode:'CO', display(t) { return {
    agreementTitle:'NavStreet Colorado Residential Purchase and Sale Agreement', documentLabel:'Colorado offer PDF',
    purchasePriceInCents:t.purchase.purchasePriceInCents,
    fundingLabel:t.purchase.financingType === 'new_loan' ? 'New mortgage' : t.purchase.financingType === 'assumption' ? 'Existing loan assumption' : 'Cash',
    depositLabel:'Earnest money', depositInCents:t.purchase.earnestMoneyInCents,
    depositDelivery:{ label:'Earnest money due', value:t.deadlines.alternativeEarnestMoney || 'Not applicable' },
    escrowAgent:t.purchase.earnestMoneyHolder || 'No earnest money',
    importantDeadline:{label:'Inspection objection',value:t.deadlines.inspectionObjection || 'Not elected'},
    closingDate:{label:'Closing',value:t.deadlines.closing}, possessionLabel:t.deadlines.possession,
    signingBlockReason:t.disclosures.sellerPropertyStatus !== 'received' ? 'Buyer must review the seller disclosure.' : undefined,
  }; },
};