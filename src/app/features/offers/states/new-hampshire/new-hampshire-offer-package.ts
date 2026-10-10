import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { NewHampshireOfferTerms, NewHampshireContractType } from '../../../../core/domains/offers/state-contracts/new-hampshire/models/new-hampshire-offer-terms.model';
import { NEW_HAMPSHIRE_RESIDENTIAL_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/new-hampshire/models/new-hampshire-offer-terms.model';
import { createNewHampshireInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/new-hampshire/services/new-hampshire-initial-offer-terms.factory';
import { NEW_HAMPSHIRE_RESIDENTIAL_SALE_SECTIONS } from './questions/new-hampshire-residential-sale.sections';
import { NewHampshireOfferValidator } from './validators/new-hampshire-offer.validator';
const validator = new NewHampshireOfferValidator();
export const NEW_HAMPSHIRE_OFFER_PACKAGE: StateOfferPackage<NewHampshireOfferTerms, NewHampshireContractType> = {
  stateCode: 'NH', stateName: 'New Hampshire',
  contracts: { navstreet_new_hampshire_residential_sale_2026: NEW_HAMPSHIRE_RESIDENTIAL_CONTRACT_DEFINITION },
  createInitialTerms: input => createNewHampshireInitialOfferTerms(input),
  getSections: () => NEW_HAMPSHIRE_RESIDENTIAL_SALE_SECTIONS,
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
};
