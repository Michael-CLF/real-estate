import type { CreateStateContractMilestonesInput, StateContractMilestones } from '../state-contract-package';
import type { WisconsinOfferTermsDocument } from './wisconsin-offer-terms.document';
export function createWisconsinContractMilestones(input: CreateStateContractMilestonesInput<WisconsinOfferTermsDocument>): StateContractMilestones {
  const t = input.version.terms;
  return { transactionPhase: t.conditions.dueDiligence ? 'due_diligence' : 'under_contract', timeZone: 'America/Chicago', anticipatedClosingDate: t.deadlines.settlementDate, ...(t.conditions.dueDiligence ? { dueDiligenceEndsAt: t.deadlines.dueDiligenceDate } : {}) };
}
