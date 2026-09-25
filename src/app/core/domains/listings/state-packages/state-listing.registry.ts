import type {
  StateListingPackage,
} from './state-listing-package';

import {
  northCarolinaListingPackage,
} from './north-carolina/north-carolina-listing.package';

import {
  oklahomaListingPackage,
} from './oklahoma/oklahoma-listing.package';

import {
  texasListingPackage,
} from './texas/texas-listing.package';
import { utahListingPackage } from './utah/utah-listing.package';

const PACKAGES =
  new Map<string, StateListingPackage>([
    ['NC', northCarolinaListingPackage],
    ['OK', oklahomaListingPackage],
    ['TX', texasListingPackage],
    ['UT', utahListingPackage],
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
      `Listing creation is not configured for ${
        normalizedStateCode || 'this state'
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
