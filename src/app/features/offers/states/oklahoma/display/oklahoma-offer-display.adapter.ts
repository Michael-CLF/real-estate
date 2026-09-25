import type { OklahomaOfferTerms } from '../../../../../core/domains/offers/state-contracts/oklahoma/models/oklahoma-offer-terms.model';
import type { StateOfferDisplayAdapter } from '../../../engine/display/state-offer-display.adapter';

const FINANCING_LABELS: Readonly<Record<string, string>> = {
  conventional_loan: 'Conventional financing',
  fha_loan: 'FHA financing',
  va_loan: 'VA financing',
  usda_loan: 'USDA financing',
  native_american_loan: 'Native American Guaranteed Home Loan',
  assumption: 'Loan assumption',
  seller_financing: 'Seller financing',
};

export const oklahomaOfferDisplayAdapter: StateOfferDisplayAdapter<OklahomaOfferTerms> = {
  stateCode: 'OK',
  display(terms) {
    const financing = terms.contractDocuments.find(value => FINANCING_LABELS[value]);
    return {
      agreementTitle: terms.form.formName,
      documentLabel: 'NavStreet Oklahoma Offer Package PDF',
      purchasePriceInCents: terms.purchase.purchasePriceInCents,
      fundingLabel: financing ? FINANCING_LABELS[financing] : 'Cash',
      depositLabel: 'Earnest money',
      depositInCents: terms.purchase.earnestMoneyInCents,
      depositDelivery: { label: 'Earnest money delivery', value: 'Within 3 days after full execution' },
      escrowAgent: terms.purchase.trustAccountHolder || 'Not provided',
      importantDeadline: {
        label: 'Inspection period',
        value: `${terms.timePeriods.inspectionDays} ${terms.timePeriods.inspectionDays === 1 ? 'day' : 'days'} after the Time Reference Date`,
      },
      closingDate: { label: 'Closing date', value: terms.closing.closingDate },
      possessionLabel: terms.closing.possessionTerms || 'Upon conclusion of closing',
    };
  },
};
