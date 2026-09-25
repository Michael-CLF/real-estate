import {
  northCarolinaListingPackage,
} from './north-carolina-listing.package';

import {
  oklahomaListingPackage,
} from './oklahoma-listing.package';

import type {
  StateListingField,
  StateListingPackage,
} from './state-listing-package';

import {
  texasListingPackage,
} from './texas-listing.package';

import {
  utahListingPackage,
} from './utah-listing.package';

import { wisconsinListingPackage } from './wisconsin-listing.package';

const PACKAGES =
  new Map<
    string,
    StateListingPackage
  >([
    [
      'NC',
      northCarolinaListingPackage,
    ],
    [
      'OK',
      oklahomaListingPackage,
    ],
    [
      'TX',
      texasListingPackage,
    ],

    [
      'UT',
      utahListingPackage,
    ],
    [
      'WI',
      wisconsinListingPackage,
    ],
  ]);

export function getStateListingPackage(
  stateCode: string,
): StateListingPackage {
  const normalizedStateCode =
    stateCode
      .trim()
      .toUpperCase();

  const statePackage =
    PACKAGES.get(
      normalizedStateCode,
    );

  if (!statePackage) {
    throw new Error(
      `Listing publication is not configured for ${normalizedStateCode ||
      'this state'
      }.`,
    );
  }

  return statePackage;
}

export function requiresField(
  statePackage:
    StateListingPackage,
  field: StateListingField,
): boolean {
  return (
    statePackage
      .requiredSellerStatementFields
      .includes(field)
  );
}

export function validateStateSellerStatements(
  listingUid: string,
  stateCode: string,
  statements:
    Record<string, unknown>,
): void {
  const statePackage =
    getStateListingPackage(
      stateCode,
    );

  const storedStateCode =
    typeof statements['stateCode'] ===
      'string'
      ? statements['stateCode']
        .trim()
        .toUpperCase()
      : statePackage.stateCode;

  if (
    storedStateCode !==
    statePackage.stateCode
  ) {
    throw new Error(
      `Listing draft ${listingUid} has seller statements for the wrong state.`,
    );
  }

  if (
    requiresField(
      statePackage,
      'ownershipStatus',
    ) &&
    ![
      'owned_at_least_one_year',
      'owned_less_than_one_year',
      'does_not_yet_own',
    ].includes(
      String(
        statements[
        'ownershipStatus'
        ] ?? '',
      ),
    )
  ) {
    throw new Error(
      `Listing draft ${listingUid} has no valid ownership statement.`,
    );
  }

  for (
    const [
      field,
      message,
    ] of [
      [
        'leadBasedPaintApplies',
        'lead-based-paint',
      ],
      [
        'ownersAssociationApplies',
        'owners-association',
      ],
      [
        'fuelTankPresent',
        'fuel-tank',
      ],
    ] as const
  ) {
    if (
      requiresField(
        statePackage,
        field,
      ) &&
      typeof statements[field] !==
      'boolean'
    ) {
      throw new Error(
        `Listing draft ${listingUid} has no ${message} statement.`,
      );
    }
  }

  if (
    requiresField(
      statePackage,
      'fuelTankPresent',
    ) &&
    statements[
    'fuelTankPresent'
    ] === true &&
    ![
      'owned',
      'leased',
    ].includes(
      String(
        statements[
        'fuelTankOwnership'
        ] ?? '',
      ),
    )
  ) {
    throw new Error(
      `Listing draft ${listingUid} has no valid fuel-tank ownership statement.`,
    );
  }

  if (
    requiresField(
      statePackage,
      'generalLeasesExist',
    ) &&
    typeof statements[
    'leasesExist'
    ] !== 'boolean'
  ) {
    throw new Error(
      `Listing draft ${listingUid} has no existing-leases statement.`,
    );
  }

  if (
    requiresField(
      statePackage,
      'texasLeaseCategories',
    ) &&
    [
      'residentialLeasesExist',
      'fixtureLeasesExist',
      'naturalResourceLeasesExist',
    ].some(
      field =>
        typeof statements[field] !==
        'boolean',
    )
  ) {
    throw new Error(
      `Listing draft ${listingUid} has incomplete Texas lease statements.`,
    );
  }
  if (
    requiresField(
      statePackage,
      'utahMethamphetamineContamination',
    ) &&
    typeof statements['methamphetamineContaminationKnown'] !== 'boolean'
  ) {
    throw new Error(
      `Listing draft ${listingUid} has no Utah methamphetamine-contamination statement.`,
    );
  }
}