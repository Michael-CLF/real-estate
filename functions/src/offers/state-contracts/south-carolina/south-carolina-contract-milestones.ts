import { localCalendarDeadline } from '../local-calendar-deadline';
import type { CreateStateContractMilestonesInput, StateContractMilestones } from '../state-contract-package';
import type { SouthCarolinaOfferTermsDocument } from './south-carolina-offer-terms.document';
export function createSouthCarolinaContractMilestones({version,effectiveAt}: CreateStateContractMilestonesInput<SouthCarolinaOfferTermsDocument>): StateContractMilestones {
  const deadline = localCalendarDeadline(effectiveAt, 'America/New_York', version.terms.deadlines.inspectionPeriodDays);
  return {transactionPhase:'due_diligence',timeZone:'America/New_York',anticipatedClosingDate:version.terms.deadlines.settlementDate,dueDiligenceEndsAt:deadline};
}