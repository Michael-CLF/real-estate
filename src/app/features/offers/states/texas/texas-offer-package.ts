import type {
  StateOfferPackage,
} from '../../engine/models/state-offer-package';

import {
  getTexasContractSections,
} from './contracts/texas-contract-sections';

import {
  TEXAS_CONTRACT_DEFINITIONS,
} from '../../../../core/domains/offers/state-contracts/texas/models/texas-contract-type.model';

import type {
  TexasContractType,
} from '../../../../core/domains/offers/state-contracts/texas/models/texas-contract-type.model';

import type {
  TexasOfferTerms,
} from '../../../../core/domains/offers/state-contracts/texas/models/texas-offer-terms.model';

import {
  createTexasInitialOfferTerms,
} from '../../../../core/domains/offers/state-contracts/texas/services/texas-initial-offer-terms.factory';

import {
  TexasOfferValidator,
} from './validators/texas-offer.validator';


const texasOfferValidator =
  new TexasOfferValidator();


/*
 * Complete Texas package definition for development and testing.
 *
 * This file does not register Texas with the application. Texas
 * remains unavailable until it is deliberately added to the state
 * registry after document generation and end-to-end testing pass.
 */
export const TEXAS_OFFER_PACKAGE:
  StateOfferPackage<
    TexasOfferTerms,
    TexasContractType
  > = {
    stateCode: 'TX',
    stateName: 'Texas',

    contracts:
      TEXAS_CONTRACT_DEFINITIONS,

    createInitialTerms: input =>
      createTexasInitialOfferTerms({
        contractType:
          input.contractType,
        property: input.property,
        expiresAt: input.expiresAt,
        timeZone: input.timeZone,
      }),

    getSections: terms =>
      getTexasContractSections(
        terms.contractType
      ),

    validate: (
      terms,
      buyers,
      sellers,
      context
    ) =>
      texasOfferValidator.validate(
        terms,
        [...buyers],
        [...sellers],
        context
      ),
  };
