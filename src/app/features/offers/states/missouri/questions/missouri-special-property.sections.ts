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
  yes('landReviewAcknowledged','I understand the land investigation and title conditions.','Investigate legal access, boundaries, zoning and subdivision restrictions, utility availability, water and mineral rights, drainage/flood hazards, environmental conditions and septic feasibility during the agreed inspection period. This land agreement covers a vacant parcel, not a developer sale, farm business, mobile home or seller-financed installment transaction.')
 ]:multi?[
  {id:'dwelling-unit-count',type:'number',label:'Seller reports dwelling units',fieldPath:'property.contractFacts.dwellingUnitCount',readOnly:true,validation:{required:true,minimum:2,maximum:4,message:'The seller must report 2 to 4 dwelling units.'}},
  {id:'tenantDocumentsStatus',type:'single_choice',label:'Existing leases, rent roll and security deposit records',fieldPath:'specialProperty.tenantDocumentsStatus',validation:required,options:[{value:'received',label:'Actually received and reviewed'},{value:'pending',label:'Not yet received'},{value:'not_applicable',label:'Seller reports no existing leases'}]},
  yes('tenancyTransferAcknowledged','I understand the tenant, rent and deposit transfer terms.','Existing lawful tenancies are not terminated by this sale. Seller shall supply leases, amendments, rent roll, deposits, prepaid rents, notices and known disputes; rents and deposits must be accounted for at closing. Buyer may review these records and terminate under the agreed inspection contingency. Closing remains subject to required records and lawful assignment; no tenant eviction or forfeiture is authorized by this contract.')
 ]:[];
 if(!condo && !extra.length)return sections;
 return sections.map(section=>{
  if(section.id!=='disclosures')return section;
  const questions=section.questions.map(question=>{
   if(question.fieldPath==='disclosures.statutoryPacketStatus')return {...question,helpText:'Review applicable Missouri known-history and local property records. This selected agreement also contains property-specific condominium, vacant-land or small-multifamily terms. Developer, leasehold, mobile-home and seller-financed installment transactions remain outside its scope.'};
   if(land && question.fieldPath==='disclosures.leadPaintStatus')return {...question,readOnly:true,options:[{value:'not_applicable',label:'Vacant land: no residential housing is included'}]};
   return question;
  }).filter(question=>(!condo || question.fieldPath !== 'disclosures.hoaDocumentsStatus') && (!land || !['disclosures.leadInspectionSelection','disclosures.leadInspectionDays'].includes(question.fieldPath??'')));
  return {...section,questions:[...extra,...questions]};
 });
}
