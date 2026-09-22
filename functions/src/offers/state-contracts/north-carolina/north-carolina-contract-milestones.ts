import type {
  CreateStateContractMilestonesInput,
  StateContractMilestones,
} from '../state-contract-package';


export function createNorthCarolinaContractMilestones(
  input: CreateStateContractMilestonesInput
): StateContractMilestones {
  const dueDiligenceEndsAt =
    resolveDueDiligenceEndDate(
      input
    );

  const anticipatedClosingDate =
    input.version.terms
      .settlement
      .settlementDate;

  return {
    transactionPhase:
      'due_diligence',

    timeZone:
      'America/New_York',

    anticipatedClosingDate,

    ...(
      dueDiligenceEndsAt
        ? {
          dueDiligenceEndsAt,
        }
        : {}
    ),
  };
}


function resolveDueDiligenceEndDate(
  input: CreateStateContractMilestonesInput
): string | undefined {
  const deposits =
    input.version.terms.deposits;

  if (
    deposits.dueDiligenceDeadlineType ===
    'specific_date'
  ) {
    return deposits.dueDiligenceEndDate;
  }

  if (
    deposits.dueDiligenceDeadlineType ===
      'days_after_effective_date' &&
    typeof deposits
      .dueDiligenceDaysAfterEffectiveDate ===
      'number'
  ) {
    const date =
      new Date(
        input.effectiveAt
          .getTime()
      );

    date.setUTCDate(
      date.getUTCDate() +
      deposits
        .dueDiligenceDaysAfterEffectiveDate
    );

    return date
      .toISOString()
      .slice(0, 10);
  }

  return undefined;
}
