import type { CreateStateContractMilestonesInput, StateContractMilestones } from '../state-contract-package';
import type { FloridaOfferTermsDocument } from './florida-offer-terms.document';
export function createFloridaContractMilestones(input: CreateStateContractMilestonesInput<FloridaOfferTermsDocument>): StateContractMilestones {
  const t = input.version.terms;
  const floridaDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(input.effectiveAt);
  const part = (type: string) => Number(floridaDate.find(item => item.type === type)?.value ?? 0);
  const deadline = new Date(Date.UTC(part('year'), part('month') - 1, part('day') + t.deadlines.inspectionPeriodDays)).toISOString().slice(0, 10);
  return { transactionPhase: 'due_diligence', timeZone: 'America/New_York', anticipatedClosingDate: t.deadlines.settlementDate, dueDiligenceEndsAt: deadline };
}
