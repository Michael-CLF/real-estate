import { localCalendarDeadline } from '../local-calendar-deadline';
import type { CreateStateContractMilestonesInput, StateContractMilestones } from '../state-contract-package';
import type { MichiganOfferTermsDocument } from './michigan-offer-terms.document';
export function createMichiganContractMilestones(input: CreateStateContractMilestonesInput<MichiganOfferTermsDocument>): StateContractMilestones {
  const t = input.version.terms;
  const deadline = localCalendarDeadline(input.effectiveAt, t.delivery.timeZone, t.deadlines.inspectionPeriodDays);
  return { transactionPhase: 'due_diligence', timeZone: t.delivery.timeZone, anticipatedClosingDate: t.deadlines.settlementDate, dueDiligenceEndsAt: deadline };
}
