import type { MissouriOfferTerms } from '../../../../../core/domains/offers/state-contracts/missouri/models/missouri-offer-terms.model';
import type { ListingDisclosureDocument } from '../../../../../core/domains/disclosures/models/listing-disclosure-document.model';
export function pinMissouriReviewedDocumentVersions(current:MissouriOfferTerms,next:MissouriOfferTerms,documents:readonly ListingDisclosureDocument[]):MissouriOfferTerms {
 // Preserve existing pre-feature residential drafts rather than invent receipt evidence.
 if(current.documentVersions===undefined)return next;
 const versions={...current.documentVersions};
 const mappings:[string,string][]=[['disclosures.statutoryPacketStatus','missouri-statutory-packet'],['disclosures.propertyConditionStatus','missouri-seller-disclosure'],['disclosures.leadPaintStatus','lead-based-paint'],['specialProperty.resaleCertificateStatus','missouri-condominium-resale-certificate'],['specialProperty.tenantDocumentsStatus','missouri-tenant-records']];
 if(next.contractType!=='navstreet_missouri_condominium_resale_2026')mappings.push(['disclosures.hoaDocumentsStatus','missouri-association-documents']);
 const value=(terms:MissouriOfferTerms,field:string):unknown=>field.split('.').reduce<unknown>((parent,key)=>parent&&typeof parent==='object'?(parent as Record<string,unknown>)[key]:undefined,terms);
 for(const [field,type] of mappings) {
  const status=value(next,field);
  if(status==='received'||status==='exempt') {
   if(value(current,field)!==status || !versions[type]) {
    const document=documents.find(doc=>doc.documentType===type&&doc.listingUid===next.property.listingUid&&doc.stateAbbreviation==='MO');
    if(document?.versionId)versions[type]=document.versionId;else delete versions[type];
   }
  }else delete versions[type];
 }
 return {...next,documentVersions:versions};
}
