import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { OklahomaContractType, OklahomaOfferTerms } from '../../../../core/domains/offers/state-contracts/oklahoma/models/oklahoma-offer-terms.model';
import { OKLAHOMA_RESIDENTIAL_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/oklahoma/models/oklahoma-offer-terms.model';
import { createOklahomaInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/oklahoma/services/oklahoma-initial-offer-terms.factory';
import { OKLAHOMA_RESIDENTIAL_SALE_SECTIONS } from './questions/oklahoma-residential-sale.sections';
import { OklahomaOfferValidator } from './validators/oklahoma-offer.validator';

const validator = new OklahomaOfferValidator();

export const OKLAHOMA_OFFER_PACKAGE: StateOfferPackage<OklahomaOfferTerms, OklahomaContractType> = {
  stateCode: 'OK',
  stateName: 'Oklahoma',
  contracts: { residential_sale_2026: OKLAHOMA_RESIDENTIAL_CONTRACT_DEFINITION },
  createInitialTerms: input => createOklahomaInitialOfferTerms(input),
  getSections: () => OKLAHOMA_RESIDENTIAL_SALE_SECTIONS,
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
};
