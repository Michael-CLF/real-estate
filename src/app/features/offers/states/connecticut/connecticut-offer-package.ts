import { STATE_DOCUMENT_REVIEW } from './connecticut-document-review';
import { withStateDocumentReview } from '../../engine/models/state-document-review';
import { HOA_POLICY, FEDERAL_LEAD_POLICY } from '../../../../core/domains/offers/state-contracts/connecticut/connecticut-policy-mappings.generated';
import {connecticutConditionRequired} from '../../../../core/domains/offers/state-contracts/connecticut/connecticut-disclosure-policy';
import { getConnecticutCondominiumSections } from './questions/connecticut-condominium.sections';
import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { ConnecticutOfferTerms, ConnecticutContractType } from '../../../../core/domains/offers/state-contracts/connecticut/models/connecticut-offer-terms.model';
import { CONNECTICUT_RESIDENTIAL_CONTRACT_DEFINITION, CONNECTICUT_CONDOMINIUM_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/connecticut/models/connecticut-offer-terms.model';
import { createConnecticutInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/connecticut/services/connecticut-initial-offer-terms.factory';
import { CONNECTICUT_RESIDENTIAL_SALE_SECTIONS } from './questions/connecticut-residential-sale.sections';
import { ConnecticutOfferValidator } from './validators/connecticut-offer.validator';
const validator = new ConnecticutOfferValidator();
export const CONNECTICUT_OFFER_PACKAGE: StateOfferPackage<ConnecticutOfferTerms, ConnecticutContractType> = withStateDocumentReview(withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'CT', stateName: 'Connecticut',
  contracts: { navstreet_connecticut_residential_sale_2026: CONNECTICUT_RESIDENTIAL_CONTRACT_DEFINITION, navstreet_connecticut_condominium_resale_2026: CONNECTICUT_CONDOMINIUM_CONTRACT_DEFINITION },
  createInitialTerms: input => createConnecticutInitialOfferTerms(input),
  getSections: terms => getConnecticutCondominiumSections(terms,CONNECTICUT_RESIDENTIAL_SALE_SECTIONS).map(section=>section.id!=='disclosures'?section:{...section,questions:section.questions.filter(q=>(q.fieldPath!=='disclosures.propertyConditionStatus'||connecticutConditionRequired(terms))&&(q.fieldPath!=='disclosures.statutoryPacketStatus'||terms.disclosures.requiredKnownFacts)).map(q=> q.fieldPath && ((q.fieldPath==='disclosures.propertyConditionStatus'&&terms.disclosures.conditionDisclosureRequired)||(q.fieldPath==='disclosures.statutoryPacketStatus'&&terms.disclosures.requiredKnownFacts)||(q.fieldPath==='disclosures.hoaDocumentsStatus'&&terms.disclosures.associationPacketRequired)) ? {...q,validation:{required:true,message:'Review the uploaded seller document and select its actual receipt status.'}}:q)}),
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, FEDERAL_LEAD_POLICY), HOA_POLICY), STATE_DOCUMENT_REVIEW);
