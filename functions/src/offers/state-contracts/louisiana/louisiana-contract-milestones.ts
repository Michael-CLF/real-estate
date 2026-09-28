import type { CreateStateContractMilestonesInput, StateContractMilestones } from '../state-contract-package';
import type { LouisianaOfferTermsDocument } from './louisiana-offer-terms.document';
export function createLouisianaContractMilestones(input: CreateStateContractMilestonesInput<LouisianaOfferTermsDocument>): StateContractMilestones {
  const t = input.version.terms;
  const louisianaDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(input.effectiveAt);
  const part = (type: string) => Number(louisianaDate.find(item => item.type === type)?.value ?? 0);
  // LREC line 180: the period commences on the first day after acceptance;
  // line 181 measures the selected calendar days after that commencement.
  const deadline = new Date(Date.UTC(part('year'), part('month') - 1, part('day') + 1 + t.deadlines.inspectionPeriodDays)).toISOString().slice(0, 10);
  return { transactionPhase: 'due_diligence', timeZone: 'America/Chicago', anticipatedClosingDate: t.deadlines.settlementDate, dueDiligenceEndsAt: deadline };
}