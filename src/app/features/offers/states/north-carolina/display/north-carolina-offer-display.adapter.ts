import type {
  NorthCarolinaOfferTerms,
} from '../../../../../core/domains/offers/state-contracts/north-carolina/models/north-carolina-offer-terms.model';

import type {
  StateOfferDisplayAdapter,
} from '../../../engine/display/state-offer-display.adapter';

export const northCarolinaOfferDisplayAdapter:
  StateOfferDisplayAdapter<NorthCarolinaOfferTerms> = {
    stateCode: 'NC',

    display(terms) {
      const days =
        terms.deposits.depositDeliveryDays;

      const diligence =
        terms.deposits.dueDiligenceDeadlineType;

      const deadline =
        diligence === 'specific_date'
          ? terms.deposits.dueDiligenceEndDate ||
            'Not provided'
          : diligence ===
              'days_after_effective_date'
            ? typeof terms.deposits
                .dueDiligenceDaysAfterEffectiveDate ===
              'number'
              ? `${
                  terms.deposits
                    .dueDiligenceDaysAfterEffectiveDate
                } calendar days after the Effective Date`
              : 'Not provided'
            : 'Not selected';

      const possession:
        Readonly<Record<string, string>> = {
          at_closing: 'At closing',
          other:
            'Other — separate agreement attached',
        };

      return {
        agreementTitle:
          'Residential Purchase and Sale Agreement',

        documentLabel: 'Agreement PDF',

        purchasePriceInCents:
          terms.purchase.purchasePriceInCents,

        fundingLabel:
          terms.purchase.financingType === 'cash'
            ? 'Cash'
            : 'Loan',

        depositLabel: 'Deposit',

        depositInCents:
          terms.deposits.depositInCents,

        depositDelivery: {
          label: 'Deposit delivery',

          value:
            typeof days === 'number'
              ? `Within ${days} calendar ${
                  days === 1 ? 'day' : 'days'
                } after the Effective Date`
              : 'Not provided',
        },

        escrowAgent:
          terms.deposits.escrowAgentName ||
          'Not provided',

        importantDeadline: {
          label: 'Due-diligence deadline',
          value: deadline,
        },

        closingDate: {
          label: 'Settlement date',
          value:
            terms.settlement.settlementDate,
        },

        possessionLabel:
          possession[
            terms.settlement.possessionTiming
          ] ?? 'Not provided',
      };
    },
  };