import type { IndianaOfferTerms } from '../../../../../core/domains/offers/state-contracts/indiana/models/indiana-offer-terms.model';
import type { ListingDisclosureDocument } from '../../../../../core/domains/disclosures/models/listing-disclosure-document.model';
export function pinIndianaReviewedDocumentVersions(current:IndianaOfferTerms,next:IndianaOfferTerms,documents:readonly ListingDisclosureDocument[]):IndianaOfferTerms {
 const versions={...current.documentVersions};
 const mappings:[string,string][]=[['disclosures.statutoryPacketStatus','indiana-statutory-packet'],['disclosures.propertyConditionStatus','indiana-seller-disclosure'],['disclosures.leadPaintStatus','lead-based-paint'],['disclosures.hoaDocumentsStatus','indiana-association-documents']];
 const value=(terms:IndianaOfferTerms,field:string):unknown=>field.split('.').reduce<unknown>((parent,key)=>parent&&typeof parent==='object'?(parent as Record<string,unknown>)[key]:undefined,terms);
 for(const [field,type] of mappings) {
  const status=value(next,field);
  if(status==='received'||status==='exempt') {
   if(value(current,field)!==status || !versions[type]) {
    const document=documents.find(doc=>doc.documentType===type&&doc.listingUid===next.property.listingUid&&doc.stateAbbreviation==='IN');
    if(document?.versionId)versions[type]=document.versionId;else delete versions[type];
   }
  }else delete versions[type];
 }
 return {...next,documentVersions:versions};
}
