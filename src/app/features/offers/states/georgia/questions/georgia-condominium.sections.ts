import { SECTION_LEGAL_CONTENT_20261025_V1 } from '../legal-content/offer-section-content.2026-10-25.v1';
import type {GeorgiaOfferTerms} from '../../../../../core/domains/offers/state-contracts/georgia/models/georgia-offer-terms.model';
import type {OfferSectionDefinition} from '../../../engine/models/offer-section-definition';
import type {OfferQuestionDefinition} from '../../../engine/models/offer-question-definition';
export function getGeorgiaCondominiumSections(terms:GeorgiaOfferTerms,sections:readonly OfferSectionDefinition[]):readonly OfferSectionDefinition[] {
 return sections.map(section => {
  if (section.id !== 'disclosures') return section;
  const questions: OfferQuestionDefinition[] = [...section.questions];

  if (terms.contractType !== 'navstreet_georgia_condominium_resale_2026') return {...section,questions};
  return {...section,questions:[{id:'condominium-information',type:'information',label:'Condominium resale documents and buyer protections',helpText:SECTION_LEGAL_CONTENT_20261025_V1["condominium_condominium_information_helpText"]},...questions.map(q => q.fieldPath === 'disclosures.sellerReportsHoa' ? {...q,label:'Condominium association ownership applies',helpText:SECTION_LEGAL_CONTENT_20261025_V1["condominium_helpText"]} : q.fieldPath === 'disclosures.hoaDocumentsStatus' ? {...q,label:'Condominium resale packet',helpText:SECTION_LEGAL_CONTENT_20261025_V1["condominium_condominium_information_helpText"],options:[{value:'received',label:'Actually received and reviewed the uploaded version'},{value:'pending',label:'Not yet received or reviewed'}]} : q)]};
 });
}
