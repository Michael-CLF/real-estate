import { maineStateContractPackage } from './maine/maine-state-contract.package';
import { georgiaStateContractPackage } from './georgia/georgia-state-contract.package';
import { kentuckyStateContractPackage } from './kentucky/kentucky-state-contract.package';
import { rhodeIslandStateContractPackage } from './rhode-island/rhode-island-state-contract.package';
import { tennesseeStateContractPackage } from './tennessee/tennessee-state-contract.package';
import { westVirginiaStateContractPackage } from './west-virginia/west-virginia-state-contract.package';
import { alaskaStateContractPackage } from './alaska/alaska-state-contract.package';
import { connecticutStateContractPackage } from './connecticut/connecticut-state-contract.package';
import { vermontStateContractPackage } from './vermont/vermont-state-contract.package';
import { virginiaStateContractPackage } from './virginia/virginia-state-contract.package';
import { nevadaStateContractPackage } from './nevada/nevada-state-contract.package';
import { northDakotaStateContractPackage } from './north-dakota/north-dakota-state-contract.package';
import { pennsylvaniaStateContractPackage } from './pennsylvania/pennsylvania-state-contract.package';
import { mississippiStateContractPackage } from './mississippi/mississippi-state-contract.package';
import { arkansasStateContractPackage } from './arkansas/arkansas-state-contract.package';
import { illinoisStateContractPackage } from './illinois/illinois-state-contract.package';
import { wyomingStateContractPackage } from './wyoming/wyoming-state-contract.package';
import { southDakotaStateContractPackage } from './south-dakota/south-dakota-state-contract.package';
import { newMexicoStateContractPackage } from './new-mexico/new-mexico-state-contract.package';
import { marylandStateContractPackage } from './maryland/maryland-state-contract.package';
import { montanaStateContractPackage } from './montana/montana-state-contract.package';
import { iowaStateContractPackage } from './iowa/iowa-state-contract.package';
import { washingtonStateContractPackage } from './washington/washington-state-contract.package';
import { delawareStateContractPackage } from './delaware/delaware-state-contract.package';
import { ohioStateContractPackage } from './ohio/ohio-state-contract.package';
import { kansasStateContractPackage } from './kansas/kansas-state-contract.package';
import { indianaStateContractPackage } from './indiana/indiana-state-contract.package';
import { alabamaStateContractPackage } from './alabama/alabama-state-contract.package';
import { newHampshireStateContractPackage } from './new-hampshire/new-hampshire-state-contract.package';
import { nebraskaStateContractPackage } from './nebraska/nebraska-state-contract.package';
import { missouriStateContractPackage } from './missouri/missouri-state-contract.package';
import { oregonStateContractPackage } from './oregon/oregon-state-contract.package';
import { idahoStateContractPackage } from './idaho/idaho-state-contract.package';
import { arizonaStateContractPackage } from './arizona/arizona-state-contract.package';
import { southCarolinaStateContractPackage } from './south-carolina/south-carolina-state-contract.package';
import { californiaStateContractPackage } from './california/california-state-contract.package';
import {
  HttpsError,
} from 'firebase-functions/v2/https';

import {
  northCarolinaStateContractPackage,
} from './north-carolina/north-carolina-state-contract.package';

import {
  texasStateContractPackage,
} from './texas/texas-state-contract.package';

import { utahStateContractPackage } from './utah/utah-state-contract.package';
import { wisconsinStateContractPackage } from './wisconsin/wisconsin-state-contract.package';
import { minnesotaStateContractPackage } from './minnesota/minnesota-state-contract.package';
import { michiganStateContractPackage } from './michigan/michigan-state-contract.package';
import { floridaStateContractPackage } from './florida/florida-state-contract.package';
import { louisianaStateContractPackage } from './louisiana/louisiana-state-contract.package';
import { coloradoStateContractPackage } from './colorado/colorado-state-contract.package';

import {
  oklahomaStateContractPackage,
} from './oklahoma/oklahoma-state-contract.package';

import type {
  StateAgreementTemplate,
  StateContractPackage,
  StateContractTerms,
} from './state-contract-package';


/*
 * State-neutral metadata used to determine availability without
 * exposing a state's private contract-terms type.
 */
export interface StateContractRegistration {
  readonly stateCode: string;

  readonly offerCreationEnabled: boolean;

  readonly defaultTimeZone: string;

  readonly agreementTemplates:
    readonly StateAgreementTemplate[];
}


/*
 * Executable means the package may be used by state-neutral backend
 * services. It does not mean that users may create offers in that
 * state. offerCreationEnabled remains the launch gate.
 */
const EXECUTABLE_STATE_CONTRACT_PACKAGES =
  new Map<
    string,
    StateContractPackage<StateContractTerms>
  >([
    [
      northCarolinaStateContractPackage
        .stateCode,

      northCarolinaStateContractPackage,
    ],

    [
      texasStateContractPackage
        .stateCode,

      texasStateContractPackage,
    ],

    [
      oklahomaStateContractPackage
        .stateCode,

      oklahomaStateContractPackage,
    ],
    [utahStateContractPackage.stateCode, utahStateContractPackage],
    [wisconsinStateContractPackage.stateCode, wisconsinStateContractPackage],
    [floridaStateContractPackage.stateCode, floridaStateContractPackage],
    [michiganStateContractPackage.stateCode, michiganStateContractPackage],
[idahoStateContractPackage.stateCode, idahoStateContractPackage],
[wyomingStateContractPackage.stateCode, wyomingStateContractPackage],
[maineStateContractPackage.stateCode, maineStateContractPackage],
[georgiaStateContractPackage.stateCode, georgiaStateContractPackage],
[kentuckyStateContractPackage.stateCode, kentuckyStateContractPackage],
[rhodeIslandStateContractPackage.stateCode, rhodeIslandStateContractPackage],
[tennesseeStateContractPackage.stateCode, tennesseeStateContractPackage],
[westVirginiaStateContractPackage.stateCode, westVirginiaStateContractPackage],
[alaskaStateContractPackage.stateCode, alaskaStateContractPackage],
[connecticutStateContractPackage.stateCode, connecticutStateContractPackage],
[vermontStateContractPackage.stateCode, vermontStateContractPackage],
[virginiaStateContractPackage.stateCode, virginiaStateContractPackage],
[nevadaStateContractPackage.stateCode, nevadaStateContractPackage],
[northDakotaStateContractPackage.stateCode, northDakotaStateContractPackage],
[pennsylvaniaStateContractPackage.stateCode, pennsylvaniaStateContractPackage],
[mississippiStateContractPackage.stateCode, mississippiStateContractPackage],
[arkansasStateContractPackage.stateCode, arkansasStateContractPackage],
[illinoisStateContractPackage.stateCode, illinoisStateContractPackage],
[southDakotaStateContractPackage.stateCode, southDakotaStateContractPackage],
[newMexicoStateContractPackage.stateCode, newMexicoStateContractPackage],
[marylandStateContractPackage.stateCode, marylandStateContractPackage],
[montanaStateContractPackage.stateCode, montanaStateContractPackage],
[iowaStateContractPackage.stateCode, iowaStateContractPackage],
[washingtonStateContractPackage.stateCode, washingtonStateContractPackage],
[delawareStateContractPackage.stateCode, delawareStateContractPackage],
[ohioStateContractPackage.stateCode, ohioStateContractPackage],
[kansasStateContractPackage.stateCode, kansasStateContractPackage],
[indianaStateContractPackage.stateCode, indianaStateContractPackage],
[alabamaStateContractPackage.stateCode, alabamaStateContractPackage],
[newHampshireStateContractPackage.stateCode, newHampshireStateContractPackage],
[nebraskaStateContractPackage.stateCode, nebraskaStateContractPackage],
[missouriStateContractPackage.stateCode, missouriStateContractPackage],
[oregonStateContractPackage.stateCode, oregonStateContractPackage],
[arizonaStateContractPackage.stateCode, arizonaStateContractPackage],
    [minnesotaStateContractPackage.stateCode, minnesotaStateContractPackage],
    [louisianaStateContractPackage.stateCode, louisianaStateContractPackage],
    [coloradoStateContractPackage.stateCode, coloradoStateContractPackage],
    [californiaStateContractPackage.stateCode, californiaStateContractPackage],
    [southCarolinaStateContractPackage.stateCode, southCarolinaStateContractPackage],
  ]);


/*
 * The metadata registry is deliberately separated from executable
 * packages. It can later describe disabled or partially implemented
 * states without allowing their contracts to be created.
 */
const STATE_CONTRACT_REGISTRATIONS =
  new Map<
    string,
    StateContractRegistration
  >([
    ...Array.from(
      EXECUTABLE_STATE_CONTRACT_PACKAGES
        .values(),

      stateContractPackage => [
        stateContractPackage.stateCode,

        createStateContractRegistration(
          stateContractPackage
        ),
      ] as const
    ),

  ]);


export function getStateContractRegistration(
  stateCode: string
): StateContractRegistration | undefined {
  return STATE_CONTRACT_REGISTRATIONS.get(
    normalizeStateCode(
      stateCode
    )
  );
}


/*
 * This return type intentionally remains the North-Carolina-compatible
 * default for now. It prevents an unfinished Texas package from flowing
 * through callable functions that still read North Carolina fields.
 */
export function getStateContractPackage(
  stateCode: string
): StateContractPackage<StateContractTerms> | undefined {
  return EXECUTABLE_STATE_CONTRACT_PACKAGES.get(
    normalizeStateCode(
      stateCode
    )
  );
}


/*
 * Resolves a compiled state package for workflows involving an
 * existing offer. This deliberately does not enable new offer
 * creation in a disabled state.
 */
export function requireStateContractPackage(
  stateCode: string
): StateContractPackage<StateContractTerms> {
  const normalizedStateCode =
    normalizeStateCode(
      stateCode
    );

  const stateContractPackage =
    getStateContractPackage(
      normalizedStateCode
    );

  if (!stateContractPackage) {
    throw new HttpsError(
      'failed-precondition',
      `NavStreet does not have an executable contract package for ${normalizedStateCode}.`
    );
  }

  return stateContractPackage;
}


export function requireEnabledStateContractPackage(
  stateCode: string
): StateContractPackage<StateContractTerms> {
  const normalizedStateCode =
    normalizeStateCode(
      stateCode
    );

  const registration =
    getStateContractRegistration(
      normalizedStateCode
    );

  const stateContractPackage =
    getStateContractPackage(
      normalizedStateCode
    );

  if (
    !registration ||
    !registration.offerCreationEnabled ||
    !stateContractPackage
  ) {
    throw new HttpsError(
      'failed-precondition',
      `NavStreet offers are not yet available in ${normalizedStateCode}.`
    );
  }

  return stateContractPackage;
}


function createStateContractRegistration<
  TTerms extends StateContractTerms,
>(
  stateContractPackage:
    StateContractPackage<TTerms>
): StateContractRegistration {
  if(stateContractPackage.offerCreationEnabled && !stateContractPackage.hoaPolicyIntegrated)throw new Error('State contract packages must integrate the seller HOA applicability policy before registration.');
  if(stateContractPackage.offerCreationEnabled && !stateContractPackage.federalLeadPolicyIntegrated)throw new Error('State contract packages must integrate the federal lead applicability policy before registration.');
  return {
    stateCode:
      stateContractPackage.stateCode,

    offerCreationEnabled:
      stateContractPackage
        .offerCreationEnabled,

    defaultTimeZone:
      stateContractPackage
        .defaultTimeZone,

    agreementTemplates: stateContractPackage.agreementTemplates ?? [{...stateContractPackage.agreementTemplate}],
  };
}


function normalizeStateCode(
  stateCode: string
): string {
  return stateCode
    .trim()
    .toUpperCase();
}
