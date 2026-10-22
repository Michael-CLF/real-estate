import type { ListingChecklistFacts, ListingChecklistItem } from '../../../../configuration/listing-document-checklist.config';
import type { StateDisclosureRequirement } from '../../../disclosures/models/state-disclosure-requirement.model';
import { isFederalLeadExcluded } from '../../../offers/federal-lead-policy';
import { IOWA_RADON_ASSET, IOWA_RADON_SOURCE } from '../../../offers/state-contracts/iowa/iowa-disclosure-policy';

/** Iowa seller preparation guidance. Required upload IDs remain owned by the offer gate. */
export function getIowaListingDocumentChecklist(requirements:readonly StateDisclosureRequirement[],facts:ListingChecklistFacts):readonly ListingChecklistItem[] {
 const items:ListingChecklistItem[]=[];
 for(const requirement of requirements) {
  if(requirement.documentType==='lead-based-paint' && isFederalLeadExcluded(facts)) continue;
  const links=[...(requirement.formDownloadUrl?[{label:requirement.formDownloadLabel??'Open form',url:requirement.formDownloadUrl}]:[]),...(requirement.officialFormUrl?[{label:'Official source / current form',url:requirement.officialFormUrl}]:[])];
  const base={id:requirement.documentType,title:requirement.title,instructions:requirement.description,links};
  switch(requirement.documentType) {
   case 'iowa-seller-disclosure':
    links.push({label:'Iowa covered transfers and statutory exceptions',url:'https://www.legis.iowa.gov/docs/ico/chapter/558A.pdf'});
    items.push({...base,category:'Required before offers',applicability:facts.iowa?.disclosureExemptionClaimed===true?'Seller reports a Chapter 558A transfer exception. Upload signed evidence identifying its actual statutory basis.':'Covered sales of Iowa homes with one to four dwelling units require the completed signed condition disclosure. Statutory transfer exceptions require supported evidence instead.',timing:'Upload the disclosure or supported exception before Make Offer opens. This earlier upload is NavStreet policy; the legal deadline is before the seller makes or accepts a written offer.',suppliedBy:'Seller'});break;
   case 'iowa-statutory-packet':
    items.push({...base,category:'Supporting records',applicability:'Existing radon tests/results, mitigation information or other relevant property records that the seller knows about or has available.',timing:'Disclose required known facts in the full condition statement before the seller makes or accepts a written offer. Supporting records are not a universally required second upload.',suppliedBy:'Seller, using existing property records'});break;
   case 'iowa-association-documents': {
    const noAssociation=facts.ownersAssociationApplies===false && facts.contractFacts?.isCondominium!==true && facts.propertyType!=='condo';
    items.push({...base,category:noAssociation?'Not applicable':'Supporting records',applicability:noAssociation?'Seller reports no owners association. No association-record upload is required for this reported ownership.':'When an owners association or condominium regime actually applies; zero fees alone do not establish that no association exists.',timing:'Provide applicable records under the governing documents, law or agreed contract deadline. These records do not universally block an Iowa residential offer.',suppliedBy:'Seller or applicable association'});break;
   }
   case 'lead-based-paint':
    items.push({...base,category:'Required when applicable',applicability:'Housing built in 1977 or earlier, unless a supported federal exemption applies. Housing built in 1978 or later does not need this federal packet.',timing:'Upload the applicable federal packet or supported exemption before online offers open; federal delivery is due before the buyer becomes bound.',suppliedBy:'Seller'});break;
  }
 }
 items.push({id:'iowa-automatic-radon-fact-sheet',title:'Official Iowa Radon Home-Buyers and Sellers Fact Sheet',category:'Provided automatically',applicability:'NavStreet supplies the official fact sheet in the supported Iowa residential offer flow, including homes built in 1978 or later. This is separate from federal lead paint.',timing:'The buyer reviews and acknowledges actual receipt before submitting. A copy is appended to the newly revised agreement PDF.',instructions:'Do not upload a duplicate pamphlet or order a new radon test just to open offers. Known radon test dates/results still belong in the full seller disclosure.',suppliedBy:'Provided automatically by NavStreet from Iowa HHS',links:[{label:'Read the supplied official fact sheet',url:IOWA_RADON_ASSET},{label:'Iowa HHS source',url:IOWA_RADON_SOURCE}]});
 if(facts.iowa?.privateSewageApplies!==false) items.push({id:'iowa-private-sewage-transfer-information',title:'Private sewage time-of-transfer records',category:'Required when applicable',applicability:'Property served by a private sewage disposal system; statutory exceptions or a qualifying binding agreement may apply.',timing:'Follow Iowa time-of-transfer inspection and recording requirements before transfer. This is not a universal pre-offer upload.',instructions:'If the property uses a private sewage system, arrange the applicable certified inspection or supported exception/agreement. A public sewer answer does not require these records.',suppliedBy:'Seller and qualified inspection provider',links:[{label:'Iowa DNR time-of-transfer information',url:'https://www.iowadnr.gov/environmental-protection/water-quality/private-sewage-disposal-and-septage/time-transfer'}]});
 return items;
}
