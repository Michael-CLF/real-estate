import type { MinnesotaOfferTerms } from '../../../../../core/domains/offers/state-contracts/minnesota/models/minnesota-offer-terms.model';
import type { ListingDisclosureDocument } from '../../../../../core/domains/disclosures/models/listing-disclosure-document.model';
export function pinMinnesotaReviewedDocumentVersions(current:MinnesotaOfferTerms,next:MinnesotaOfferTerms,documents:readonly ListingDisclosureDocument[]):MinnesotaOfferTerms {
 // Preserve existing pre-feature residential drafts rather than invent receipt evidence.
 if(current.documentVersions===undefined)return next;
 const versions={...current.documentVersions};
 const mappings:[string,string][]=[['disclosures.statutoryPacketStatus','minnesota-statutory-packet'],['disclosures.propertyConditionStatus','minnesota-seller-disclosure'],['disclosures.leadPaintStatus','lead-based-paint'],['disclosures.hoaDocumentsStatus','minnesota-association-documents']];
 const value=(terms:MinnesotaOfferTerms,field:string):unknown=>field.split('.').reduce<unknown>((parent,key)=>parent&&typeof parent==='object'?(parent as Record<string,unknown>)[key]:undefined,terms);
 for(const [field,type] of mappings) {
  const status=value(next,field);
  if(status==='received'||status==='exempt') {
   if(value(current,field)!==status || !versions[type]) {
    const document=documents.find(doc=>doc.documentType===type&&doc.listingUid===next.property.listingUid&&doc.stateAbbreviation==='MN');
    if(document?.versionId)versions[type]=document.versionId;else delete versions[type];
   }
  }else delete versions[type];
 }
 return {...next,documentVersions:versions};
}
