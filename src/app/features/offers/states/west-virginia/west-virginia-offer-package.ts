import { STATE_DOCUMENT_REVIEW } from './west-virginia-document-review';
import { withStateDocumentReview } from '../../engine/models/state-document-review';
import { HOA_POLICY, FEDERAL_LEAD_POLICY } from '../../../../core/domains/offers/state-contracts/west-virginia/west-virginia-policy-mappings.generated';
import {westVirginiaConditionRequired} from '../../../../core/domains/offers/state-contracts/west-virginia/west-virginia-disclosure-policy';
import { getWestVirginiaCondominiumSections } from './questions/west-virginia-condominium.sections';
import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { WestVirginiaOfferTerms, WestVirginiaContractType } from '../../../../core/domains/offers/state-contracts/west-virginia/models/west-virginia-offer-terms.model';
import { WEST_VIRGINIA_RESIDENTIAL_CONTRACT_DEFINITION, WEST_VIRGINIA_CONDOMINIUM_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/west-virginia/models/west-virginia-offer-terms.model';
import { createWestVirginiaInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/west-virginia/services/west-virginia-initial-offer-terms.factory';
import { WEST_VIRGINIA_RESIDENTIAL_SALE_SECTIONS } from './questions/west-virginia-residential-sale.sections';
import { WestVirginiaOfferValidator } from './validators/west-virginia-offer.validator';
const validator = new WestVirginiaOfferValidator();
export const WEST_VIRGINIA_OFFER_PACKAGE: StateOfferPackage<WestVirginiaOfferTerms, WestVirginiaContractType> = withStateDocumentReview(withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'WV', stateName: 'West Virginia',
  contracts: { navstreet_west_virginia_residential_sale_2026: WEST_VIRGINIA_RESIDENTIAL_CONTRACT_DEFINITION, navstreet_west_virginia_condominium_resale_2026: WEST_VIRGINIA_CONDOMINIUM_CONTRACT_DEFINITION },
  createInitialTerms: input => createWestVirginiaInitialOfferTerms(input),
  getSections: terms => getWestVirginiaCondominiumSections(terms,WEST_VIRGINIA_RESIDENTIAL_SALE_SECTIONS).map(section=>section.id!=='disclosures'?section:{...section,questions:section.questions.filter(q=>(q.fieldPath!=='disclosures.propertyConditionStatus'||westVirginiaConditionRequired(terms))&&(q.fieldPath!=='disclosures.statutoryPacketStatus'||terms.disclosures.requiredKnownFacts)).map(q=> q.fieldPath && ((q.fieldPath==='disclosures.propertyConditionStatus'&&terms.disclosures.conditionDisclosureRequired)||(q.fieldPath==='disclosures.statutoryPacketStatus'&&terms.disclosures.requiredKnownFacts)||(q.fieldPath==='disclosures.hoaDocumentsStatus'&&terms.disclosures.associationPacketRequired)) ? {...q,validation:{required:true,message:'Review the uploaded seller document and select its actual receipt status.'}}:q)}),
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, FEDERAL_LEAD_POLICY), HOA_POLICY), STATE_DOCUMENT_REVIEW);
