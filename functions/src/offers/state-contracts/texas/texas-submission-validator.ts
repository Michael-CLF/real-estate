import type {
  OfferDocument,
} from '../../offer-types';

import type {
  TexasCondominiumResaleOfferTermsDocument,
  TexasFarmAndRanchOfferTermsDocument,
  TexasNewHomeCompletedOfferTermsDocument,
  TexasNewHomeConstructionTermsDocument,
  TexasNewHomeIncompleteOfferTermsDocument,
  TexasOfferTermsDocument,
  TexasOneToFourFamilyResaleOfferTermsDocument,
  TexasUnimprovedPropertyOfferTermsDocument,
} from './texas-offer-terms.document';

import {
  validateAssociationTerms,
  validateDisclosureTerms,
  validateLeaseTerms,
  validatePropertyIdentification,
  validatePropertyTerms,
  validateSurveyTerms,
  validateTexasSharedSubmission,
} from './validators/texas-shared-submission.validator';

import type {
  TexasOfferVersionDocument,
} from './validators/texas-shared-submission.validator';

import {
  hasText,
  isValidDate,
  parseDate,
  requireCondition,
  requireNonNegativeMoney,
  requirePositiveDays,
  requireText,
  startOfUtcDay,
} from './validators/texas-submission-validation.utils';


export type {
  TexasOfferVersionDocument,
} from './validators/texas-shared-submission.validator';


export interface ValidateTexasSubmissionInput {
  offer: OfferDocument;
  version: TexasOfferVersionDocument;
  now?: Date;
}


export function validateTexasSubmission(
  input: ValidateTexasSubmissionInput
): void {
  const now = input.now ?? new Date();
  const terms = input.version.terms;

  validateTexasSharedSubmission({
    offer: input.offer,
    version: input.version,
    terms,
    now,
  });

  switch (terms.contractType) {
    case 'one_to_four_family_resale':
      validateOneToFourFamilyResale(terms);
      return;

    case 'condominium_resale':
      validateCondominiumResale(terms);
      return;

    case 'new_home_completed':
      validateNewHomeCompleted(terms);
      return;

    case 'new_home_incomplete':
      validateNewHomeIncomplete(terms, now);
      return;

    case 'farm_and_ranch':
      validateFarmAndRanch(terms);
      return;

    case 'unimproved_property':
      validateUnimprovedProperty(terms);
      return;
  }
}


function validateOneToFourFamilyResale(
  terms: TexasOneToFourFamilyResaleOfferTermsDocument
): void {
  validatePropertyIdentification(terms);
  validatePropertyTerms(terms.propertyTerms);
  validateLeaseTerms(terms.leases);
  validateSurveyTerms(terms.survey);
  validateAssociationTerms(terms.propertyAssociation);
  validateDisclosureTerms(terms.disclosures);
  validateAssociationAddendum(terms);
  validateDisclosureAddenda(terms);
}


function validateCondominiumResale(
  terms: TexasCondominiumResaleOfferTermsDocument
): void {
  const condominium = terms.condominiumProperty;

  requireText(condominium.unitNumber, 'Enter the condominium unit number.');
  requireText(
    condominium.condominiumProjectName,
    'Enter the condominium project name.'
  );
  requireCondition(
    condominium.condominiumDocumentsStatus !== 'unselected',
    'Select the condominium-documents status.'
  );

  if (condominium.condominiumDocumentsStatus === 'not_received') {
    requirePositiveDays(
      condominium.condominiumDocumentsDeliveryDays,
      'Enter the condominium-documents delivery period.'
    );
  }

  requireCondition(
    condominium.resaleCertificateStatus !== 'unselected',
    'Select the resale-certificate status.'
  );

  if (condominium.resaleCertificateStatus === 'received') {
    requireText(
      condominium.resaleCertificateDocumentUid,
      'Attach the received resale certificate.'
    );
  }

  if (condominium.resaleCertificateStatus === 'not_received') {
    requirePositiveDays(
      condominium.resaleCertificateDeliveryDays,
      'Enter the resale-certificate delivery period.'
    );
  }

  validatePropertyTerms(terms.propertyTerms);
  validateLeaseTerms(terms.leases);
  validateDisclosureTerms(terms.disclosures);
  validateDisclosureAddenda(terms);
}


function validateNewHomeCompleted(
  terms: TexasNewHomeCompletedOfferTermsDocument
): void {
  validatePropertyIdentification(terms);
  validatePropertyTerms(terms.propertyTerms);
  validateConstructionTerms(terms.construction);
  requireCondition(
    terms.construction.constructionComplete === true,
    'The completed-construction contract must identify construction as complete.'
  );
  validateSurveyTerms(terms.survey);
  validateAssociationTerms(terms.propertyAssociation);
  validateAssociationAddendum(terms);
}


function validateNewHomeIncomplete(
  terms: TexasNewHomeIncompleteOfferTermsDocument,
  now: Date
): void {
  validatePropertyIdentification(terms);
  validatePropertyTerms(terms.propertyTerms);
  validateConstructionTerms(terms.construction);
  requireCondition(
    terms.construction.constructionComplete === false,
    'The incomplete-construction contract must identify construction as incomplete.'
  );
  requireCondition(
    typeof terms.construction.anticipatedCompletionDate === 'string' &&
      isValidDate(terms.construction.anticipatedCompletionDate),
    'Enter a valid anticipated construction-completion date.'
  );

  const completion = parseDate(
    terms.construction.anticipatedCompletionDate
  );

  requireCondition(
    completion !== null &&
      completion.getTime() >= startOfUtcDay(now).getTime(),
    'The anticipated construction-completion date cannot be in the past.'
  );

  validateSurveyTerms(terms.survey);
  validateAssociationTerms(terms.propertyAssociation);
  validateAssociationAddendum(terms);
}


function validateConstructionTerms(
  construction: TexasNewHomeConstructionTermsDocument
): void {
  requireCondition(
    construction.plansAndSpecificationsStatus !== 'unselected',
    'Select the plans-and-specifications status.'
  );

  if (construction.plansAndSpecificationsStatus === 'received') {
    requireText(
      construction.plansAndSpecificationsDocumentUid,
      'Attach the received plans and specifications.'
    );
  }

  if (construction.plansAndSpecificationsStatus === 'not_received') {
    requirePositiveDays(
      construction.constructionDocumentsDeliveryDays,
      'Enter the construction-documents delivery period.'
    );
  }

  requireCondition(
    construction.buyerSelectionDocumentsStatus !== 'unselected',
    'Select the buyer-selection-documents status.'
  );

  if (construction.buyerSelectionDocumentsStatus === 'received') {
    requireText(
      construction.buyerSelectionDocumentsUid,
      'Attach the received buyer-selection documents.'
    );
  }

  if (construction.buyerSelectionDocumentsStatus === 'not_received') {
    requirePositiveDays(
      construction.buyerSelectionDeadlineDays,
      'Enter the buyer-selection deadline.'
    );
  }

  requireCondition(
    construction.certificateOfOccupancyRequired !== null,
    'Select whether a certificate of occupancy is required.'
  );
}


function validateFarmAndRanch(
  terms: TexasFarmAndRanchOfferTermsDocument
): void {
  const farm = terms.farmAndRanchProperty;

  requireText(farm.landDescription, 'Enter the farm or ranch land description.');

  if (farm.approximateAcreage !== undefined) {
    requireCondition(
      Number.isFinite(farm.approximateAcreage) &&
        farm.approximateAcreage > 0,
      'The approximate acreage must be greater than zero.'
    );
  }

  requireCondition(
    farm.reservationsApply !== null,
    'Select whether a farm or ranch reservation applies.'
  );
  if (farm.reservationsApply) {
    requireText(
      farm.reservationAddendumDocumentUid,
      'Attach the applicable reservation addendum.'
    );
  }

  requireCondition(
    farm.existingAgriculturalLeasesExist !== null,
    'Select whether agricultural leases exist.'
  );
  if (farm.existingAgriculturalLeasesExist) {
    requireCondition(
      farm.agriculturalLeaseDocumentsDelivered !== null,
      'Select whether the agricultural lease documents were delivered.'
    );
  }

  requireCondition(
    farm.rollbackTaxesExpensePayer !== 'unselected',
    'Select who pays any rollback taxes.'
  );

  validateLeaseTerms(terms.leases);
  validateSurveyTerms(terms.survey);
  validateDisclosureTerms(terms.disclosures);
  validateDisclosureAddenda(terms);
}


function validateUnimprovedProperty(
  terms: TexasUnimprovedPropertyOfferTermsDocument
): void {
  const property = terms.unimprovedProperty;

  const hasLotAndAddition =
    hasText(property.lot) && hasText(property.addition);
  const hasOtherLegalDescription =
    hasText(property.metesAndBoundsDescription) ||
    hasText(property.legalDescriptionExhibitDocumentUid) ||
    hasText(terms.property.legalDescription);

  requireCondition(
    hasLotAndAddition || hasOtherLegalDescription,
    'Enter the lot and addition or provide a complete legal description.'
  );
  requireCondition(
    property.reservationsApply !== null,
    'Select whether a reservation applies.'
  );
  if (property.reservationsApply) {
    requireText(
      property.reservationAddendumDocumentUid,
      'Attach the applicable reservation addendum.'
    );
  }

  if (property.feasibilityFeeInCents !== undefined) {
    requireNonNegativeMoney(
      property.feasibilityFeeInCents,
      'The feasibility fee cannot be negative.'
    );
    if (property.feasibilityFeeInCents > 0) {
      requirePositiveDays(
        property.feasibilityPeriodDays,
        'Enter the feasibility period.'
      );
    }
  }

  requireCondition(
    property.utilitiesAvailable !== null,
    'Select whether utilities are available.'
  );
  if (property.utilitiesAvailable === false) {
    requireText(
      property.utilityInformation,
      'Enter the available information concerning utilities.'
    );
  }

  validateSurveyTerms(terms.survey);
  validateAssociationTerms(terms.propertyAssociation);
  validateAssociationAddendum(terms);
}


function validateAssociationAddendum(
  terms:
    | TexasOneToFourFamilyResaleOfferTermsDocument
    | TexasNewHomeCompletedOfferTermsDocument
    | TexasNewHomeIncompleteOfferTermsDocument
    | TexasUnimprovedPropertyOfferTermsDocument
): void {
  if (terms.propertyAssociation.mandatoryMembership) {
    requireIncludedAddendum(
      terms,
      'mandatory-poa-membership',
      'Include the mandatory property-owner association addendum.'
    );
  }
}


function validateDisclosureAddenda(
  terms:
    | TexasOneToFourFamilyResaleOfferTermsDocument
    | TexasCondominiumResaleOfferTermsDocument
    | TexasFarmAndRanchOfferTermsDocument
): void {
  if (terms.disclosures.leadBasedPaintApplies) {
    requireIncludedAddendum(
      terms,
      'lead-based-paint',
      'Include the lead-based-paint addendum.'
    );
  }
}


function requireIncludedAddendum(
  terms: TexasOfferTermsDocument,
  formId: string,
  message: string
): void {
  requireCondition(
    terms.addenda.some(
      addendum =>
        addendum.formId === formId &&
        addendum.included
    ),
    message
  );
}
