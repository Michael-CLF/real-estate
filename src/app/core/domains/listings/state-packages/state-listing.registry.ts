import { maineListingPackage } from './maine/maine-listing.package';
import { mississippiListingPackage } from './mississippi/mississippi-listing.package';
import { pennsylvaniaListingPackage } from './pennsylvania/pennsylvania-listing.package';
import { northDakotaListingPackage } from './north-dakota/north-dakota-listing.package';
import { nevadaListingPackage } from './nevada/nevada-listing.package';
import { georgiaListingPackage } from './georgia/georgia-listing.package';
import { kentuckyListingPackage } from './kentucky/kentucky-listing.package';
import { rhodeIslandListingPackage } from './rhode-island/rhode-island-listing.package';
import { tennesseeListingPackage } from './tennessee/tennessee-listing.package';
import { westVirginiaListingPackage } from './west-virginia/west-virginia-listing.package';
import { arkansasListingPackage } from './arkansas/arkansas-listing.package';
import { illinoisListingPackage } from './illinois/illinois-listing.package';
import { wyomingListingPackage } from './wyoming/wyoming-listing.package';
import { southDakotaListingPackage } from './south-dakota/south-dakota-listing.package';
import { newMexicoListingPackage } from './new-mexico/new-mexico-listing.package';
import { marylandListingPackage } from './maryland/maryland-listing.package';
import { montanaListingPackage } from './montana/montana-listing.package';
import { iowaListingPackage } from './iowa/iowa-listing.package';
import { washingtonListingPackage } from './washington/washington-listing.package';
import { delawareListingPackage } from './delaware/delaware-listing.package';
import { ohioListingPackage } from './ohio/ohio-listing.package';
import { kansasListingPackage } from './kansas/kansas-listing.package';
import { indianaListingPackage } from './indiana/indiana-listing.package';
import { alabamaListingPackage } from './alabama/alabama-listing.package';
import { newHampshireListingPackage } from './new-hampshire/new-hampshire-listing.package';
import { nebraskaListingPackage } from './nebraska/nebraska-listing.package';
import { missouriListingPackage } from './missouri/missouri-listing.package';
import { oregonListingPackage } from './oregon/oregon-listing.package';
import { idahoListingPackage } from './idaho/idaho-listing.package';
import { arizonaListingPackage } from './arizona/arizona-listing.package';
import type { StateListingEditFields } from './state-listing-package';
import type { ListingSellerStatements } from '../models/listing.model';
import type { ListingStatementMappingAnswers } from './listing-statement-mapping';
import type { StateListingDisclosureVisibilityContext, StateListingFormFactories, StateListingFormValidators, StateListingFormRestorers, StateListingFormSerializers, StateListingStatementDraftExtensions, StateListingPropertyField } from './state-listing-package';
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
import { minnesotaListingPackage } from './minnesota/minnesota-listing.package';
import { michiganListingPackage } from './michigan/michigan-listing.package';
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
    ['MI', michiganListingPackage],
['ID', idahoListingPackage],
['WY', wyomingListingPackage],
['ME', maineListingPackage],
['MS', mississippiListingPackage],
['PA', pennsylvaniaListingPackage],
['ND', northDakotaListingPackage],
['NV', nevadaListingPackage],
['GA', georgiaListingPackage],
['KY', kentuckyListingPackage],
['RI', rhodeIslandListingPackage],
['TN', tennesseeListingPackage],
['WV', westVirginiaListingPackage],
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
/** Inventory for resetting validation when a question group is inactive. */
export function getStateListingQuestionGroups() {
  return Array.from(PACKAGES.values()).flatMap(statePackage => statePackage.questionGroups ?? []);
}

/** Resolves preserved form paths through registered package hooks, including inactive draft groups. */
export function getStateListingFormFactory<TKey extends keyof StateListingFormFactories>(
  fieldPath: TKey,
): StateListingFormFactories[TKey] {
  let factory: StateListingFormFactories[TKey] | undefined;
  for (const statePackage of PACKAGES.values()) {
    const candidate = statePackage.formFactories?.[fieldPath];
    if (!candidate) continue;
    if (factory) throw new Error(`More than one state listing form factory is registered for ${fieldPath}.`);
    factory = candidate;
  }
  if (!factory) throw new Error(`No state listing form factory is registered for ${fieldPath}.`);
  return factory;
}

/** Document owners supply visibility rules; unconfigured cards retain their existing visibility. */
export function isStateListingDisclosureCardVisible(
  documentType: string,
  context: StateListingDisclosureVisibilityContext,
): boolean {
  let rule: ((context: StateListingDisclosureVisibilityContext) => boolean) | undefined;
  for (const statePackage of PACKAGES.values()) {
    const candidate = statePackage.disclosureCardVisibility?.[documentType];
    if (!candidate) continue;
    if (rule) throw new Error(`More than one disclosure visibility rule is registered for ${documentType}.`);
    rule = candidate;
  }
  return rule ? rule(context) : true;
}

/** Resolve validators by preserved form path, including inactive groups that need validators reset. */
export function getStateListingFormValidator<TKey extends keyof StateListingFormValidators>(
  fieldPath: TKey,
): StateListingFormValidators[TKey] {
  let validator: StateListingFormValidators[TKey] | undefined;
  for (const statePackage of PACKAGES.values()) {
    const candidate = statePackage.formValidators?.[fieldPath];
    if (!candidate) continue;
    if (validator) throw new Error(`More than one state listing form validator is registered for ${fieldPath}.`);
    validator = candidate;
  }
  if (!validator) throw new Error(`No state listing form validator is registered for ${fieldPath}.`);
  return validator;
}

/** Resolves restore hooks for preserved draft paths, including inactive state groups. */
export function getStateListingFormRestorer<TKey extends keyof StateListingFormRestorers>(
  fieldPath: TKey,
): StateListingFormRestorers[TKey] {
  let restorer: StateListingFormRestorers[TKey] | undefined;
  for (const statePackage of PACKAGES.values()) {
    const candidate = statePackage.formRestorers?.[fieldPath];
    if (!candidate) continue;
    if (restorer) throw new Error(`More than one state listing form restorer is registered for ${fieldPath}.`);
    restorer = candidate;
  }
  if (!restorer) throw new Error(`No state listing form restorer is registered for ${fieldPath}.`);
  return restorer;
}

/** Resolve persisted-value conversions through the owning state package. */
export function getStateListingFormSerializer<TKey extends keyof StateListingFormSerializers>(
  fieldPath: TKey,
): StateListingFormSerializers[TKey] {
  let serializer: StateListingFormSerializers[TKey] | undefined;
  for (const statePackage of PACKAGES.values()) {
    const candidate = statePackage.formSerializers?.[fieldPath];
    if (!candidate) continue;
    if (serializer) throw new Error(`More than one state listing form serializer is registered for ${fieldPath}.`);
    serializer = candidate;
  }
  if (!serializer) throw new Error(`No state listing form serializer is registered for ${fieldPath}.`);
  return serializer;
}

/** Existing mapping uses exact state codes; unknown/unconfigured statement extensions stay empty. */
export function mapStateListingSellerStatements(
  stateCode: string,
  statements: ListingStatementMappingAnswers,
): Partial<ListingSellerStatements> {
  return PACKAGES.get(stateCode)?.mapSellerStatements?.(statements) ?? {};
}

/** Restore every registered draft group, including groups inactive for the current listing. */
export function restoreStateListingSellerStatements(
  saved: ListingSellerStatements | null | undefined,
): StateListingStatementDraftExtensions {
  const restored: StateListingStatementDraftExtensions = {};
  for (const statePackage of PACKAGES.values()) {
    const extension = statePackage.restoreSellerStatements?.(saved);
    if (!extension) continue;
    for (const field of Object.keys(extension)) {
      if (Object.prototype.hasOwnProperty.call(restored, field)) {
        throw new Error(`More than one state listing draft restorer is registered for ${field}.`);
      }
    }
    Object.assign(restored, extension);
  }
  return restored;
}

/** Optional property fields keep the existing normalized-code and unknown-state behavior. */
export function showsStateListingPropertyField(
  stateCode: string,
  field: StateListingPropertyField,
): boolean {
  return PACKAGES.get(stateCode.trim().toUpperCase())?.propertyDetailFields?.includes(field) ?? false;
}

/** Resolve edit metadata through its sole owning package. */
export function getStateListingEditFields<TKey extends keyof StateListingEditFields>(
  fieldGroup: TKey,
): StateListingEditFields[TKey] {
  let fields: StateListingEditFields[TKey] | undefined;
  for (const statePackage of PACKAGES.values()) {
    const candidate = statePackage.editFields?.[fieldGroup];
    if (!candidate) continue;
    if (fields) throw new Error(`More than one state listing edit field group is registered for ${fieldGroup}.`);
    fields = candidate;
  }
  if (!fields) throw new Error(`No state listing edit field group is registered for ${fieldGroup}.`);
  return fields;
}
