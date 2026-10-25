import { STATE_DOCUMENT_REVIEW } from './virginia-document-review';
import { withStateDocumentReview } from '../../engine/models/state-document-review';
import { HOA_POLICY, FEDERAL_LEAD_POLICY } from '../../../../core/domains/offers/state-contracts/virginia/virginia-policy-mappings.generated';
import {virginiaConditionRequired} from '../../../../core/domains/offers/state-contracts/virginia/virginia-disclosure-policy';
import { getVirginiaCondominiumSections } from './questions/virginia-condominium.sections';
import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { VirginiaOfferTerms, VirginiaContractType } from '../../../../core/domains/offers/state-contracts/virginia/models/virginia-offer-terms.model';
import { VIRGINIA_RESIDENTIAL_CONTRACT_DEFINITION, VIRGINIA_CONDOMINIUM_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/virginia/models/virginia-offer-terms.model';
import { createVirginiaInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/virginia/services/virginia-initial-offer-terms.factory';
import { VIRGINIA_RESIDENTIAL_SALE_SECTIONS } from './questions/virginia-residential-sale.sections';
import { VirginiaOfferValidator } from './validators/virginia-offer.validator';
const validator = new VirginiaOfferValidator();
export const VIRGINIA_OFFER_PACKAGE: StateOfferPackage<VirginiaOfferTerms, VirginiaContractType> = withStateDocumentReview(withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'VA', stateName: 'Virginia',
  contracts: { navstreet_virginia_residential_sale_2026: VIRGINIA_RESIDENTIAL_CONTRACT_DEFINITION, navstreet_virginia_condominium_resale_2026: VIRGINIA_CONDOMINIUM_CONTRACT_DEFINITION },
  createInitialTerms: input => createVirginiaInitialOfferTerms(input),
  getSections: terms => getVirginiaCondominiumSections(terms,VIRGINIA_RESIDENTIAL_SALE_SECTIONS).map(section=>section.id!=='disclosures'?section:{...section,questions:section.questions.filter(q=>(q.fieldPath!=='disclosures.propertyConditionStatus'||virginiaConditionRequired(terms))&&(q.fieldPath!=='disclosures.statutoryPacketStatus'||terms.disclosures.requiredKnownFacts)).map(q=> q.fieldPath && ((q.fieldPath==='disclosures.propertyConditionStatus'&&terms.disclosures.conditionDisclosureRequired)||(q.fieldPath==='disclosures.statutoryPacketStatus'&&terms.disclosures.requiredKnownFacts)||(q.fieldPath==='disclosures.hoaDocumentsStatus'&&terms.disclosures.associationPacketRequired)) ? {...q,validation:{required:true,message:'Review the uploaded seller document and select its actual receipt status.'}}:q)}),
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, FEDERAL_LEAD_POLICY), HOA_POLICY), STATE_DOCUMENT_REVIEW);
