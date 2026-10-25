import { STATE_DOCUMENT_REVIEW } from './alaska-document-review';
import { withStateDocumentReview } from '../../engine/models/state-document-review';
import { HOA_POLICY, FEDERAL_LEAD_POLICY } from '../../../../core/domains/offers/state-contracts/alaska/alaska-policy-mappings.generated';
import {alaskaConditionRequired} from '../../../../core/domains/offers/state-contracts/alaska/alaska-disclosure-policy';
import { getAlaskaCondominiumSections } from './questions/alaska-condominium.sections';
import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { AlaskaOfferTerms, AlaskaContractType } from '../../../../core/domains/offers/state-contracts/alaska/models/alaska-offer-terms.model';
import { ALASKA_RESIDENTIAL_CONTRACT_DEFINITION, ALASKA_CONDOMINIUM_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/alaska/models/alaska-offer-terms.model';
import { createAlaskaInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/alaska/services/alaska-initial-offer-terms.factory';
import { ALASKA_RESIDENTIAL_SALE_SECTIONS } from './questions/alaska-residential-sale.sections';
import { AlaskaOfferValidator } from './validators/alaska-offer.validator';
const validator = new AlaskaOfferValidator();
export const ALASKA_OFFER_PACKAGE: StateOfferPackage<AlaskaOfferTerms, AlaskaContractType> = withStateDocumentReview(withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'AK', stateName: 'Alaska',
  contracts: { navstreet_alaska_residential_sale_2026: ALASKA_RESIDENTIAL_CONTRACT_DEFINITION, navstreet_alaska_condominium_resale_2026: ALASKA_CONDOMINIUM_CONTRACT_DEFINITION },
  createInitialTerms: input => createAlaskaInitialOfferTerms(input),
  getSections: terms => getAlaskaCondominiumSections(terms,ALASKA_RESIDENTIAL_SALE_SECTIONS).map(section=>section.id!=='disclosures'?section:{...section,questions:section.questions.filter(q=>(q.fieldPath!=='disclosures.propertyConditionStatus'||alaskaConditionRequired(terms))&&(q.fieldPath!=='disclosures.statutoryPacketStatus'||terms.disclosures.requiredKnownFacts)).map(q=> q.fieldPath && ((q.fieldPath==='disclosures.propertyConditionStatus'&&terms.disclosures.conditionDisclosureRequired)||(q.fieldPath==='disclosures.statutoryPacketStatus'&&terms.disclosures.requiredKnownFacts)||(q.fieldPath==='disclosures.hoaDocumentsStatus'&&terms.disclosures.associationPacketRequired)) ? {...q,validation:{required:true,message:'Review the uploaded seller document and select its actual receipt status.'}}:q)}),
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, FEDERAL_LEAD_POLICY), HOA_POLICY), STATE_DOCUMENT_REVIEW);
