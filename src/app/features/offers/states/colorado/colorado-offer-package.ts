import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { ColoradoOfferTerms, ColoradoContractType } from '../../../../core/domains/offers/state-contracts/colorado/models/colorado-offer-terms.model';
import { COLORADO_RESIDENTIAL_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/colorado/models/colorado-offer-terms.model';
import { createColoradoInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/colorado/services/colorado-initial-offer-terms.factory';
import { COLORADO_RESIDENTIAL_SALE_SECTIONS } from './questions/colorado-residential-sale.sections';
import { ColoradoOfferValidator } from './validators/colorado-offer.validator';
const validator = new ColoradoOfferValidator();
export const COLORADO_OFFER_PACKAGE: StateOfferPackage<ColoradoOfferTerms, ColoradoContractType> = {
  stateCode: 'CO', stateName: 'Colorado',
  contracts: { navstreet_colorado_residential_2026: COLORADO_RESIDENTIAL_CONTRACT_DEFINITION },
  createInitialTerms: input => createColoradoInitialOfferTerms(input),
  getSections: terms => COLORADO_RESIDENTIAL_SALE_SECTIONS.map(section => ({
    ...section,
    questions: section.questions.map(question =>
      question.fieldPath === 'purchase.financingType' &&
      !terms.sellerLoan?.available
        ? { ...question, disabledValues: ['assumption'] }
        : question
    ),
  })),
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
};