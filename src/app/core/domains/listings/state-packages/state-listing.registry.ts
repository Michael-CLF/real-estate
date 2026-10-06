import { southCarolinaListingPackage } from './south-carolina/south-carolina-listing.package';
import type {
  StateListingPackage,
} from './state-listing-package';

import {
  northCarolinaListingPackage,
} from './north-carolina/north-carolina-listing.package';

import {
  oklahomaListingPackage,
} from './oklahoma/oklahoma-listing.package';

import { coloradoListingPackage } from './colorado/colorado-listing.package';

import {
  californiaListingPackage
} from './california/california-listing.package';

import {
  texasListingPackage,
} from './texas/texas-listing.package';
import { utahListingPackage } from './utah/utah-listing.package';
import { wisconsinListingPackage } from './wisconsin/wisconsin-listing.package';
import { floridaListingPackage } from './florida/florida-listing.package';
import { louisianaListingPackage } from './louisiana/louisiana-listing.package';

const PACKAGES =
  new Map<string, StateListingPackage>([
    ['CA', californiaListingPackage],
    ['SC', southCarolinaListingPackage],
    ['CO', coloradoListingPackage],
    ['NC', northCarolinaListingPackage],
    ['OK', oklahomaListingPackage],
    ['TX', texasListingPackage],
    ['UT', utahListingPackage],
    ['WI', wisconsinListingPackage],
    ['FL', floridaListingPackage],
    ['LA', louisianaListingPackage],
  ]);

export function getStateListingPackage(
  stateCode: string,
): StateListingPackage {
  const normalizedStateCode =
    stateCode.trim().toUpperCase();

  const statePackage =
    PACKAGES.get(normalizedStateCode);

  if (!statePackage) {
    throw new Error(
      `Listing creation is not configured for ${normalizedStateCode || 'this state'
      }.`,
    );
  }

  return statePackage;
}

export function hasStateListingPackage(
  stateCode: string,
): boolean {
  return PACKAGES.has(
    stateCode.trim().toUpperCase(),
  );
}