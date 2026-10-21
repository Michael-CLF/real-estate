import type { ArizonaOfferTerms } from '../../../../../core/domains/offers/state-contracts/arizona/models/arizona-offer-terms.model';
import type { ListingDisclosureDocument } from '../../../../../core/domains/disclosures/models/listing-disclosure-document.model';
export function pinArizonaReviewedDocumentVersions(current:ArizonaOfferTerms,next:ArizonaOfferTerms,documents:readonly ListingDisclosureDocument[]):ArizonaOfferTerms {
 // Preserve existing pre-feature residential drafts rather than invent receipt evidence.
 if(current.documentVersions===undefined)return next;
 const versions={...current.documentVersions};
 const mappings:[string,string][]=[['disclosures.statutoryPacketStatus','arizona-statutory-packet'],['disclosures.propertyConditionStatus','arizona-seller-disclosure'],['disclosures.leadPaintStatus','lead-based-paint'],['disclosures.hoaDocumentsStatus','arizona-association-documents']];
 const value=(terms:ArizonaOfferTerms,field:string):unknown=>field.split('.').reduce<unknown>((parent,key)=>parent&&typeof parent==='object'?(parent as Record<string,unknown>)[key]:undefined,terms);
 for(const [field,type] of mappings) {
  const status=value(next,field);
  if(status==='received'||status==='exempt') {
   if(value(current,field)!==status || !versions[type]) {
    const document=documents.find(doc=>doc.documentType===type&&doc.listingUid===next.property.listingUid&&doc.stateAbbreviation==='AZ');
    if(document?.versionId)versions[type]=document.versionId;else delete versions[type];
   }
  }else delete versions[type];
 }
 return {...next,documentVersions:versions};
}
