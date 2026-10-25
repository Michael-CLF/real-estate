import { SECTION_LEGAL_CONTENT_20261025_V1 } from '../legal-content/offer-section-content.2026-10-25.v1';
import type { MissouriOfferTerms } from '../../../../../core/domains/offers/state-contracts/missouri/models/missouri-offer-terms.model';
import type { OfferSectionDefinition } from '../../../engine/models/offer-section-definition';
import type { OfferQuestionDefinition } from '../../../engine/models/offer-question-definition';
const required={required:true,message:'Complete this property-specific term.'};
const text=(id:string,label:string):OfferQuestionDefinition=>({id,label,type:['projectName','unitDesignation'].includes(id)?'text':'textarea',fieldPath:'specialProperty.'+id,validation:{...required,maximumLength:['projectName','unitDesignation'].includes(id)?300:3000}});
const yes=(id:string,label:string,helpText?:string):OfferQuestionDefinition=>({id,label,type:'acknowledgement',fieldPath:'specialProperty.'+id,validation:required,helpText});
export function getMissouriSections(terms:MissouriOfferTerms, sections:readonly OfferSectionDefinition[]):readonly OfferSectionDefinition[] {
 const condo=terms.contractType==='navstreet_missouri_condominium_resale_2026';
 const land=terms.contractType==='navstreet_missouri_land_sale_2026';
 const multi=terms.contractType==='navstreet_missouri_small_multifamily_resale_2026';
 const extra:OfferQuestionDefinition[]=land?[
  text('intendedUse','Intended use of the land'),
  {id:'surveyRequired',type:'yes_no',label:'Require a current boundary survey before closing?',fieldPath:'specialProperty.surveyRequired',validation:required},
  yes('landReviewAcknowledged','I understand the land investigation and title conditions.',SECTION_LEGAL_CONTENT_20261025_V1["special_property_notice"])
 ]:multi?[
  {id:'dwelling-unit-count',type:'number',label:'Seller reports dwelling units',fieldPath:'property.contractFacts.dwellingUnitCount',readOnly:true,validation:{required:true,minimum:2,maximum:4,message:'The seller must report 2 to 4 dwelling units.'}},
  {id:'tenantDocumentsStatus',type:'single_choice',label:'Existing leases, rent roll and security deposit records',fieldPath:'specialProperty.tenantDocumentsStatus',validation:required,options:[{value:'received',label:'Actually received and reviewed'},{value:'pending',label:'Not yet received'},{value:'not_applicable',label:'Seller reports no existing leases'}]},
  yes('tenancyTransferAcknowledged','I understand the tenant, rent and deposit transfer terms.',SECTION_LEGAL_CONTENT_20261025_V1["special_property_notice_2"])
 ]:[];
 if(!condo && !extra.length)return sections;
 return sections.map(section=>{
  if(section.id!=='disclosures')return section;
  const questions=section.questions.map(question=>{
   if(question.fieldPath==='disclosures.statutoryPacketStatus')return {...question,helpText:SECTION_LEGAL_CONTENT_20261025_V1["special_property_helpText"]};
   if(land && question.fieldPath==='disclosures.leadPaintStatus')return {...question,readOnly:true,options:[{value:'not_applicable',label:'Vacant land: no residential housing is included'}]};
   return question;
  }).filter(question=>(!condo || question.fieldPath !== 'disclosures.hoaDocumentsStatus') && (!land || !['disclosures.leadInspectionSelection','disclosures.leadInspectionDays'].includes(question.fieldPath??'')));
  return {...section,questions:[...extra,...questions]};
 });
}
