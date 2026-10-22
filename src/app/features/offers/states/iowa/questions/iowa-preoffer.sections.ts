import type { IowaOfferTerms } from '../../../../../core/domains/offers/state-contracts/iowa/models/iowa-offer-terms.model';
import type { OfferSectionDefinition } from '../../../engine/models/offer-section-definition';
export function getIowaPreofferSections(terms:IowaOfferTerms, sections:readonly OfferSectionDefinition[]):readonly OfferSectionDefinition[] {
 if (!terms.disclosurePolicyRevision) return sections;
 return sections.map(section => ({...section,questions:section.questions.map(question => {
  if (question.fieldPath === 'disclosures.propertyConditionStatus') return {...question, options:terms.disclosures.disclosureExemptionClaimed ? [{value:'exempt',label:'I received and reviewed the uploaded signed statutory exception evidence'}] : [{value:'received',label:'I received and reviewed the uploaded seller condition disclosure'}], helpText:'This written acknowledgement records actual electronic delivery of the exact uploaded version. It is not a waiver, acceptance of the property condition, or a certification of the seller statements. Required initiating buyer signatures deliver this acknowledgement to the seller with the offer.'};
  if (question.fieldPath === 'disclosures.statutoryPacketStatus') return {...question,type:'information' as const,fieldPath:undefined,validation:undefined,label:'Additional property records',helpText:'Known radon testing dates/results belong in the seller disclosure. Available supporting records are shown with the uploaded documents. Septic inspections and groundwater recording requirements retain their separate deadlines.'};
  if (question.fieldPath === 'disclosures.radonNoticeAcknowledged') return {...question,label:'I acknowledge receiving and reviewing the Iowa Radon Home-Buyers and Sellers Fact Sheet supplied with this offer.',helpText:'Open the official fact sheet above. The exact version is recorded and a copy is included in the agreement PDF. This acknowledgement does not require a new radon test and does not waive inspection or disclosure rights.'};
  return question;
 })}));
}
