import { STATE_DOCUMENT_REVIEW } from './wyoming-document-review';
import { withStateDocumentReview } from '../../engine/models/state-document-review';
import { HOA_POLICY, FEDERAL_LEAD_POLICY } from '../../../../core/domains/offers/state-contracts/wyoming/wyoming-policy-mappings.generated';
import { getWyomingCondominiumSections } from './questions/wyoming-condominium.sections';
import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { WyomingOfferTerms, WyomingContractType } from '../../../../core/domains/offers/state-contracts/wyoming/models/wyoming-offer-terms.model';
import { WYOMING_RESIDENTIAL_CONTRACT_DEFINITION, WYOMING_CONDOMINIUM_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/wyoming/models/wyoming-offer-terms.model';
import { createWyomingInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/wyoming/services/wyoming-initial-offer-terms.factory';
import { WYOMING_RESIDENTIAL_SALE_SECTIONS } from './questions/wyoming-residential-sale.sections';
import { WyomingOfferValidator } from './validators/wyoming-offer.validator';
const validator = new WyomingOfferValidator();
export const WYOMING_OFFER_PACKAGE: StateOfferPackage<WyomingOfferTerms, WyomingContractType> = withStateDocumentReview(withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'WY', stateName: 'Wyoming',
  contracts: { navstreet_wyoming_residential_sale_2026: WYOMING_RESIDENTIAL_CONTRACT_DEFINITION, navstreet_wyoming_condominium_resale_2026: WYOMING_CONDOMINIUM_CONTRACT_DEFINITION },
  createInitialTerms: input => createWyomingInitialOfferTerms(input),
  getSections: terms => getWyomingCondominiumSections(terms,WYOMING_RESIDENTIAL_SALE_SECTIONS),
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, FEDERAL_LEAD_POLICY), HOA_POLICY), STATE_DOCUMENT_REVIEW);