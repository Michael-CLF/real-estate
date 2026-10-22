import type {MarylandOfferTerms} from '../../../../../core/domains/offers/state-contracts/maryland/models/maryland-offer-terms.model';
import type {OfferSectionDefinition} from '../../../engine/models/offer-section-definition';
import type {OfferQuestionDefinition} from '../../../engine/models/offer-question-definition';
export function getMarylandCondominiumSections(terms:MarylandOfferTerms,sections:readonly OfferSectionDefinition[]):readonly OfferSectionDefinition[] {
 return sections.map(section => {
  if (section.id !== 'disclosures') return section;
  const questions: OfferQuestionDefinition[] = [...section.questions];
  
  if (terms.contractType !== 'navstreet_maryland_condominium_resale_2026') return {...section,questions};
  return {...section,questions:[{id:'condominium-information',type:'information',label:'Condominium resale documents and buyer protections',helpText:"The seller must furnish the applicable resale documents at least 15 days before closing under Real Property 11-135. The buyer retains the nonwaivable seven-day cancellation right after all required information is received, ending at closing. A packet still pending does not by itself block this initial offer."},...questions.map(q => q.fieldPath === 'disclosures.sellerReportsHoa' ? {...q,label:'Condominium association ownership applies',helpText:'Condominium ownership determines applicability even when dues are zero or the listing reports no separate HOA.'} : q.fieldPath === 'disclosures.hoaDocumentsStatus' ? {...q,label:'Condominium resale packet',helpText:"The seller must furnish the applicable resale documents at least 15 days before closing under Real Property 11-135. The buyer retains the nonwaivable seven-day cancellation right after all required information is received, ending at closing. A packet still pending does not by itself block this initial offer.",options:[{value:'received',label:'Actually received and reviewed the uploaded version'},{value:'pending',label:'Not yet received or reviewed'}]} : q)]};
 });
}
