import {
  Injectable,
} from '@angular/core';

import type {
  OfferParty,
} from '../models/offer-party.model';

import type {
  OfferTerms,
} from '../models/offer-terms.model';

import type {
  OfferValidationContext,
  OfferValidationResult,
} from '../models/offer-validation.model';

import {
  getStateOfferValidationRegistration,
} from '../state-contracts/state-offer-validation-registry';


export type {
  OfferValidationContext,
  OfferValidationIssue,
  OfferValidationResult,
  OfferValidationSeverity,
} from '../models/offer-validation.model';


@Injectable({
  providedIn: 'root',
})
export class OfferValidationService {
  validate(
    terms: OfferTerms,
    buyers: OfferParty[],
    sellers: OfferParty[],
    context: OfferValidationContext
  ): OfferValidationResult {
    const stateRegistration =
      getStateOfferValidationRegistration(
        terms.stateCode
      );

    if (!stateRegistration) {
      return {
        valid: false,

        errors: [
          {
            fieldPath: 'stateCode',
            message:
              `NavStreet offers are not yet available in ${terms.stateCode}.`,
            severity: 'error',
          },
        ],

        warnings: [],
      };
    }

    return stateRegistration.validate(
      terms,
      buyers,
      sellers,
      context
    );
  }
}
