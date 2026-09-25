import type { CreateStateContractMilestonesInput, StateContractMilestones } from '../state-contract-package';
import type { OklahomaOfferTermsDocument } from './oklahoma-offer-terms.document';

export function createOklahomaContractMilestones(
  input: CreateStateContractMilestonesInput<OklahomaOfferTermsDocument>
): StateContractMilestones {
  const terms = input.version.terms;
  const referenceDate = terms.timePeriods.referenceDate
    ? new Date(`${terms.timePeriods.referenceDate}T00:00:00Z`)
    : addUtcDays(startOfUtcDay(input.effectiveAt), 3);
  const dueDiligenceEnd = addUtcDays(referenceDate, terms.timePeriods.inspectionDays);
  return {
    transactionPhase: 'due_diligence',
    timeZone: 'America/Chicago',
    anticipatedClosingDate: terms.closing.closingDate,
    dueDiligenceEndsAt: dueDiligenceEnd.toISOString().slice(0, 10),
  };
}

function startOfUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}
function addUtcDays(value: Date, days: number): Date {
  const result = new Date(value.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}
