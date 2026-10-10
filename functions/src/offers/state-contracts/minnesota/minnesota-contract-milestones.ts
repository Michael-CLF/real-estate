import { localCalendarDeadline } from '../local-calendar-deadline';
import type { CreateStateContractMilestonesInput, StateContractMilestones } from '../state-contract-package';
import type { MinnesotaOfferTermsDocument } from './minnesota-offer-terms.document';
export function createMinnesotaContractMilestones(input: CreateStateContractMilestonesInput<MinnesotaOfferTermsDocument>): StateContractMilestones {
  const t = input.version.terms;
  const deadline = localCalendarDeadline(input.effectiveAt, 'America/Chicago', t.deadlines.inspectionPeriodDays);
  return { transactionPhase: 'due_diligence', timeZone: 'America/Chicago', anticipatedClosingDate: t.deadlines.settlementDate, dueDiligenceEndsAt: deadline };
}
