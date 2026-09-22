import type {
  OfferParty,
} from '../models/offer-party.model';

import type {
  NorthCarolinaOfferTerms,
} from './north-carolina/models/north-carolina-offer-terms.model';

import {
  NorthCarolinaOfferValidator,
} from './north-carolina/validators/north-carolina-offer.validator';

import type {
  StateOfferTerms,
} from '../models/offer-terms.model';

import type {
  OfferValidationContext,
  OfferValidationResult,
} from '../models/offer-validation.model';


export interface StateOfferValidationRegistration {
  readonly stateCode: string;

  validate(
    terms: StateOfferTerms,
    buyers: OfferParty[],
    sellers: OfferParty[],
    context: OfferValidationContext
  ): OfferValidationResult;
}


const northCarolinaValidator =
  new NorthCarolinaOfferValidator();


const STATE_OFFER_VALIDATION_REGISTRATIONS:
  Readonly<
    Record<
      string,
      StateOfferValidationRegistration
    >
  > = {
    NC: {
      stateCode: 'NC',

      validate: (
        terms,
        buyers,
        sellers,
        context
      ) =>
        northCarolinaValidator.validate(
          terms as NorthCarolinaOfferTerms,
          buyers,
          sellers,
          context
        ),
    },
  };


export function getStateOfferValidationRegistration(
  stateCode: string
): StateOfferValidationRegistration | null {
  const normalizedStateCode =
    stateCode
      .trim()
      .toUpperCase();

  return (
    STATE_OFFER_VALIDATION_REGISTRATIONS[
      normalizedStateCode
    ] ?? null
  );
}
