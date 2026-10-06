import type { CreateStateContractMilestonesInput, StateContractMilestones } from '../state-contract-package';
import type { SouthCarolinaOfferTermsDocument } from './south-carolina-offer-terms.document';
export function createSouthCarolinaContractMilestones({version,effectiveAt}: CreateStateContractMilestonesInput<SouthCarolinaOfferTermsDocument>): StateContractMilestones {
  const parts = new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(effectiveAt);
  const value=(type:string)=>Number(parts.find(p=>p.type===type)?.value);
  const deadline=new Date(Date.UTC(value('year'),value('month')-1,value('day')+version.terms.deadlines.inspectionPeriodDays)).toISOString().slice(0,10);
  return {transactionPhase:'due_diligence',timeZone:'America/New_York',anticipatedClosingDate:version.terms.deadlines.settlementDate,dueDiligenceEndsAt:deadline};
}