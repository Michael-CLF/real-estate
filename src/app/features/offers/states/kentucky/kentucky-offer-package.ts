import { HOA_POLICY, FEDERAL_LEAD_POLICY } from '../../../../core/domains/offers/state-contracts/kentucky/kentucky-policy-mappings.generated';
import {kentuckyConditionRequired} from '../../../../core/domains/offers/state-contracts/kentucky/kentucky-disclosure-policy';
import { getKentuckyCondominiumSections } from './questions/kentucky-condominium.sections';
import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { KentuckyOfferTerms, KentuckyContractType } from '../../../../core/domains/offers/state-contracts/kentucky/models/kentucky-offer-terms.model';
import { KENTUCKY_RESIDENTIAL_CONTRACT_DEFINITION, KENTUCKY_CONDOMINIUM_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/kentucky/models/kentucky-offer-terms.model';
import { createKentuckyInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/kentucky/services/kentucky-initial-offer-terms.factory';
import { KENTUCKY_RESIDENTIAL_SALE_SECTIONS } from './questions/kentucky-residential-sale.sections';
import { KentuckyOfferValidator } from './validators/kentucky-offer.validator';
const validator = new KentuckyOfferValidator();
export const KENTUCKY_OFFER_PACKAGE: StateOfferPackage<KentuckyOfferTerms, KentuckyContractType> = withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'KY', stateName: 'Kentucky',
  contracts: { navstreet_kentucky_residential_sale_2026: KENTUCKY_RESIDENTIAL_CONTRACT_DEFINITION, navstreet_kentucky_condominium_resale_2026: KENTUCKY_CONDOMINIUM_CONTRACT_DEFINITION },
  createInitialTerms: input => createKentuckyInitialOfferTerms(input),
  getSections: terms => getKentuckyCondominiumSections(terms,KENTUCKY_RESIDENTIAL_SALE_SECTIONS).map(section=>section.id!=='disclosures'?section:{...section,questions:section.questions.filter(q=>(q.fieldPath!=='disclosures.propertyConditionStatus'||kentuckyConditionRequired(terms))&&(q.fieldPath!=='disclosures.statutoryPacketStatus'||terms.disclosures.requiredKnownFacts)).map(q=> q.fieldPath && ((q.fieldPath==='disclosures.propertyConditionStatus'&&terms.disclosures.conditionDisclosureRequired)||(q.fieldPath==='disclosures.statutoryPacketStatus'&&terms.disclosures.requiredKnownFacts)||(q.fieldPath==='disclosures.hoaDocumentsStatus'&&terms.disclosures.associationPacketRequired)) ? {...q,validation:{required:true,message:'Review the uploaded seller document and select its actual receipt status.'}}:q)}),
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, FEDERAL_LEAD_POLICY), HOA_POLICY);
