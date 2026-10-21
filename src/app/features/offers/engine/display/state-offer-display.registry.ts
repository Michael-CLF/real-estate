import { wyomingOfferDisplayAdapter } from '../../states/wyoming/display/wyoming-offer-display.adapter';
import { southDakotaOfferDisplayAdapter } from '../../states/south-dakota/display/south-dakota-offer-display.adapter';
import { newMexicoOfferDisplayAdapter } from '../../states/new-mexico/display/new-mexico-offer-display.adapter';
import { marylandOfferDisplayAdapter } from '../../states/maryland/display/maryland-offer-display.adapter';
import { montanaOfferDisplayAdapter } from '../../states/montana/display/montana-offer-display.adapter';
import { iowaOfferDisplayAdapter } from '../../states/iowa/display/iowa-offer-display.adapter';
import { washingtonOfferDisplayAdapter } from '../../states/washington/display/washington-offer-display.adapter';
import { delawareOfferDisplayAdapter } from '../../states/delaware/display/delaware-offer-display.adapter';
import { ohioOfferDisplayAdapter } from '../../states/ohio/display/ohio-offer-display.adapter';
import { kansasOfferDisplayAdapter } from '../../states/kansas/display/kansas-offer-display.adapter';
import { indianaOfferDisplayAdapter } from '../../states/indiana/display/indiana-offer-display.adapter';
import { alabamaOfferDisplayAdapter } from '../../states/alabama/display/alabama-offer-display.adapter';
import { newHampshireOfferDisplayAdapter } from '../../states/new-hampshire/display/new-hampshire-offer-display.adapter';
import { nebraskaOfferDisplayAdapter } from '../../states/nebraska/display/nebraska-offer-display.adapter';
import { missouriOfferDisplayAdapter } from '../../states/missouri/display/missouri-offer-display.adapter';
import { oregonOfferDisplayAdapter } from '../../states/oregon/display/oregon-offer-display.adapter';
import { idahoOfferDisplayAdapter } from '../../states/idaho/display/idaho-offer-display.adapter';
import { arizonaOfferDisplayAdapter } from '../../states/arizona/display/arizona-offer-display.adapter';
import { michiganOfferDisplayAdapter } from '../../states/michigan/display/michigan-offer-display.adapter';
import { minnesotaOfferDisplayAdapter } from '../../states/minnesota/display/minnesota-offer-display.adapter';
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
registerDisplayAdapter(michiganOfferDisplayAdapter);
registerDisplayAdapter(idahoOfferDisplayAdapter);
registerDisplayAdapter(wyomingOfferDisplayAdapter);
registerDisplayAdapter(southDakotaOfferDisplayAdapter);
registerDisplayAdapter(newMexicoOfferDisplayAdapter);
registerDisplayAdapter(marylandOfferDisplayAdapter);
registerDisplayAdapter(montanaOfferDisplayAdapter);
registerDisplayAdapter(iowaOfferDisplayAdapter);
registerDisplayAdapter(washingtonOfferDisplayAdapter);
registerDisplayAdapter(delawareOfferDisplayAdapter);
registerDisplayAdapter(ohioOfferDisplayAdapter);
registerDisplayAdapter(kansasOfferDisplayAdapter);
registerDisplayAdapter(indianaOfferDisplayAdapter);
registerDisplayAdapter(alabamaOfferDisplayAdapter);
registerDisplayAdapter(newHampshireOfferDisplayAdapter);
registerDisplayAdapter(nebraskaOfferDisplayAdapter);
registerDisplayAdapter(missouriOfferDisplayAdapter);
registerDisplayAdapter(oregonOfferDisplayAdapter);
registerDisplayAdapter(arizonaOfferDisplayAdapter);
registerDisplayAdapter(minnesotaOfferDisplayAdapter);
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
