import { STATE_DOCUMENT_REVIEW } from './maine-document-review';
import { withStateDocumentReview } from '../../engine/models/state-document-review';
import { HOA_POLICY, FEDERAL_LEAD_POLICY } from '../../../../core/domains/offers/state-contracts/maine/maine-policy-mappings.generated';
import {maineConditionRequired} from '../../../../core/domains/offers/state-contracts/maine/maine-disclosure-policy';
import { getMaineCondominiumSections } from './questions/maine-condominium.sections';
import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { MaineOfferTerms, MaineContractType } from '../../../../core/domains/offers/state-contracts/maine/models/maine-offer-terms.model';
import { MAINE_RESIDENTIAL_CONTRACT_DEFINITION, MAINE_CONDOMINIUM_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/maine/models/maine-offer-terms.model';
import { createMaineInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/maine/services/maine-initial-offer-terms.factory';
import { MAINE_RESIDENTIAL_SALE_SECTIONS } from './questions/maine-residential-sale.sections';
import { MaineOfferValidator } from './validators/maine-offer.validator';
const validator = new MaineOfferValidator();
export const MAINE_OFFER_PACKAGE: StateOfferPackage<MaineOfferTerms, MaineContractType> = withStateDocumentReview(withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'ME', stateName: 'Maine',
  contracts: { navstreet_maine_residential_sale_2026: MAINE_RESIDENTIAL_CONTRACT_DEFINITION, navstreet_maine_condominium_resale_2026: MAINE_CONDOMINIUM_CONTRACT_DEFINITION },
  createInitialTerms: input => createMaineInitialOfferTerms(input),
  getSections: terms => getMaineCondominiumSections(terms,MAINE_RESIDENTIAL_SALE_SECTIONS).map(section=>section.id!=='disclosures'?section:{...section,questions:section.questions.filter(q=>q.fieldPath!=='disclosures.propertyConditionStatus'||maineConditionRequired(terms))}),
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, FEDERAL_LEAD_POLICY), HOA_POLICY), STATE_DOCUMENT_REVIEW);
