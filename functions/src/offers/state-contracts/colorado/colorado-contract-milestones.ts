import type { CreateStateContractMilestonesInput, StateContractMilestones } from '../state-contract-package';
import type { ColoradoOfferTermsDocument } from './colorado-offer-terms.document';

export function createColoradoContractMilestones(input: CreateStateContractMilestonesInput<ColoradoOfferTermsDocument>): StateContractMilestones {
  const d = input.version.terms.deadlines;
  return {
    transactionPhase: d.inspectionTermination ? 'inspection' : 'pending_closing',
    timeZone: 'America/Denver',
    anticipatedClosingDate: d.closing,
    ...(d.inspectionTermination ? { dueDiligenceEndsAt: d.inspectionTermination } : {}),
  };
}