import type {
  CreateStateContractMilestonesInput,
  StateContractMilestones,
} from '../state-contract-package';

import type {
  TexasOfferTermsDocument,
} from './texas-offer-terms.document';


export function createTexasContractMilestones(
  input:
    CreateStateContractMilestonesInput<
      TexasOfferTermsDocument
    >
): StateContractMilestones {
  const terms = input.version.terms;

  const optionPeriodEndsAt =
    resolveOptionPeriodEndDate(
      input.effectiveAt,
      terms.earnestMoneyAndOption.optionPeriodDays
    );

  return {
    transactionPhase:
      optionPeriodEndsAt
        ? 'option_period'
        : 'under_contract',

    timeZone:
      terms.delivery.timeZone,

    anticipatedClosingDate:
      terms.closingAndPossession.closingDate,

    ...(
      optionPeriodEndsAt
        ? {
          dueDiligenceEndsAt:
            optionPeriodEndsAt,
        }
        : {}
    ),
  };
}


function resolveOptionPeriodEndDate(
  effectiveAt: Date,
  optionPeriodDays: number | undefined
): string | undefined {
  if (
    !Number.isInteger(optionPeriodDays) ||
    (optionPeriodDays ?? 0) <= 0
  ) {
    return undefined;
  }

  const endDate = new Date(
    Date.UTC(
      effectiveAt.getUTCFullYear(),
      effectiveAt.getUTCMonth(),
      effectiveAt.getUTCDate()
    )
  );

  endDate.setUTCDate(
    endDate.getUTCDate() +
      (optionPeriodDays as number)
  );

  return endDate
    .toISOString()
    .slice(0, 10);
}
