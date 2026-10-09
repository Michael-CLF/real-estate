import { localCalendarDeadline } from '../local-calendar-deadline';
import type { CreateStateContractMilestonesInput, StateContractMilestones } from '../state-contract-package';
import type { FloridaOfferTermsDocument } from './florida-offer-terms.document';
export function createFloridaContractMilestones(input: CreateStateContractMilestonesInput<FloridaOfferTermsDocument>): StateContractMilestones {
  const t = input.version.terms;
  const deadline = localCalendarDeadline(input.effectiveAt, 'America/New_York', t.deadlines.inspectionPeriodDays);
  return { transactionPhase: 'due_diligence', timeZone: 'America/New_York', anticipatedClosingDate: t.deadlines.settlementDate, dueDiligenceEndsAt: deadline };
}
