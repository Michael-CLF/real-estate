import { STATE_DOCUMENT_REVIEW } from './arkansas-document-review';
import { withStateDocumentReview } from '../../engine/models/state-document-review';
import { HOA_POLICY, FEDERAL_LEAD_POLICY } from '../../../../core/domains/offers/state-contracts/arkansas/arkansas-policy-mappings.generated';
import {arkansasConditionRequired} from '../../../../core/domains/offers/state-contracts/arkansas/arkansas-disclosure-policy';
import { getArkansasCondominiumSections } from './questions/arkansas-condominium.sections';
import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { ArkansasOfferTerms, ArkansasContractType } from '../../../../core/domains/offers/state-contracts/arkansas/models/arkansas-offer-terms.model';
import { ARKANSAS_RESIDENTIAL_CONTRACT_DEFINITION, ARKANSAS_CONDOMINIUM_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/arkansas/models/arkansas-offer-terms.model';
import { createArkansasInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/arkansas/services/arkansas-initial-offer-terms.factory';
import { ARKANSAS_RESIDENTIAL_SALE_SECTIONS } from './questions/arkansas-residential-sale.sections';
import { ArkansasOfferValidator } from './validators/arkansas-offer.validator';
const validator = new ArkansasOfferValidator();
export const ARKANSAS_OFFER_PACKAGE: StateOfferPackage<ArkansasOfferTerms, ArkansasContractType> = withStateDocumentReview(withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'AR', stateName: 'Arkansas',
  contracts: { navstreet_arkansas_residential_sale_2026: ARKANSAS_RESIDENTIAL_CONTRACT_DEFINITION, navstreet_arkansas_condominium_resale_2026: ARKANSAS_CONDOMINIUM_CONTRACT_DEFINITION },
  createInitialTerms: input => createArkansasInitialOfferTerms(input),
  getSections: terms => getArkansasCondominiumSections(terms,ARKANSAS_RESIDENTIAL_SALE_SECTIONS).map(section=>section.id!=='disclosures'?section:{...section,questions:section.questions.filter(q=>q.fieldPath!=='disclosures.propertyConditionStatus'||arkansasConditionRequired(terms))}),
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, FEDERAL_LEAD_POLICY), HOA_POLICY), STATE_DOCUMENT_REVIEW);
