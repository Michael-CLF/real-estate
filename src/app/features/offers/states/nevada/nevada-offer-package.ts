import { HOA_POLICY, FEDERAL_LEAD_POLICY } from '../../../../core/domains/offers/state-contracts/nevada/nevada-policy-mappings.generated';
import {nevadaConditionRequired} from '../../../../core/domains/offers/state-contracts/nevada/nevada-disclosure-policy';
import { getNevadaCondominiumSections } from './questions/nevada-condominium.sections';
import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { NevadaOfferTerms, NevadaContractType } from '../../../../core/domains/offers/state-contracts/nevada/models/nevada-offer-terms.model';
import { NEVADA_RESIDENTIAL_CONTRACT_DEFINITION, NEVADA_CONDOMINIUM_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/nevada/models/nevada-offer-terms.model';
import { createNevadaInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/nevada/services/nevada-initial-offer-terms.factory';
import { NEVADA_RESIDENTIAL_SALE_SECTIONS } from './questions/nevada-residential-sale.sections';
import { NevadaOfferValidator } from './validators/nevada-offer.validator';
const validator = new NevadaOfferValidator();
export const NEVADA_OFFER_PACKAGE: StateOfferPackage<NevadaOfferTerms, NevadaContractType> = withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'NV', stateName: 'Nevada',
  contracts: { navstreet_nevada_residential_sale_2026: NEVADA_RESIDENTIAL_CONTRACT_DEFINITION, navstreet_nevada_condominium_resale_2026: NEVADA_CONDOMINIUM_CONTRACT_DEFINITION },
  createInitialTerms: input => createNevadaInitialOfferTerms(input),
  getSections: terms => getNevadaCondominiumSections(terms,NEVADA_RESIDENTIAL_SALE_SECTIONS).map(section=>section.id!=='disclosures'?section:{...section,questions:section.questions.filter(q=>(q.fieldPath!=='disclosures.propertyConditionStatus'||nevadaConditionRequired(terms))&&(q.fieldPath!=='disclosures.statutoryPacketStatus'||terms.disclosures.requiredKnownFacts))}),
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, FEDERAL_LEAD_POLICY), HOA_POLICY);
