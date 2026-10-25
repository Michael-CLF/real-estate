import { HOA_POLICY, FEDERAL_LEAD_POLICY } from '../../../../core/domains/offers/state-contracts/georgia/georgia-policy-mappings.generated';
import {georgiaConditionRequired} from '../../../../core/domains/offers/state-contracts/georgia/georgia-disclosure-policy';
import { getGeorgiaCondominiumSections } from './questions/georgia-condominium.sections';
import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { GeorgiaOfferTerms, GeorgiaContractType } from '../../../../core/domains/offers/state-contracts/georgia/models/georgia-offer-terms.model';
import { GEORGIA_RESIDENTIAL_CONTRACT_DEFINITION, GEORGIA_CONDOMINIUM_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/georgia/models/georgia-offer-terms.model';
import { createGeorgiaInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/georgia/services/georgia-initial-offer-terms.factory';
import { GEORGIA_RESIDENTIAL_SALE_SECTIONS } from './questions/georgia-residential-sale.sections';
import { GeorgiaOfferValidator } from './validators/georgia-offer.validator';
const validator = new GeorgiaOfferValidator();
export const GEORGIA_OFFER_PACKAGE: StateOfferPackage<GeorgiaOfferTerms, GeorgiaContractType> = withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'GA', stateName: 'Georgia',
  contracts: { navstreet_georgia_residential_sale_2026: GEORGIA_RESIDENTIAL_CONTRACT_DEFINITION, navstreet_georgia_condominium_resale_2026: GEORGIA_CONDOMINIUM_CONTRACT_DEFINITION },
  createInitialTerms: input => createGeorgiaInitialOfferTerms(input),
  getSections: terms => getGeorgiaCondominiumSections(terms,GEORGIA_RESIDENTIAL_SALE_SECTIONS).map(section=>section.id!=='disclosures'?section:{...section,questions:section.questions.filter(q=>(q.fieldPath!=='disclosures.propertyConditionStatus'||georgiaConditionRequired(terms))&&(q.fieldPath!=='disclosures.statutoryPacketStatus'||terms.disclosures.requiredKnownFacts))}),
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, FEDERAL_LEAD_POLICY), HOA_POLICY);
