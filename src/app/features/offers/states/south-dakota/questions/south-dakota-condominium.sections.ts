import type {SouthDakotaOfferTerms} from '../../../../../core/domains/offers/state-contracts/south-dakota/models/south-dakota-offer-terms.model';
import type {OfferSectionDefinition} from '../../../engine/models/offer-section-definition';
import type {OfferQuestionDefinition} from '../../../engine/models/offer-question-definition';
export function getSouthDakotaCondominiumSections(terms:SouthDakotaOfferTerms,sections:readonly OfferSectionDefinition[]):readonly OfferSectionDefinition[] {
 return sections.map(section => {
  if (section.id !== 'disclosures') return section;
  const questions: OfferQuestionDefinition[] = [...section.questions];
  
  if (terms.contractType !== 'navstreet_south_dakota_condominium_resale_2026') return {...section,questions};
  return {...section,questions:[{id:'condominium-information',type:'information',label:'Condominium resale documents and buyer protections',helpText:"Required before the written offer for condominium association property: association notice, governing documents, assessment amount, frequency and purpose, and the most recent three years of special one-time assessments. Include the project final or substitute Commission report and any supplements for review. Developer offerings and their separate ten-day report-review process are excluded."},...questions.map(q => q.fieldPath === 'disclosures.sellerReportsHoa' ? {...q,label:'Condominium association ownership applies',helpText:'Condominium ownership determines applicability even when dues are zero or the listing reports no separate HOA.'} : q.fieldPath === 'disclosures.hoaDocumentsStatus' ? {...q,label:'Condominium resale packet',helpText:"Required before the written offer for condominium association property: association notice, governing documents, assessment amount, frequency and purpose, and the most recent three years of special one-time assessments. Include the project final or substitute Commission report and any supplements for review. Developer offerings and their separate ten-day report-review process are excluded.",options:[{value:'received',label:'Actually received and reviewed the uploaded version'},{value:'pending',label:'Not yet received or reviewed'}]} : q)]};
 });
}
