import type {WyomingOfferTerms} from '../../../../../core/domains/offers/state-contracts/wyoming/models/wyoming-offer-terms.model';
import type {OfferSectionDefinition} from '../../../engine/models/offer-section-definition';
import type {OfferQuestionDefinition} from '../../../engine/models/offer-question-definition';
export function getWyomingCondominiumSections(terms:WyomingOfferTerms,sections:readonly OfferSectionDefinition[]):readonly OfferSectionDefinition[] {
 return sections.map(section => {
  if (section.id !== 'disclosures') return section;
  const questions: OfferQuestionDefinition[] = [...section.questions];
  
  if (terms.contractType !== 'navstreet_wyoming_condominium_resale_2026') return {...section,questions};
  return {...section,questions:[{id:'condominium-information',type:'information',label:'Condominium resale documents and buyer protections',helpText:"This resale transfers the recorded unit and appurtenant common-element interests, subject to the declaration, bylaws and recorded restrictions. Review assessments, insurance, reserves, restrictions, parking and storage rights. These records are recommended and do not create a universal statutory pre-offer upload or cancellation period."},...questions.map(q => q.fieldPath === 'disclosures.sellerReportsHoa' ? {...q,label:'Condominium association ownership applies',helpText:'Condominium ownership determines applicability even when dues are zero or the listing reports no separate HOA.'} : q.fieldPath === 'disclosures.hoaDocumentsStatus' ? {...q,label:'Condominium resale packet',helpText:"This resale transfers the recorded unit and appurtenant common-element interests, subject to the declaration, bylaws and recorded restrictions. Review assessments, insurance, reserves, restrictions, parking and storage rights. These records are recommended and do not create a universal statutory pre-offer upload or cancellation period.",options:[{value:'received',label:'Actually received and reviewed the uploaded version'},{value:'pending',label:'Not yet received or reviewed'}]} : q)]};
 });
}
