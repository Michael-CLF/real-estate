import { maineListingPackage } from './maine-listing.package';
import { mississippiListingPackage } from './mississippi-listing.package';
import { arkansasListingPackage } from './arkansas-listing.package';
import { illinoisListingPackage } from './illinois-listing.package';
import { isFederalLeadExcluded } from '../../offers/state-contracts/federal-lead-policy';
import { wyomingListingPackage } from './wyoming-listing.package';
import { southDakotaListingPackage } from './south-dakota-listing.package';
import { newMexicoListingPackage } from './new-mexico-listing.package';
import { marylandListingPackage } from './maryland-listing.package';
import { montanaListingPackage } from './montana-listing.package';
import { iowaListingPackage } from './iowa-listing.package';
import { washingtonListingPackage } from './washington-listing.package';
import { delawareListingPackage } from './delaware-listing.package';
import { ohioListingPackage } from './ohio-listing.package';
import { kansasListingPackage } from './kansas-listing.package';
import { indianaListingPackage } from './indiana-listing.package';
import { alabamaListingPackage } from './alabama-listing.package';
import { newHampshireListingPackage } from './new-hampshire-listing.package';
import { nebraskaListingPackage } from './nebraska-listing.package';
import { missouriListingPackage } from './missouri-listing.package';
import { oregonListingPackage } from './oregon-listing.package';
import { idahoListingPackage } from './idaho-listing.package';
import { arizonaListingPackage } from './arizona-listing.package';
import { southCarolinaListingPackage } from './south-carolina-listing.package';
import { northCarolinaListingPackage } from './north-carolina-listing.package';
import { oklahomaListingPackage } from './oklahoma-listing.package';
import type { StateListingField, StateListingPackage } from './state-listing-package';
import { texasListingPackage } from './texas-listing.package';
import { utahListingPackage } from './utah-listing.package';
import { wisconsinListingPackage } from './wisconsin-listing.package';
import { minnesotaListingPackage } from './minnesota-listing.package';
import { michiganListingPackage } from './michigan-listing.package';
import { floridaListingPackage } from './florida-listing.package';
import { louisianaListingPackage } from './louisiana-listing.package';
import { coloradoListingPackage } from './colorado-listing.package';
import { californiaListingPackage } from './california-listing.package';

const PACKAGES = new Map<string, StateListingPackage>([
  ['CA', californiaListingPackage],
  ['SC', southCarolinaListingPackage],
  ['NC', northCarolinaListingPackage],
  ['OK', oklahomaListingPackage],
  ['TX', texasListingPackage],
  ['UT', utahListingPackage],
  ['WI', wisconsinListingPackage],
  ['FL', floridaListingPackage],
  ['MI', michiganListingPackage],
['ID', idahoListingPackage],
['WY', wyomingListingPackage],
['ME', maineListingPackage],
['MS', mississippiListingPackage],
['AR', arkansasListingPackage],
['IL', illinoisListingPackage],
['SD', southDakotaListingPackage],
['NM', newMexicoListingPackage],
['MD', marylandListingPackage],
['MT', montanaListingPackage],
['IA', iowaListingPackage],
['WA', washingtonListingPackage],
['DE', delawareListingPackage],
['OH', ohioListingPackage],
['KS', kansasListingPackage],
['IN', indianaListingPackage],
['AL', alabamaListingPackage],
['NH', newHampshireListingPackage],
['NE', nebraskaListingPackage],
['MO', missouriListingPackage],
['OR', oregonListingPackage],
['AZ', arizonaListingPackage],
  ['MN', minnesotaListingPackage],
  ['LA', louisianaListingPackage],
  ['CO', coloradoListingPackage],
]);

export function getStateListingPackage(stateCode: string): StateListingPackage {
  const normalizedStateCode = stateCode.trim().toUpperCase();
  const statePackage = PACKAGES.get(normalizedStateCode);
  if (!statePackage) {
    throw new Error(`Listing publication is not configured for ${normalizedStateCode || 'this state'}.`);
  }
  return statePackage;
}

export function requiresField(statePackage: StateListingPackage, field: StateListingField): boolean {
  return statePackage.requiredSellerStatementFields.includes(field);
}

export function validateStateSellerStatements(
  listingUid: string,
  stateCode: string,
  statements: Record<string, unknown>,
  property: {yearBuilt?:unknown;propertyType?:unknown} = {},
): void {
  const statePackage = getStateListingPackage(stateCode);
  const storedStateCode = typeof statements['stateCode'] === 'string'
    ? statements['stateCode'].trim().toUpperCase()
    : statePackage.stateCode;
  if (storedStateCode !== statePackage.stateCode) {
    throw new Error(`Listing draft ${listingUid} has seller statements for the wrong state.`);
  }
  if (requiresField(statePackage, 'ownershipStatus') &&
      !['owned_at_least_one_year', 'owned_less_than_one_year', 'does_not_yet_own']
        .includes(String(statements['ownershipStatus'] ?? ''))) {
    throw new Error(`Listing draft ${listingUid} has no valid ownership statement.`);
  }

  statePackage.validateAdditionalSellerStatements?.(listingUid, statements);

  for (const [field, message] of [
    ['leadBasedPaintApplies', 'lead-based-paint'],
    ['ownersAssociationApplies', 'owners-association'],
    ['fuelTankPresent', 'fuel-tank'],
  ] as const) {
    if (field === 'leadBasedPaintApplies' && isFederalLeadExcluded(property)) continue;
    if (requiresField(statePackage, field) && typeof statements[field] !== 'boolean') {
      throw new Error(`Listing draft ${listingUid} has no ${message} statement.`);
    }
  }
  if (requiresField(statePackage, 'fuelTankPresent') && statements['fuelTankPresent'] === true &&
      !['owned', 'leased'].includes(String(statements['fuelTankOwnership'] ?? ''))) {
    throw new Error(`Listing draft ${listingUid} has no valid fuel-tank ownership statement.`);
  }
  if (requiresField(statePackage, 'generalLeasesExist') && typeof statements['leasesExist'] !== 'boolean') {
    throw new Error(`Listing draft ${listingUid} has no existing-leases statement.`);
  }
  if (requiresField(statePackage, 'texasLeaseCategories') &&
      ['residentialLeasesExist', 'fixtureLeasesExist', 'naturalResourceLeasesExist']
        .some(field => typeof statements[field] !== 'boolean')) {
    throw new Error(`Listing draft ${listingUid} has incomplete Texas lease statements.`);
  }
  if (requiresField(statePackage, 'utahMethamphetamineContamination') &&
      typeof statements['methamphetamineContaminationKnown'] !== 'boolean') {
    throw new Error(`Listing draft ${listingUid} has no Utah methamphetamine-contamination statement.`);
  }
}
