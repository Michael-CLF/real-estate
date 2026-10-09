import type { OfferAttachmentType } from '../../../core/domains/offers/services/offer-document.service';

const COMMON_ATTACHMENT_TYPES: Readonly<Record<string, OfferAttachmentType>> = {
  "propertyIdentification.legalDescriptionExhibitDocumentUid": "legal_description_exhibit",
  "propertyTerms.reservationAddendumDocumentUid": "reservation_addendum",
  "leases.residentialLeasesAddendumDocumentUid": "residential_lease_addendum",
  "leases.fixtureLeasesAddendumDocumentUid": "fixture_lease_addendum",
  "propertyAssociation.associationAddendumDocumentUid": "association_addendum",
  "disclosures.propertyCondition.documentUid": "property_condition_disclosure",
  "disclosures.leadBasedPaintAddendumDocumentUid": "lead_based_paint_addendum",
  "closingAndPossession.temporaryResidentialLeaseDocumentUid": "temporary_residential_lease",
  "construction.plansAndSpecificationsDocumentUid": "plans_and_specifications",
  "construction.buyerSelectionDocumentsUid": "buyer_selection_documents",
  "construction.builderWarrantyDocumentUid": "builder_warranty",
  "construction.thirdPartyWarrantyDocumentUid": "third_party_warranty"
};

/** Entries retain their existing optional water-rights field and unsupported-field message. */
export function resolveOfferAttachmentType(
  fieldPath: string,
  unsupportedMessage: string,
  includeWaterRights: boolean,
): OfferAttachmentType {
  if (fieldPath.startsWith('addenda.')) return 'contract_addendum';
  const attachmentTypes: Readonly<Record<string, OfferAttachmentType>> = {
    ...COMMON_ATTACHMENT_TYPES,
    ...(includeWaterRights ? { 'disclosures.waterRights.documentUid': 'water_rights_disclosure' as const } : {}),
  };
  const attachmentType = attachmentTypes[fieldPath];
  if (!attachmentType) throw new Error(unsupportedMessage);
  return attachmentType;
}
