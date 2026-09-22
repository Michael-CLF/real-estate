import type {
  OfferParty,
} from '../models/offer-party.model';

import type {
  StateOfferTerms,
} from '../models/offer-terms.model';

import type {
  OfferValidationContext,
  OfferValidationResult,
} from '../models/offer-validation.model';


export interface StateOfferValidator<
  TTerms extends {
    readonly stateCode: string;
  } =
    StateOfferTerms
> {
  readonly stateCode: TTerms['stateCode'];

  validate(
    terms: TTerms,
    buyers: OfferParty[],
    sellers: OfferParty[],
    context: OfferValidationContext
  ): OfferValidationResult;
}
