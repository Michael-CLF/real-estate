import { HOA_POLICY, FEDERAL_LEAD_POLICY } from '../../../../core/domains/offers/state-contracts/north-dakota/north-dakota-policy-mappings.generated';
import { getNorthDakotaCondominiumSections } from './questions/north-dakota-condominium.sections';
import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { NorthDakotaOfferTerms, NorthDakotaContractType } from '../../../../core/domains/offers/state-contracts/north-dakota/models/north-dakota-offer-terms.model';
import { NORTH_DAKOTA_RESIDENTIAL_CONTRACT_DEFINITION, NORTH_DAKOTA_CONDOMINIUM_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/north-dakota/models/north-dakota-offer-terms.model';
import { createNorthDakotaInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/north-dakota/services/north-dakota-initial-offer-terms.factory';
import { NORTH_DAKOTA_RESIDENTIAL_SALE_SECTIONS } from './questions/north-dakota-residential-sale.sections';
import { NorthDakotaOfferValidator } from './validators/north-dakota-offer.validator';
const validator = new NorthDakotaOfferValidator();
export const NORTH_DAKOTA_OFFER_PACKAGE: StateOfferPackage<NorthDakotaOfferTerms, NorthDakotaContractType> = withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'ND', stateName: 'North Dakota',
  contracts: { navstreet_north_dakota_residential_sale_2026: NORTH_DAKOTA_RESIDENTIAL_CONTRACT_DEFINITION, navstreet_north_dakota_condominium_resale_2026: NORTH_DAKOTA_CONDOMINIUM_CONTRACT_DEFINITION },
  createInitialTerms: input => createNorthDakotaInitialOfferTerms(input),
  getSections: terms => getNorthDakotaCondominiumSections(terms,NORTH_DAKOTA_RESIDENTIAL_SALE_SECTIONS).map(section=>section.id!=='disclosures'?section:{...section,questions:section.questions.filter(q=>q.fieldPath!=='disclosures.propertyConditionStatus'&&(q.fieldPath!=='disclosures.statutoryPacketStatus'||terms.disclosures.requiredKnownFacts))}),
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, FEDERAL_LEAD_POLICY), HOA_POLICY);
