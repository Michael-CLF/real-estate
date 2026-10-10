import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { MissouriOfferTerms, MissouriContractType } from '../../../../core/domains/offers/state-contracts/missouri/models/missouri-offer-terms.model';
import { MISSOURI_RESIDENTIAL_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/missouri/models/missouri-offer-terms.model';
import { createMissouriInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/missouri/services/missouri-initial-offer-terms.factory';
import { MISSOURI_RESIDENTIAL_SALE_SECTIONS } from './questions/missouri-residential-sale.sections';
import { MissouriOfferValidator } from './validators/missouri-offer.validator';
const validator = new MissouriOfferValidator();
export const MISSOURI_OFFER_PACKAGE: StateOfferPackage<MissouriOfferTerms, MissouriContractType> = {
  stateCode: 'MO', stateName: 'Missouri',
  contracts: { navstreet_missouri_residential_sale_2026: MISSOURI_RESIDENTIAL_CONTRACT_DEFINITION },
  createInitialTerms: input => createMissouriInitialOfferTerms(input),
  getSections: () => MISSOURI_RESIDENTIAL_SALE_SECTIONS,
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
};
