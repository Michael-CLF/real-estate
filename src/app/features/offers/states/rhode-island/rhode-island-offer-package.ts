import { STATE_DOCUMENT_REVIEW } from './rhode-island-document-review';
import { withStateDocumentReview } from '../../engine/models/state-document-review';
import { HOA_POLICY, FEDERAL_LEAD_POLICY } from '../../../../core/domains/offers/state-contracts/rhode-island/rhode-island-policy-mappings.generated';
import {rhodeIslandConditionRequired} from '../../../../core/domains/offers/state-contracts/rhode-island/rhode-island-disclosure-policy';
import { getRhodeIslandCondominiumSections } from './questions/rhode-island-condominium.sections';
import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { RhodeIslandOfferTerms, RhodeIslandContractType } from '../../../../core/domains/offers/state-contracts/rhode-island/models/rhode-island-offer-terms.model';
import { RHODE_ISLAND_RESIDENTIAL_CONTRACT_DEFINITION, RHODE_ISLAND_CONDOMINIUM_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/rhode-island/models/rhode-island-offer-terms.model';
import { createRhodeIslandInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/rhode-island/services/rhode-island-initial-offer-terms.factory';
import { RHODE_ISLAND_RESIDENTIAL_SALE_SECTIONS } from './questions/rhode-island-residential-sale.sections';
import { RhodeIslandOfferValidator } from './validators/rhode-island-offer.validator';
const validator = new RhodeIslandOfferValidator();
export const RHODE_ISLAND_OFFER_PACKAGE: StateOfferPackage<RhodeIslandOfferTerms, RhodeIslandContractType> = withStateDocumentReview(withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'RI', stateName: 'Rhode Island',
  contracts: { navstreet_rhode_island_residential_sale_2026: RHODE_ISLAND_RESIDENTIAL_CONTRACT_DEFINITION, navstreet_rhode_island_condominium_resale_2026: RHODE_ISLAND_CONDOMINIUM_CONTRACT_DEFINITION },
  createInitialTerms: input => createRhodeIslandInitialOfferTerms(input),
  getSections: terms => getRhodeIslandCondominiumSections(terms,RHODE_ISLAND_RESIDENTIAL_SALE_SECTIONS).map(section=>section.id!=='disclosures'?section:{...section,questions:section.questions.filter(q=>(q.fieldPath!=='disclosures.propertyConditionStatus'||rhodeIslandConditionRequired(terms))&&(q.fieldPath!=='disclosures.statutoryPacketStatus'||terms.disclosures.requiredKnownFacts)).map(q=> q.fieldPath && ((q.fieldPath==='disclosures.propertyConditionStatus'&&terms.disclosures.conditionDisclosureRequired)||(q.fieldPath==='disclosures.statutoryPacketStatus'&&terms.disclosures.requiredKnownFacts)||(q.fieldPath==='disclosures.hoaDocumentsStatus'&&terms.disclosures.associationPacketRequired)) ? {...q,validation:{required:true,message:'Review the uploaded seller document and select its actual receipt status.'}}:q)}),
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, FEDERAL_LEAD_POLICY), HOA_POLICY), STATE_DOCUMENT_REVIEW);
