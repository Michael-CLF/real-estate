import { STATE_DOCUMENT_REVIEW } from './vermont-document-review';
import { withStateDocumentReview } from '../../engine/models/state-document-review';
import { HOA_POLICY, FEDERAL_LEAD_POLICY } from '../../../../core/domains/offers/state-contracts/vermont/vermont-policy-mappings.generated';
import {vermontConditionRequired} from '../../../../core/domains/offers/state-contracts/vermont/vermont-disclosure-policy';
import { getVermontCondominiumSections } from './questions/vermont-condominium.sections';
import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { VermontOfferTerms, VermontContractType } from '../../../../core/domains/offers/state-contracts/vermont/models/vermont-offer-terms.model';
import { VERMONT_RESIDENTIAL_CONTRACT_DEFINITION, VERMONT_CONDOMINIUM_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/vermont/models/vermont-offer-terms.model';
import { createVermontInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/vermont/services/vermont-initial-offer-terms.factory';
import { VERMONT_RESIDENTIAL_SALE_SECTIONS } from './questions/vermont-residential-sale.sections';
import { VermontOfferValidator } from './validators/vermont-offer.validator';
const validator = new VermontOfferValidator();
export const VERMONT_OFFER_PACKAGE: StateOfferPackage<VermontOfferTerms, VermontContractType> = withStateDocumentReview(withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'VT', stateName: 'Vermont',
  contracts: { navstreet_vermont_residential_sale_2026: VERMONT_RESIDENTIAL_CONTRACT_DEFINITION, navstreet_vermont_condominium_resale_2026: VERMONT_CONDOMINIUM_CONTRACT_DEFINITION },
  createInitialTerms: input => createVermontInitialOfferTerms(input),
  getSections: terms => getVermontCondominiumSections(terms,VERMONT_RESIDENTIAL_SALE_SECTIONS).map(section=>section.id!=='disclosures'?section:{...section,questions:section.questions.filter(q=>(q.fieldPath!=='disclosures.propertyConditionStatus'||vermontConditionRequired(terms))&&(q.fieldPath!=='disclosures.statutoryPacketStatus'||terms.disclosures.requiredKnownFacts)).map(q=> q.fieldPath && ((q.fieldPath==='disclosures.propertyConditionStatus'&&terms.disclosures.conditionDisclosureRequired)||(q.fieldPath==='disclosures.statutoryPacketStatus'&&terms.disclosures.requiredKnownFacts)||(q.fieldPath==='disclosures.hoaDocumentsStatus'&&terms.disclosures.associationPacketRequired)) ? {...q,validation:{required:true,message:'Review the uploaded seller document and select its actual receipt status.'}}:q)}),
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, FEDERAL_LEAD_POLICY), HOA_POLICY), STATE_DOCUMENT_REVIEW);
