import { SECTION_LEGAL_CONTENT_20261025_V1 } from '../legal-content/offer-section-content.2026-10-25.v1';
import type {MinnesotaOfferTerms} from '../../../../../core/domains/offers/state-contracts/minnesota/models/minnesota-offer-terms.model';
import type {OfferSectionDefinition} from '../../../engine/models/offer-section-definition';
import type {OfferQuestionDefinition} from '../../../engine/models/offer-question-definition';
export function getMinnesotaCondominiumSections(terms:MinnesotaOfferTerms,sections:readonly OfferSectionDefinition[]):readonly OfferSectionDefinition[] {
 if(terms.contractType!=='navstreet_minnesota_condominium_resale_2026')return sections;
 const extra:OfferQuestionDefinition[]=[];
 extra.push({id:'condominium-rights',type:'acknowledgement',label:'I understand the condominium disclosure and review protections.',fieldPath:'condominium.rightsAcknowledged',helpText:SECTION_LEGAL_CONTENT_20261025_V1["condominium_condominium_rights_helpText"],validation:{required:true,message:'Acknowledge these condominium protections.'}});
 return sections.map(section=>section.id==='disclosures'?{...section,questions:[...extra,...section.questions.map(question=>question.fieldPath==='disclosures.hoaDocumentsStatus'?{...question,label:'Complete condominium resale packet',options:[{value:'received',label:'Actually received and reviewed'}],helpText:SECTION_LEGAL_CONTENT_20261025_V1["condominium_helpText"]}:question)]}:section);
}
