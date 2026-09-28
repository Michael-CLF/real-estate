import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { LouisianaOfferTerms, LouisianaContractType } from '../../../../core/domains/offers/state-contracts/louisiana/models/louisiana-offer-terms.model';
import { LOUISIANA_RESIDENTIAL_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/louisiana/models/louisiana-offer-terms.model';
import { createLouisianaInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/louisiana/services/louisiana-initial-offer-terms.factory';
import { LOUISIANA_RESIDENTIAL_SALE_SECTIONS } from './questions/louisiana-residential-sale.sections';
import { LouisianaOfferValidator } from './validators/louisiana-offer.validator';
const validator = new LouisianaOfferValidator();
export const LOUISIANA_OFFER_PACKAGE: StateOfferPackage<LouisianaOfferTerms, LouisianaContractType> = {
  stateCode: 'LA', stateName: 'Louisiana',
  contracts: { lrec_louisiana_residential_agreement_2026: LOUISIANA_RESIDENTIAL_CONTRACT_DEFINITION },
  createInitialTerms: input => createLouisianaInitialOfferTerms(input),
  getSections: () => LOUISIANA_RESIDENTIAL_SALE_SECTIONS,
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
};