import {tennesseeConditionRequired} from '../../../../core/domains/offers/state-contracts/tennessee/tennessee-disclosure-policy';
import { getTennesseeCondominiumSections } from './questions/tennessee-condominium.sections';
import { withHoaOfferPolicy } from '../../engine/hoa-offer-policy';
import { withFederalLeadOfferPolicy } from '../../engine/federal-lead-offer-policy';
import type { StateOfferPackage } from '../../engine/models/state-offer-package';
import type { TennesseeOfferTerms, TennesseeContractType } from '../../../../core/domains/offers/state-contracts/tennessee/models/tennessee-offer-terms.model';
import { TENNESSEE_RESIDENTIAL_CONTRACT_DEFINITION, TENNESSEE_CONDOMINIUM_CONTRACT_DEFINITION } from '../../../../core/domains/offers/state-contracts/tennessee/models/tennessee-offer-terms.model';
import { createTennesseeInitialOfferTerms } from '../../../../core/domains/offers/state-contracts/tennessee/services/tennessee-initial-offer-terms.factory';
import { TENNESSEE_RESIDENTIAL_SALE_SECTIONS } from './questions/tennessee-residential-sale.sections';
import { TennesseeOfferValidator } from './validators/tennessee-offer.validator';
const validator = new TennesseeOfferValidator();
export const TENNESSEE_OFFER_PACKAGE: StateOfferPackage<TennesseeOfferTerms, TennesseeContractType> = withHoaOfferPolicy(withFederalLeadOfferPolicy({
  stateCode: 'TN', stateName: 'Tennessee',
  contracts: { navstreet_tennessee_residential_sale_2026: TENNESSEE_RESIDENTIAL_CONTRACT_DEFINITION, navstreet_tennessee_condominium_resale_2026: TENNESSEE_CONDOMINIUM_CONTRACT_DEFINITION },
  createInitialTerms: input => createTennesseeInitialOfferTerms(input),
  getSections: terms => getTennesseeCondominiumSections(terms,TENNESSEE_RESIDENTIAL_SALE_SECTIONS).map(section=>section.id!=='disclosures'?section:{...section,questions:section.questions.filter(q=>(q.fieldPath!=='disclosures.propertyConditionStatus'||tennesseeConditionRequired(terms))&&(q.fieldPath!=='disclosures.statutoryPacketStatus'||terms.disclosures.requiredKnownFacts)).map(q=> q.fieldPath && ((q.fieldPath==='disclosures.propertyConditionStatus'&&terms.disclosures.conditionDisclosureRequired)||(q.fieldPath==='disclosures.statutoryPacketStatus'&&terms.disclosures.requiredKnownFacts)||(q.fieldPath==='disclosures.hoaDocumentsStatus'&&terms.disclosures.associationPacketRequired)) ? {...q,validation:{required:true,message:'Review the uploaded seller document and select its actual receipt status.'}}:q)}),
  validate: (terms, buyers, sellers, context) => validator.validate(terms, [...buyers], [...sellers], context),
}, {values:{'disclosures.leadPaintStatus':'built_1978_or_later','disclosures.leadInspectionSelection':'unselected','disclosures.leadInspectionDays':10,'documentVersions.lead-based-paint':undefined},hiddenFields:['disclosures.leadPaintStatus','disclosures.leadInspectionSelection','disclosures.leadInspectionDays']}), {"sellerFactPath":"disclosures.sellerReportsHoa","documentStatusPath":"disclosures.hoaDocumentsStatus","documentTypes":["tennessee-association-documents"]});
