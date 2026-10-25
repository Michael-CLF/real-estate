import { HOA_POLICY, FEDERAL_LEAD_POLICY } from '../../../../core/domains/offers/state-contracts/mississippi/mississippi-policy-mappings.generated';
import {mississippiConditionRequired} from '../../../../core/domains/offers/state-contracts/mississippi/mississippi-disclosure-policy';
import { getMississippiCondominiumSections } from './questions/mississippi-condominium.sections';
import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { MississippiOfferTerms, MississippiContractType } from '../../../../core/domains/offers/state-contracts/mississippi/models/mississippi-offer-terms.model';
import { MISSISSIPPI_RESIDENTIAL_CONTRACT_DEFINITION, MISSISSIPPI_CONDOMINIUM_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/mississippi/models/mississippi-offer-terms.model';
import { createMississippiInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/mississippi/services/mississippi-initial-offer-terms.factory';
import { MISSISSIPPI_RESIDENTIAL_SALE_SECTIONS } from './questions/mississippi-residential-sale.sections';
import { MississippiOfferValidator } from './validators/mississippi-offer.validator';
const validator = new MississippiOfferValidator();
export const MISSISSIPPI_OFFER_PACKAGE: StateOfferPackage<MississippiOfferTerms, MississippiContractType> = withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'MS', stateName: 'Mississippi',
  contracts: { navstreet_mississippi_residential_sale_2026: MISSISSIPPI_RESIDENTIAL_CONTRACT_DEFINITION, navstreet_mississippi_condominium_resale_2026: MISSISSIPPI_CONDOMINIUM_CONTRACT_DEFINITION },
  createInitialTerms: input => createMississippiInitialOfferTerms(input),
  getSections: terms => getMississippiCondominiumSections(terms,MISSISSIPPI_RESIDENTIAL_SALE_SECTIONS).map(section=>section.id!=='disclosures'?section:{...section,questions:section.questions.filter(q=>q.fieldPath!=='disclosures.propertyConditionStatus'||mississippiConditionRequired(terms))}),
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, FEDERAL_LEAD_POLICY), HOA_POLICY);
