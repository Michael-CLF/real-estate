import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { SouthCarolinaOfferTerms, SouthCarolinaContractType } from '../../../../core/domains/offers/state-contracts/south-carolina/models/south-carolina-offer-terms.model';
import { SOUTH_CAROLINA_RESIDENTIAL_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/south-carolina/models/south-carolina-offer-terms.model';
import { createSouthCarolinaInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/south-carolina/services/south-carolina-initial-offer-terms.factory';
import { SOUTH_CAROLINA_RESIDENTIAL_SALE_SECTIONS } from './questions/south-carolina-residential-sale.sections';
import { SouthCarolinaOfferValidator } from './validators/south-carolina-offer.validator';
const validator = new SouthCarolinaOfferValidator();
export const SOUTH_CAROLINA_OFFER_PACKAGE: StateOfferPackage<SouthCarolinaOfferTerms, SouthCarolinaContractType> = {
  stateCode: 'SC', stateName: 'South Carolina',
  contracts: { navstreet_south_carolina_residential_sale_2026: SOUTH_CAROLINA_RESIDENTIAL_CONTRACT_DEFINITION },
  createInitialTerms: input => createSouthCarolinaInitialOfferTerms(input),
  getSections: () => SOUTH_CAROLINA_RESIDENTIAL_SALE_SECTIONS,
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
};