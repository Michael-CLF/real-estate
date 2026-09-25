import {
  HttpsError,
} from 'firebase-functions/v2/https';

import {
  northCarolinaStateContractPackage,
} from './north-carolina/north-carolina-state-contract.package';

import {
  texasStateContractPackage,
} from './texas/texas-state-contract.package';

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
  return {
    stateCode:
      stateContractPackage.stateCode,

    offerCreationEnabled:
      stateContractPackage
        .offerCreationEnabled,

    defaultTimeZone:
      stateContractPackage
        .defaultTimeZone,

    agreementTemplates: [
      {
        ...stateContractPackage
          .agreementTemplate,
      },
    ],
  };
}


function normalizeStateCode(
  stateCode: string
): string {
  return stateCode
    .trim()
    .toUpperCase();
}
