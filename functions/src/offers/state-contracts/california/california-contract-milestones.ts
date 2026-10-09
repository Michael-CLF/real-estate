import { localCalendarDeadline } from '../local-calendar-deadline';
import type { CreateStateContractMilestonesInput, StateContractMilestones } from '../state-contract-package';
import type { CaliforniaOfferTermsDocument } from './california-offer-terms.document';
export function createCaliforniaContractMilestones({version,effectiveAt}: CreateStateContractMilestonesInput<CaliforniaOfferTermsDocument>): StateContractMilestones {
  const deadline = localCalendarDeadline(effectiveAt, 'America/Los_Angeles', version.terms.deadlines.inspectionPeriodDays);
  return {transactionPhase:'due_diligence',timeZone:'America/Los_Angeles',anticipatedClosingDate:version.terms.deadlines.settlementDate,dueDiligenceEndsAt:deadline};
}