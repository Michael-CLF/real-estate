import { localCalendarDeadline } from '../local-calendar-deadline';
import type { CreateStateContractMilestonesInput, StateContractMilestones } from '../state-contract-package';
import type { KentuckyOfferTermsDocument } from './kentucky-offer-terms.document';
export function createKentuckyContractMilestones(input: CreateStateContractMilestonesInput<KentuckyOfferTermsDocument>): StateContractMilestones {
  const t = input.version.terms;
  const deadline = localCalendarDeadline(input.effectiveAt, t.delivery.timeZone, t.deadlines.inspectionPeriodDays);
  return { transactionPhase: 'due_diligence', timeZone: t.delivery.timeZone, anticipatedClosingDate: t.deadlines.settlementDate, dueDiligenceEndsAt: deadline };
}
