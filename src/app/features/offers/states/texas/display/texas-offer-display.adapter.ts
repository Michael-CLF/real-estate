import type {
  TexasOfferTerms,
} from '../../../../../core/domains/offers/state-contracts/texas/models/texas-offer-terms.model';

import type {
  StateOfferDisplayAdapter,
} from '../../../engine/display/state-offer-display.adapter';

const FINANCING_LABELS:
  Readonly<Record<string, string>> = {
    third_party_financing:
      'Third-party financing',

    loan_assumption:
      'Loan assumption',

    seller_financing:
      'Seller financing',
  };

export const texasOfferDisplayAdapter:
  StateOfferDisplayAdapter<TexasOfferTerms> = {
    stateCode: 'TX',

    display(terms) {
      const optionDays =
        terms.earnestMoneyAndOption
          .optionPeriodDays;

      const financing =
        terms.salesPrice.financingAddenda ?? [];

      const possession:
        Readonly<Record<string, string>> = {
          upon_closing_and_funding:
            'Upon closing and funding',

          temporary_residential_lease:
            'Temporary residential lease',
        };

      return {
        agreementTitle:
          terms.form.formName,

        documentLabel:
          `${terms.form.formName} PDF`,

        purchasePriceInCents:
          terms.salesPrice.salesPriceInCents,

        fundingLabel:
          terms.salesPrice.financingInCents <= 0
            ? 'Cash'
            : financing.length
              ? financing
                  .map(
                    value =>
                      FINANCING_LABELS[value] ??
                      value
                  )
                  .join(', ')
              : 'Financed',

        depositLabel: 'Earnest money',

        depositInCents:
          terms.earnestMoneyAndOption
            .earnestMoneyInCents,

        depositDelivery: {
          label: 'Earnest money delivery',
          value:
            'Within 3 days after the Effective Date',
        },

        escrowAgent:
          terms.earnestMoneyAndOption
            .escrowAgentName ||
          'Not provided',

        importantDeadline: {
          label: 'Termination option period',

          value:
            typeof optionDays === 'number'
              ? `${optionDays} ${
                  optionDays === 1
                    ? 'day'
                    : 'days'
                } after the Effective Date`
              : 'No termination option selected',
        },

        closingDate: {
          label: 'Closing date',
          value:
            terms.closingAndPossession
              .closingDate,
        },

        possessionLabel:
          possession[
            terms.closingAndPossession
              .possession
          ] ?? 'Not provided',
      };
    },
  };