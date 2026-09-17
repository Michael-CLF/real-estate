import {
  HttpsError,
} from 'firebase-functions/v2/https';

import {
  northCarolinaStateContractPackage,
} from './north-carolina/north-carolina-state-contract.package';

import type {
  StateContractPackage,
} from './state-contract-package';


const STATE_CONTRACT_PACKAGES =
  new Map<
    string,
    StateContractPackage
  >([
    [
      northCarolinaStateContractPackage
        .stateCode,
      northCarolinaStateContractPackage,
    ],
  ]);


export function getStateContractPackage(
  stateCode: string
): StateContractPackage | undefined {
  const normalizedStateCode =
    stateCode
      .trim()
      .toUpperCase();

  return STATE_CONTRACT_PACKAGES.get(
    normalizedStateCode
  );
}


export function requireEnabledStateContractPackage(
  stateCode: string
): StateContractPackage {
  const normalizedStateCode =
    stateCode
      .trim()
      .toUpperCase();

  const stateContractPackage =
    getStateContractPackage(
      normalizedStateCode
    );

  if (
    !stateContractPackage ||
    !stateContractPackage
      .offerCreationEnabled
  ) {
    throw new HttpsError(
      'failed-precondition',
      `NavStreet offers are not yet available in ${normalizedStateCode}.`
    );
  }

  return stateContractPackage;
}