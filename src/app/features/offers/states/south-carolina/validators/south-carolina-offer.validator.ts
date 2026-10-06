import type { OfferParty } from '../../../../../core/domains/offers/models/offer-party.model';
import type { OfferValidationContext, OfferValidationResult } from '../../../../../core/domains/offers/models/offer-validation.model';
import type { StateOfferValidator } from '../../../../../core/domains/offers/state-contracts/state-offer-validator';
import type { SouthCarolinaOfferTerms } from '../../../../../core/domains/offers/state-contracts/south-carolina/models/south-carolina-offer-terms.model';
import { southCarolinaTermsIssues } from './south-carolina-terms-rules';
export class SouthCarolinaOfferValidator implements StateOfferValidator<SouthCarolinaOfferTerms> {
  readonly stateCode = 'SC' as const;
  validate(t: SouthCarolinaOfferTerms, buyers: OfferParty[], sellers: OfferParty[], context: OfferValidationContext): OfferValidationResult {
    const errors = southCarolinaTermsIssues(t,context.currentDateTime ?? new Date(),context.mode !== 'draft');
    for (const [side,parties] of [['buyers',buyers],['sellers',sellers]] as const) {
      if (!parties.length) errors.push({fieldPath:side,message:'At least one party is required.',severity:'error'});
      parties.forEach((p,i)=> {if (!p.legalName?.trim() || !p.phone?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) errors.push({fieldPath:`${side}.${i}`,message:'Complete the legal name, email and phone.',severity:'error'});});
    }
    return {valid:errors.length===0,errors,warnings:[]};
  }
}