import { SECTION_LEGAL_CONTENT_20261025_V1 } from '../legal-content/offer-section-content.2026-10-25.v1';
import type { IowaOfferTerms } from '../../../../../core/domains/offers/state-contracts/iowa/models/iowa-offer-terms.model';
import type { OfferSectionDefinition } from '../../../engine/models/offer-section-definition';
export function getIowaPreofferSections(terms:IowaOfferTerms, sections:readonly OfferSectionDefinition[]):readonly OfferSectionDefinition[] {
 if (!terms.disclosurePolicyRevision) return sections;
 return sections.map(section => ({...section,questions:section.questions.map(question => {
  if (question.fieldPath === 'disclosures.propertyConditionStatus') return {...question, options:terms.disclosures.disclosureExemptionClaimed ? [{value:'exempt',label:'I received and reviewed the uploaded signed statutory exception evidence'}] : [{value:'received',label:'I received and reviewed the uploaded seller condition disclosure'}], helpText:SECTION_LEGAL_CONTENT_20261025_V1["preoffer_helpText"]};
  if (question.fieldPath === 'disclosures.statutoryPacketStatus') return {...question,type:'information' as const,fieldPath:undefined,validation:undefined,label:'Additional property records',helpText:SECTION_LEGAL_CONTENT_20261025_V1["preoffer_helpText_2"]};
  if (question.fieldPath === 'disclosures.radonNoticeAcknowledged') return {...question,label:SECTION_LEGAL_CONTENT_20261025_V1["preoffer_label"],helpText:SECTION_LEGAL_CONTENT_20261025_V1["preoffer_helpText_3"]};
  return question;
 })}));
}
