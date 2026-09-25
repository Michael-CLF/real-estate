import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { WisconsinOfferTerms, WisconsinContractType } from '../../../../core/domains/offers/state-contracts/wisconsin/models/wisconsin-offer-terms.model';
import { WISCONSIN_RESIDENTIAL_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/wisconsin/models/wisconsin-offer-terms.model';
import { createWisconsinInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/wisconsin/services/wisconsin-initial-offer-terms.factory';
import { WISCONSIN_RESIDENTIAL_SALE_SECTIONS } from './questions/wisconsin-residential-sale.sections';
import { WisconsinOfferValidator } from './validators/wisconsin-offer.validator';
const validator = new WisconsinOfferValidator();
export const WISCONSIN_OFFER_PACKAGE: StateOfferPackage<WisconsinOfferTerms, WisconsinContractType> = {
  stateCode: 'WI', stateName: 'Wisconsin',
  contracts: { navstreet_wisconsin_residential_sale_2026: WISCONSIN_RESIDENTIAL_CONTRACT_DEFINITION },
  createInitialTerms: input => createWisconsinInitialOfferTerms(input),
  getSections: () => WISCONSIN_RESIDENTIAL_SALE_SECTIONS,
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
};
