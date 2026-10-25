import { HOA_POLICY, FEDERAL_LEAD_POLICY } from '../../../../core/domains/offers/state-contracts/illinois/illinois-policy-mappings.generated';
import {illinoisConditionRequired} from '../../../../core/domains/offers/state-contracts/illinois/illinois-disclosure-policy';
import { getIllinoisCondominiumSections } from './questions/illinois-condominium.sections';
import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { IllinoisOfferTerms, IllinoisContractType } from '../../../../core/domains/offers/state-contracts/illinois/models/illinois-offer-terms.model';
import { ILLINOIS_RESIDENTIAL_CONTRACT_DEFINITION, ILLINOIS_CONDOMINIUM_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/illinois/models/illinois-offer-terms.model';
import { createIllinoisInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/illinois/services/illinois-initial-offer-terms.factory';
import { ILLINOIS_RESIDENTIAL_SALE_SECTIONS } from './questions/illinois-residential-sale.sections';
import { IllinoisOfferValidator } from './validators/illinois-offer.validator';
const validator = new IllinoisOfferValidator();
export const ILLINOIS_OFFER_PACKAGE: StateOfferPackage<IllinoisOfferTerms, IllinoisContractType> = withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'IL', stateName: 'Illinois',
  contracts: { navstreet_illinois_residential_sale_2026: ILLINOIS_RESIDENTIAL_CONTRACT_DEFINITION, navstreet_illinois_condominium_resale_2026: ILLINOIS_CONDOMINIUM_CONTRACT_DEFINITION },
  createInitialTerms: input => createIllinoisInitialOfferTerms(input),
  getSections: terms => getIllinoisCondominiumSections(terms,ILLINOIS_RESIDENTIAL_SALE_SECTIONS).map(section=>section.id!=='disclosures'?section:{...section,questions:section.questions.filter(q=>(q.fieldPath!=='disclosures.propertyConditionStatus'||illinoisConditionRequired(terms)) && (!['disclosures.statutoryPacketStatus','disclosures.radonNoticeAcknowledged'].includes(q.fieldPath??'') || terms.disclosures.requiredKnownFacts))}),
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, FEDERAL_LEAD_POLICY), HOA_POLICY);
