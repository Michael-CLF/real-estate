import type {
  TexasAddendumSelectionDocument,
  TexasOfferTermsDocument,
} from './texas-offer-terms.document';


export interface TexasContractDocumentPlan {
  contract: TexasContractDocumentReference;

  selectedAddenda:
    TexasSelectedAddendumDocument[];

  supportingDocuments:
    TexasSupportingDocumentReference[];

  requiredAddendumFormIds:
    string[];

  missingRequiredAddendumFormIds:
    string[];
}


export interface TexasContractDocumentReference {
  kind: 'contract';

  formId: string;
  title: string;

  effectiveDate: string;
  revisionDate: string;
}


export interface TexasSelectedAddendumDocument {
  kind: 'addendum';

  formId: string;
  title: string;

  documentUid?: string;
}


export interface TexasSupportingDocumentReference {
  kind: 'supporting_document';

  source: TexasSupportingDocumentSource;
  title: string;
  documentUid: string;
}


export type TexasSupportingDocumentSource =
  | 'legal_description_exhibit'
  | 'reservation_addendum'
  | 'residential_lease_addendum'
  | 'fixture_lease_addendum'
  | 'association_addendum'
  | 'property_condition_disclosure'
  | 'water_rights_disclosure'
  | 'lead_based_paint_addendum'
  | 'temporary_residential_lease'
  | 'resale_certificate'
  | 'plans_and_specifications'
  | 'buyer_selection_documents'
  | 'builder_warranty'
  | 'third_party_warranty';


export function createTexasContractDocumentPlan(
  terms: TexasOfferTermsDocument
): TexasContractDocumentPlan {
  const requiredAddendumFormIds =
    resolveRequiredAddendumFormIds(terms);

  const selectedAddenda = terms.addenda
    .filter(addendum => addendum.included)
    .map(toSelectedAddendum);

  const selectedAddendumFormIds =
    new Set(
      selectedAddenda.map(
        addendum => addendum.formId
      )
    );

  return {
    contract: {
      kind: 'contract',
      formId: terms.form.formId,
      title: terms.form.formName,
      effectiveDate: terms.form.effectiveDate,
      revisionDate: terms.form.revisionDate,
    },

    selectedAddenda,

    supportingDocuments:
      resolveSupportingDocuments(terms),

    requiredAddendumFormIds,

    missingRequiredAddendumFormIds:
      requiredAddendumFormIds.filter(
        formId =>
          !selectedAddendumFormIds.has(formId)
      ),
  };
}


function resolveRequiredAddendumFormIds(
  terms: TexasOfferTermsDocument
): string[] {
  const formIds = new Set<string>();

  for (
    const financingAddendum of
    terms.salesPrice.financingAddenda
  ) {
    formIds.add(
      financingAddendumFormId(
        financingAddendum
      )
    );
  }

  if (
    'leases' in terms &&
    terms.leases.residentialLeasesExist
  ) {
    formIds.add('residential-leases');
  }

  if (
    'leases' in terms &&
    terms.leases.fixtureLeasesExist
  ) {
    formIds.add('fixture-leases');
  }

  if (
    'propertyAssociation' in terms &&
    terms.propertyAssociation.mandatoryMembership
  ) {
    formIds.add('mandatory-poa-membership');
  }

  if (
    'disclosures' in terms &&
    terms.disclosures.leadBasedPaintApplies
  ) {
    formIds.add('lead-based-paint');
  }

  if (
    'propertyTerms' in terms &&
    terms.propertyTerms
      .mineralWaterTimberReservationApplies
  ) {
    formIds.add('mineral-reservation');
  }

  if (
    terms.contractType === 'farm_and_ranch' &&
    terms.farmAndRanchProperty.reservationsApply
  ) {
    formIds.add('mineral-reservation');
  }

  if (
    terms.contractType === 'unimproved_property' &&
    terms.unimprovedProperty.reservationsApply
  ) {
    formIds.add('mineral-reservation');
  }

  return Array.from(formIds);
}


function financingAddendumFormId(
  financingAddendum:
    TexasOfferTermsDocument[
      'salesPrice'
    ][
      'financingAddenda'
    ][number]
): string {
  switch (financingAddendum) {
    case 'third_party_financing':
      return 'third-party-financing';

    case 'loan_assumption':
      return 'loan-assumption';

    case 'seller_financing':
      return 'seller-financing';
  }
}


function toSelectedAddendum(
  addendum: TexasAddendumSelectionDocument
): TexasSelectedAddendumDocument {
  return {
    kind: 'addendum',
    formId: addendum.formId,
    title: addendum.title,
    ...(
      addendum.documentUid
        ? {
          documentUid: addendum.documentUid,
        }
        : {}
    ),
  };
}


function resolveSupportingDocuments(
  terms: TexasOfferTermsDocument
): TexasSupportingDocumentReference[] {
  const documents:
    TexasSupportingDocumentReference[] = [];

  if ('propertyIdentification' in terms) {
    addSupportingDocument(
      documents,
      'legal_description_exhibit',
      'Legal description exhibit',
      terms.propertyIdentification
        .legalDescriptionExhibitDocumentUid
    );
  }

  if ('propertyTerms' in terms) {
    addSupportingDocument(
      documents,
      'reservation_addendum',
      'Reservation addendum',
      terms.propertyTerms
        .reservationAddendumDocumentUid
    );
  }

  if ('leases' in terms) {
    addSupportingDocument(
      documents,
      'residential_lease_addendum',
      'Residential leases addendum',
      terms.leases
        .residentialLeasesAddendumDocumentUid
    );

    addSupportingDocument(
      documents,
      'fixture_lease_addendum',
      'Fixture leases addendum',
      terms.leases
        .fixtureLeasesAddendumDocumentUid
    );
  }

  if ('propertyAssociation' in terms) {
    addSupportingDocument(
      documents,
      'association_addendum',
      'Property owners association addendum',
      terms.propertyAssociation
        .associationAddendumDocumentUid
    );
  }

  if ('disclosures' in terms) {
    addSupportingDocument(
      documents,
      'property_condition_disclosure',
      'Seller property-condition disclosure',
      terms.disclosures
        .propertyCondition.documentUid
    );

    addSupportingDocument(
      documents,
      'water_rights_disclosure',
      'Seller water-rights disclosure',
      terms.disclosures.waterRights.documentUid
    );

    addSupportingDocument(
      documents,
      'lead_based_paint_addendum',
      'Lead-based-paint addendum',
      terms.disclosures
        .leadBasedPaintAddendumDocumentUid
    );
  }

  addSupportingDocument(
    documents,
    'temporary_residential_lease',
    'Temporary residential lease',
    terms.closingAndPossession
      .temporaryResidentialLeaseDocumentUid
  );

  if (terms.contractType === 'condominium_resale') {
    addSupportingDocument(
      documents,
      'resale_certificate',
      'Condominium resale certificate',
      terms.condominiumProperty
        .resaleCertificateDocumentUid
    );
  }

  if (
    terms.contractType === 'new_home_completed' ||
    terms.contractType === 'new_home_incomplete'
  ) {
    addSupportingDocument(
      documents,
      'plans_and_specifications',
      'Plans and specifications',
      terms.construction
        .plansAndSpecificationsDocumentUid
    );

    addSupportingDocument(
      documents,
      'buyer_selection_documents',
      'Buyer selection documents',
      terms.construction
        .buyerSelectionDocumentsUid
    );

    addSupportingDocument(
      documents,
      'builder_warranty',
      'Builder warranty',
      terms.construction.builderWarrantyDocumentUid
    );

    addSupportingDocument(
      documents,
      'third_party_warranty',
      'Third-party warranty',
      terms.construction
        .thirdPartyWarrantyDocumentUid
    );
  }

  if (terms.contractType === 'farm_and_ranch') {
    addSupportingDocument(
      documents,
      'reservation_addendum',
      'Farm and ranch reservation addendum',
      terms.farmAndRanchProperty
        .reservationAddendumDocumentUid
    );
  }

  if (terms.contractType === 'unimproved_property') {
    addSupportingDocument(
      documents,
      'legal_description_exhibit',
      'Unimproved-property legal description exhibit',
      terms.unimprovedProperty
        .legalDescriptionExhibitDocumentUid
    );

    addSupportingDocument(
      documents,
      'reservation_addendum',
      'Unimproved-property reservation addendum',
      terms.unimprovedProperty
        .reservationAddendumDocumentUid
    );
  }

  return removeDuplicateDocuments(documents);
}


function addSupportingDocument(
  documents: TexasSupportingDocumentReference[],
  source: TexasSupportingDocumentSource,
  title: string,
  documentUid: string | undefined
): void {
  if (!documentUid) {
    return;
  }

  documents.push({
    kind: 'supporting_document',
    source,
    title,
    documentUid,
  });
}


function removeDuplicateDocuments(
  documents: TexasSupportingDocumentReference[]
): TexasSupportingDocumentReference[] {
  const documentUids = new Set<string>();

  return documents.filter(document => {
    if (documentUids.has(document.documentUid)) {
      return false;
    }

    documentUids.add(document.documentUid);
    return true;
  });
}
