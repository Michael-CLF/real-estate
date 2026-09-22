import type {
  OfferSectionDefinition,
} from '../../../engine/models/offer-section-definition';

import type {
  TexasContractType,
} from '../../../../../core/domains/offers/state-contracts/texas/models/texas-contract-type.model';

import {
  TEXAS_CONDOMINIUM_RESALE_SECTIONS,
} from './condominium-resale/condominium-resale.sections';

import {
  TEXAS_FARM_AND_RANCH_SECTIONS,
} from './farm-and-ranch/farm-and-ranch.sections';

import {
  TEXAS_NEW_HOME_COMPLETED_SECTIONS,
} from './new-home-completed/new-home-completed.sections';

import {
  TEXAS_NEW_HOME_INCOMPLETE_SECTIONS,
} from './new-home-incomplete/new-home-incomplete.sections';

import {
  TEXAS_ONE_TO_FOUR_FAMILY_RESALE_SECTIONS,
} from './one-to-four-family-resale/one-to-four-family-resale.sections';

import {
  TEXAS_UNIMPROVED_PROPERTY_SECTIONS,
} from './unimproved-property/unimproved-property.sections';


const TEXAS_CONTRACT_SECTIONS:
  Readonly<
    Record<
      TexasContractType,
      readonly OfferSectionDefinition[]
    >
  > = {
    one_to_four_family_resale:
      TEXAS_ONE_TO_FOUR_FAMILY_RESALE_SECTIONS,

    condominium_resale:
      TEXAS_CONDOMINIUM_RESALE_SECTIONS,

    new_home_completed:
      TEXAS_NEW_HOME_COMPLETED_SECTIONS,

    new_home_incomplete:
      TEXAS_NEW_HOME_INCOMPLETE_SECTIONS,

    farm_and_ranch:
      TEXAS_FARM_AND_RANCH_SECTIONS,

    unimproved_property:
      TEXAS_UNIMPROVED_PROPERTY_SECTIONS,
  };


export function getTexasContractSections(
  contractType: TexasContractType
): readonly OfferSectionDefinition[] {
  return TEXAS_CONTRACT_SECTIONS[
    contractType
  ];
}
