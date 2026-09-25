import type { CreateStateContractMilestonesInput, StateContractMilestones } from '../state-contract-package';
import type { UtahOfferTermsDocument } from './utah-offer-terms.document';
export function createUtahContractMilestones(input: CreateStateContractMilestonesInput<UtahOfferTermsDocument>): StateContractMilestones {
  const t = input.version.terms;
  return { transactionPhase: t.conditions.dueDiligence ? 'due_diligence' : 'under_contract', timeZone: 'America/Denver', anticipatedClosingDate: t.deadlines.settlementDate, ...(t.conditions.dueDiligence ? { dueDiligenceEndsAt: t.deadlines.dueDiligenceDate } : {}) };
}
