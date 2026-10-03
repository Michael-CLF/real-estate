import { validateStateSellerStatements } from './state-listing-packages/state-listing.registry';

export interface PublicationValidationDraft {
  progress?: {
    contentStatus?: string;
  };

  publication?: {
    identityStatus?: string;
  };

  certification?: {
    accepted?: boolean;
  };

  address?: {
    addressLine1?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    county?: string;
  };

  propertyDetails?: {
    propertyType?: string;
    bedrooms?: number;
    fullBathrooms?: number;
    halfBathrooms?: number;
    squareFeet?: number;
    legalDescription?: string;
  };

  pricing?: {
    listPrice?: number;
  };

  sellerStatements?: {
    additionalSeller?: {
      legalName?: string;
      email?: string;
      phone?: string;
    };
  };
}

export function validateDraftForPublication(
  draft: PublicationValidationDraft,
  listingUid: string,
): void {
  if (draft.progress?.contentStatus !== 'complete') {
    throw new Error(`Listing draft ${listingUid} is not complete.`);
  }

  if (draft.publication?.identityStatus !== 'verified') {
    throw new Error(
      `Listing draft ${listingUid} has not completed identity verification.`,
    );
  }

  if (draft.certification?.accepted !== true) {
    throw new Error(
      `Listing draft ${listingUid} has not accepted seller certification.`,
    );
  }

  if (
    !draft.address?.addressLine1 ||
    !draft.address.city ||
    !draft.address.state ||
    !draft.address.zipCode ||
    !draft.address.county
  ) {
    throw new Error(`Listing draft ${listingUid} has an incomplete address.`);
  }

  if (
    !draft.propertyDetails?.propertyType ||
    draft.propertyDetails.bedrooms === undefined ||
    draft.propertyDetails.fullBathrooms === undefined ||
    draft.propertyDetails.halfBathrooms === undefined ||
    draft.propertyDetails.squareFeet === undefined
  ) {
    throw new Error(
      `Listing draft ${listingUid} has incomplete property details.`,
    );
  }

  if (draft.pricing?.listPrice === undefined) {
    throw new Error(`Listing draft ${listingUid} has no listing price.`);
  }

  const sellerStatements = draft.sellerStatements;

  if (!sellerStatements) {
    throw new Error(
      `Listing draft ${listingUid} has no seller statements.`,
    );
  }

  validateStateSellerStatements(
    listingUid,
    draft.address.state,
    sellerStatements as unknown as Record<string, unknown>,
  );

  const additionalSeller = sellerStatements.additionalSeller;

  if (
    additionalSeller &&
    (
      !additionalSeller.legalName?.trim() ||
      !additionalSeller.email?.trim() ||
      !additionalSeller.phone?.trim()
    )
  ) {
    throw new Error(
      `Listing draft ${listingUid} has incomplete co-seller information.`,
    );
  }
}