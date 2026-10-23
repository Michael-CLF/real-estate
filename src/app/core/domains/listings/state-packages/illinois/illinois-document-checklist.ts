import type {ListingChecklistFacts,ListingChecklistItem} from '../../../../configuration/listing-document-checklist.config';
import type {StateDisclosureRequirement} from '../../../disclosures/models/state-disclosure-requirement.model';
import {getListingUploadGateDocumentTypes} from '../../../../configuration/listing-disclosure-gates';
import {isFederalLeadExcluded} from '../../../offers/federal-lead-policy';
/** Applicable pre-acceptance radon disclosure is collected before offers by owner policy. */
export function getIllinoisListingDocumentChecklist(requirements:readonly StateDisclosureRequirement[],facts:ListingChecklistFacts):readonly ListingChecklistItem[] {
 const required=new Set(getListingUploadGateDocumentTypes('IL',facts,Date.now()));
 return requirements.filter(r=>r.documentType!=='lead-based-paint'||!isFederalLeadExcluded(facts)).map(r=>({
 id:r.documentType,title:r.title,category:required.has(r.documentType)?'Required before offers':((r.documentType==='illinois-statutory-packet'&&facts.illinois?.radonExemptionClaimed===true)||(r.documentType==='illinois-seller-disclosure'&&facts.illinois?.disclosureExemptionClaimed===true))?'Not applicable':r.documentType.endsWith('association-documents')||r.documentType==='illinois-statutory-packet'?'Required when applicable':'Supporting records',
 applicability:r.description,timing:required.has(r.documentType)?'Upload before Make Offer opens. Buyer receipt must be recorded separately.':r.documentType.endsWith('association-documents')?'Follow the state-specific delivery and review timing above; no universal initial-offer upload gate.':r.documentType==='illinois-statutory-packet'?'When radon law applies, deliver before acceptance and allow buyer review. NavStreet supplies the approved IEMA pamphlet automatically.':'Provide existing applicable records without an unnecessary offer block.',instructions:r.sourceInstructions??r.description,suppliedBy:'Seller, assessor or association as applicable',
 links:[...(r.officialFormUrl?[{label:'Official requirements / source',url:r.officialFormUrl}]:[]),...(r.formDownloadUrl?[{label:r.formDownloadLabel??'Open form',url:r.formDownloadUrl}]:[])]
 }));
}
