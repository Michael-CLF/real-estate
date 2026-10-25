import {pennsylvaniaOfferDisplayAdapter} from '../../states/pennsylvania/display/pennsylvania-offer-display.adapter';
import {northDakotaOfferDisplayAdapter} from '../../states/north-dakota/display/north-dakota-offer-display.adapter';
import {nevadaOfferDisplayAdapter} from '../../states/nevada/display/nevada-offer-display.adapter';
import {georgiaOfferDisplayAdapter} from '../../states/georgia/display/georgia-offer-display.adapter';
import {kentuckyOfferDisplayAdapter} from '../../states/kentucky/display/kentucky-offer-display.adapter';
import {rhodeIslandOfferDisplayAdapter} from '../../states/rhode-island/display/rhode-island-offer-display.adapter';
import {tennesseeOfferDisplayAdapter} from '../../states/tennessee/display/tennessee-offer-display.adapter';
import {westVirginiaOfferDisplayAdapter} from '../../states/west-virginia/display/west-virginia-offer-display.adapter';
import {alaskaOfferDisplayAdapter} from '../../states/alaska/display/alaska-offer-display.adapter';
import {connecticutOfferDisplayAdapter} from '../../states/connecticut/display/connecticut-offer-display.adapter';
import {vermontOfferDisplayAdapter} from '../../states/vermont/display/vermont-offer-display.adapter';
import {virginiaOfferDisplayAdapter} from '../../states/virginia/display/virginia-offer-display.adapter';
import { maineOfferDisplayAdapter } from '../../states/maine/display/maine-offer-display.adapter';
import { mississippiOfferDisplayAdapter } from '../../states/mississippi/display/mississippi-offer-display.adapter';
import { arkansasOfferDisplayAdapter } from '../../states/arkansas/display/arkansas-offer-display.adapter';
import { illinoisOfferDisplayAdapter } from '../../states/illinois/display/illinois-offer-display.adapter';
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
  OfferDisplayContext,
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

type DisplayTerms = (terms: StateOfferTerms, context?:OfferDisplayContext) => OfferDisplayFields;
const DISPLAY_ADAPTERS = new Map<string, DisplayTerms>();

/** Keep the narrowing at the registration boundary; shared callers inspect no term paths. */
function registerDisplayAdapter<TTerms extends StateOfferTerms>(adapter: StateOfferDisplayAdapter<TTerms>): void {
  if (DISPLAY_ADAPTERS.has(adapter.stateCode)) {
    throw new Error(`More than one offer display adapter is registered for ${adapter.stateCode}.`);
  }
  DISPLAY_ADAPTERS.set(adapter.stateCode, (terms,context) => {
    if (terms.stateCode !== adapter.stateCode) {
      throw new Error('Offer version and contract terms have different states.');
    }
    return adapter.display(terms as TTerms,context);
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
registerDisplayAdapter(maineOfferDisplayAdapter);
registerDisplayAdapter(georgiaOfferDisplayAdapter);
registerDisplayAdapter(kentuckyOfferDisplayAdapter);
registerDisplayAdapter(rhodeIslandOfferDisplayAdapter);
registerDisplayAdapter(tennesseeOfferDisplayAdapter);
registerDisplayAdapter(westVirginiaOfferDisplayAdapter);
registerDisplayAdapter(alaskaOfferDisplayAdapter);
registerDisplayAdapter(connecticutOfferDisplayAdapter);
registerDisplayAdapter(vermontOfferDisplayAdapter);
registerDisplayAdapter(virginiaOfferDisplayAdapter);
registerDisplayAdapter(nevadaOfferDisplayAdapter);
registerDisplayAdapter(northDakotaOfferDisplayAdapter);
registerDisplayAdapter(pennsylvaniaOfferDisplayAdapter);
registerDisplayAdapter(mississippiOfferDisplayAdapter);
registerDisplayAdapter(arkansasOfferDisplayAdapter);
registerDisplayAdapter(illinoisOfferDisplayAdapter);
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
  },
  context?:OfferDisplayContext
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
  return display(version.terms,context);
}
