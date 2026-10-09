import { southCarolinaOfferDisplayAdapter } from '../../states/south-carolina/display/south-carolina-offer-display.adapter';
import { californiaOfferDisplayAdapter } from '../../states/california/display/california-offer-display.adapter';
import type {
  StateOfferTerms,
} from '../../../../core/domains/offers/models/offer-terms.model';

import type {
  OfferDisplayFields,
  StateOfferDisplayAdapter,
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

import {
  utahOfferDisplayAdapter,
} from '../../states/utah/display/utah-offer-display.adapter';

import {
  wisconsinOfferDisplayAdapter,
} from '../../states/wisconsin/display/wisconsin-offer-display.adapter';

import {
  floridaOfferDisplayAdapter,
} from '../../states/florida/display/florida-offer-display.adapter';
import { louisianaOfferDisplayAdapter } from '../../states/louisiana/display/louisiana-offer-display.adapter';
import { coloradoOfferDisplayAdapter } from '../../states/colorado/display/colorado-offer-display.adapter';

type DisplayTerms = (terms: StateOfferTerms) => OfferDisplayFields;
const DISPLAY_ADAPTERS = new Map<string, DisplayTerms>();

/** Keep the narrowing at the registration boundary; shared callers inspect no term paths. */
function registerDisplayAdapter<TTerms extends StateOfferTerms>(adapter: StateOfferDisplayAdapter<TTerms>): void {
  if (DISPLAY_ADAPTERS.has(adapter.stateCode)) {
    throw new Error(`More than one offer display adapter is registered for ${adapter.stateCode}.`);
  }
  DISPLAY_ADAPTERS.set(adapter.stateCode, terms => {
    if (terms.stateCode !== adapter.stateCode) {
      throw new Error('Offer version and contract terms have different states.');
    }
    return adapter.display(terms as TTerms);
  });
}

registerDisplayAdapter(northCarolinaOfferDisplayAdapter);
registerDisplayAdapter(texasOfferDisplayAdapter);
registerDisplayAdapter(oklahomaOfferDisplayAdapter);
registerDisplayAdapter(utahOfferDisplayAdapter);
registerDisplayAdapter(wisconsinOfferDisplayAdapter);
registerDisplayAdapter(floridaOfferDisplayAdapter);
registerDisplayAdapter(louisianaOfferDisplayAdapter);
registerDisplayAdapter(southCarolinaOfferDisplayAdapter);
registerDisplayAdapter(californiaOfferDisplayAdapter);
registerDisplayAdapter(coloradoOfferDisplayAdapter);

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
  const state = version.stateCode.trim().toUpperCase();

  if (state !== version.terms.stateCode) {
    throw new Error(
      'Offer version and contract terms have different states.'
    );
  }

  const display = DISPLAY_ADAPTERS.get(state);
  if (!display) {
    throw new Error(`No offer display adapter is registered for ${state}.`);
  }
  return display(version.terms);
}
