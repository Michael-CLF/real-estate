import { isMontanaCondominiumListing } from './montana-condominium-applicability';
import type { ListingChecklistFacts, ListingChecklistItem } from '../../../../configuration/listing-document-checklist.config';
export function applyMontanaChecklist(items: readonly ListingChecklistItem[], facts: ListingChecklistFacts): readonly ListingChecklistItem[] {
 if (!isMontanaCondominiumListing(facts)) return items;
 return items.map(item => item.id !== 'montana-association-documents' ? item : {...item,
  category:'Required before offers', applicability:'Required for condominium ownership, including a house or townhome held as a condominium.',
  timing:'Upload the complete packet before online offers can start. This earlier upload gate is NavStreet policy; the buyer still acknowledges actual receipt and retains the statutory review period.',
  instructions:'Upload the Unit Ownership Act, bylaws and administrative regulations, plus the MCA 70-23-613 majority-control notice whenever any person or entity constitutes a majority of the units. The buyer reviews this exact upload version. No buyer-supplied project names, unit designations or common-interest percentages are required. Helpful balances and assessment records are separate from required governing documents.',
  suppliedBy:'Seller, using official law and association governing records'});
}
