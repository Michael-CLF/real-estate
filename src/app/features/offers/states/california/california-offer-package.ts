import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { CaliforniaOfferTerms, CaliforniaContractType } from '../../../../core/domains/offers/state-contracts/california/models/california-offer-terms.model';
import { CALIFORNIA_RESIDENTIAL_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/california/models/california-offer-terms.model';
import { createCaliforniaInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/california/services/california-initial-offer-terms.factory';
import { CALIFORNIA_RESIDENTIAL_SALE_SECTIONS } from './questions/california-residential-sale.sections';
import { CaliforniaOfferValidator } from './validators/california-offer.validator';
const validator = new CaliforniaOfferValidator();
export const CALIFORNIA_OFFER_PACKAGE: StateOfferPackage<CaliforniaOfferTerms, CaliforniaContractType> = {
  stateCode: 'CA', stateName: 'California',
  contracts: { navstreet_california_residential_sale_2026: CALIFORNIA_RESIDENTIAL_CONTRACT_DEFINITION },
  createInitialTerms: input => createCaliforniaInitialOfferTerms(input),
  getSections: () => CALIFORNIA_RESIDENTIAL_SALE_SECTIONS,
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
};