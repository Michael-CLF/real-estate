import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { AlabamaOfferTerms, AlabamaContractType } from '../../../../core/domains/offers/state-contracts/alabama/models/alabama-offer-terms.model';
import { ALABAMA_RESIDENTIAL_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/alabama/models/alabama-offer-terms.model';
import { createAlabamaInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/alabama/services/alabama-initial-offer-terms.factory';
import { ALABAMA_RESIDENTIAL_SALE_SECTIONS } from './questions/alabama-residential-sale.sections';
import { AlabamaOfferValidator } from './validators/alabama-offer.validator';
const validator = new AlabamaOfferValidator();
export const ALABAMA_OFFER_PACKAGE: StateOfferPackage<AlabamaOfferTerms, AlabamaContractType> = {
  stateCode: 'AL', stateName: 'Alabama',
  contracts: { navstreet_alabama_residential_sale_2026: ALABAMA_RESIDENTIAL_CONTRACT_DEFINITION },
  createInitialTerms: input => createAlabamaInitialOfferTerms(input),
  getSections: () => ALABAMA_RESIDENTIAL_SALE_SECTIONS,
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
};
