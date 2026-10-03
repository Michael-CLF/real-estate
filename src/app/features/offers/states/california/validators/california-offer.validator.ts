import type { OfferParty } from '../../../../../core/domains/offers/models/offer-party.model';
import type { OfferValidationContext, OfferValidationResult } from '../../../../../core/domains/offers/models/offer-validation.model';
import type { StateOfferValidator } from '../../../../../core/domains/offers/state-contracts/state-offer-validator';
import type { CaliforniaOfferTerms } from '../../../../../core/domains/offers/state-contracts/california/models/california-offer-terms.model';
import { californiaTermsIssues } from './california-terms-rules';
export class CaliforniaOfferValidator implements StateOfferValidator<CaliforniaOfferTerms> {
  readonly stateCode = 'CA' as const;
  validate(t: CaliforniaOfferTerms, buyers: OfferParty[], sellers: OfferParty[], context: OfferValidationContext): OfferValidationResult {
    const errors = californiaTermsIssues(t,context.currentDateTime ?? new Date(),context.mode !== 'draft');
    for (const [side,parties] of [['buyers',buyers],['sellers',sellers]] as const) {
      if (!parties.length) errors.push({fieldPath:side,message:'At least one party is required.',severity:'error'});
      parties.forEach((p,i)=> {if (!p.legalName?.trim() || !p.phone?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) errors.push({fieldPath:`${side}.${i}`,message:'Complete the legal name, email and phone.',severity:'error'});});
    }
    return {valid:errors.length===0,errors,warnings:[]};
  }
}