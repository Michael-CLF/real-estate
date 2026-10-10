import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { ArizonaOfferTerms, ArizonaContractType } from '../../../../core/domains/offers/state-contracts/arizona/models/arizona-offer-terms.model';
import { ARIZONA_RESIDENTIAL_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/arizona/models/arizona-offer-terms.model';
import { createArizonaInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/arizona/services/arizona-initial-offer-terms.factory';
import { ARIZONA_RESIDENTIAL_SALE_SECTIONS } from './questions/arizona-residential-sale.sections';
import { ArizonaOfferValidator } from './validators/arizona-offer.validator';
const validator = new ArizonaOfferValidator();
export const ARIZONA_OFFER_PACKAGE: StateOfferPackage<ArizonaOfferTerms, ArizonaContractType> = {
  stateCode: 'AZ', stateName: 'Arizona',
  contracts: { navstreet_arizona_residential_sale_2026: ARIZONA_RESIDENTIAL_CONTRACT_DEFINITION },
  createInitialTerms: input => createArizonaInitialOfferTerms(input),
  getSections: () => ARIZONA_RESIDENTIAL_SALE_SECTIONS,
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
};
