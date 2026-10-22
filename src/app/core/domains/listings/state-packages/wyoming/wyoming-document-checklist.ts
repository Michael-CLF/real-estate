import type {ListingChecklistFacts,ListingChecklistItem} from '../../../../configuration/listing-document-checklist.config';
import type {StateDisclosureRequirement} from '../../../disclosures/models/state-disclosure-requirement.model';
import {getListingUploadGateDocumentTypes} from '../../../../configuration/listing-disclosure-gates';
import {isFederalLeadExcluded} from '../../../offers/federal-lead-policy';
/** Seller guidance owned by Wyoming; later-delivery records never become initial-offer gates. */
export function getWyomingListingDocumentChecklist(requirements:readonly StateDisclosureRequirement[],facts:ListingChecklistFacts):readonly ListingChecklistItem[] {
 const required=new Set(getListingUploadGateDocumentTypes('WY',facts,Date.now()));
 return requirements.filter(r=>r.documentType!=='lead-based-paint'||!isFederalLeadExcluded(facts)).map(r=>({
 id:r.documentType,title:r.title,category:required.has(r.documentType)?'Required before offers':r.documentType.endsWith('association-documents')?'Required when applicable':'Supporting records',
 applicability:r.description,timing:required.has(r.documentType)?'Upload before Make Offer opens. Buyer receipt must be recorded separately.':r.documentType.endsWith('association-documents')?'Follow the state-specific delivery and review timing above; no universal initial-offer upload gate.':'Provide existing applicable records without an unnecessary offer block.',instructions:r.sourceInstructions??r.description,suppliedBy:'Seller, assessor or association as applicable',
 links:[...(r.officialFormUrl?[{label:'Official requirements / source',url:r.officialFormUrl}]:[]),...(r.formDownloadUrl?[{label:r.formDownloadLabel??'Open form',url:r.formDownloadUrl}]:[])]
 }));
}
