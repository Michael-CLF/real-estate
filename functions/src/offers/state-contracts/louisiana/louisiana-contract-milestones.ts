import { localCalendarDeadline } from '../local-calendar-deadline';
import type { CreateStateContractMilestonesInput, StateContractMilestones } from '../state-contract-package';
import type { LouisianaOfferTermsDocument } from './louisiana-offer-terms.document';
export function createLouisianaContractMilestones(input: CreateStateContractMilestonesInput<LouisianaOfferTermsDocument>): StateContractMilestones {
  const t = input.version.terms;
  // Preserve Louisiana's additional commencement-day offset.
  const deadline = localCalendarDeadline(input.effectiveAt, 'America/Chicago', t.deadlines.inspectionPeriodDays, 1);
  return { transactionPhase: 'due_diligence', timeZone: 'America/Chicago', anticipatedClosingDate: t.deadlines.settlementDate, dueDiligenceEndsAt: deadline };
}