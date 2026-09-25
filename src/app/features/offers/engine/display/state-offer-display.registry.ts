import type {
  StateOfferTerms,
} from '../../../../core/domains/offers/models/offer-terms.model';

import type {
  OfferDisplayFields,
} from './state-offer-display.adapter';

import {
  northCarolinaOfferDisplayAdapter,
} from '../../states/north-carolina/display/north-carolina-offer-display.adapter';

import {
  texasOfferDisplayAdapter,
} from '../../states/texas/display/texas-offer-display.adapter';

import {
  oklahomaOfferDisplayAdapter,
} from '../../states/oklahoma/display/oklahoma-offer-display.adapter';

/**
 * The state stored on the offer version and the state stored
 * in its immutable contract terms must agree.
 */
export function displayOfferTerms(
  version: {
    readonly stateCode: string;
    readonly terms: StateOfferTerms;
  }
): OfferDisplayFields {
  const state =
    version.stateCode
      .trim()
      .toUpperCase();

  if (state !== version.terms.stateCode) {
    throw new Error(
      'Offer version and contract terms have different states.'
    );
  }

  switch (version.terms.stateCode) {
    case 'NC':
      return northCarolinaOfferDisplayAdapter
        .display(version.terms);

    case 'TX':
      return texasOfferDisplayAdapter
        .display(version.terms);

    case 'OK':
      return oklahomaOfferDisplayAdapter
        .display(version.terms);

    default:
      throw new Error(
        `No offer display adapter is registered for ${state}.`
      );
  }
}