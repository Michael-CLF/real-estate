import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { OregonOfferTerms, OregonContractType } from '../../../../core/domains/offers/state-contracts/oregon/models/oregon-offer-terms.model';
import { OREGON_RESIDENTIAL_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/oregon/models/oregon-offer-terms.model';
import { createOregonInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/oregon/services/oregon-initial-offer-terms.factory';
import { OREGON_RESIDENTIAL_SALE_SECTIONS } from './questions/oregon-residential-sale.sections';
import { OregonOfferValidator } from './validators/oregon-offer.validator';
const validator = new OregonOfferValidator();
export const OREGON_OFFER_PACKAGE: StateOfferPackage<OregonOfferTerms, OregonContractType> = {
  stateCode: 'OR', stateName: 'Oregon',
  contracts: { navstreet_oregon_residential_sale_2026: OREGON_RESIDENTIAL_CONTRACT_DEFINITION },
  createInitialTerms: input => createOregonInitialOfferTerms(input),
  getSections: () => OREGON_RESIDENTIAL_SALE_SECTIONS,
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
};
