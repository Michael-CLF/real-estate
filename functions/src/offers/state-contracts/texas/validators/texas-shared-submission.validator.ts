import type {
  OfferDocument,
  OfferVersionDocument,
  OfferVersionPartySnapshotDocument,
} from '../../../offer-types';

import {
  createTexasApprovedAddendaCatalog,
  getTexasPropertyTimeZone,
} from '../texas-initial-terms';

import {
  getTexasContractDefinition,
} from '../texas-contract-catalog';

import type {
  TexasBrokerageContributionTermsDocument,
  TexasDisclosureDeliveryTermsDocument,
  TexasFinancingAddendumTypeDocument,
  TexasOfferTermsDocument,
  TexasOneToFourFamilyResaleOfferTermsDocument,
} from '../texas-offer-terms.document';

import {
  hasText,
  isPositiveMoney,
  isValidDate,
  isValidDateTime,
  isValidEmail,
  parseDate,
  requireCondition,
  requireNonNegativeMoney,
  requirePositiveDays,
  requireText,
  startOfUtcDay,
} from './texas-submission-validation.utils';


export type TexasOfferVersionDocument =
  Omit<
    OfferVersionDocument,
    'terms'
  > & {
    terms: TexasOfferTermsDocument;
  };


type TexasSharedSubmissionTerms =
  Pick<
    TexasOneToFourFamilyResaleOfferTermsDocument,
    | 'property'
    | 'salesPrice'
    | 'earnestMoneyAndOption'
    | 'titlePolicy'
    | 'propertyCondition'
    | 'closingAndPossession'
    | 'expenses'
    | 'specialProvisions'
    | 'addenda'
    | 'delivery'
  >;


export interface ValidateTexasSharedSubmissionInput {
  offer: OfferDocument;
  version: TexasOfferVersionDocument;
  terms: TexasOfferTermsDocument;
  now: Date;
}


export function validateTexasSharedSubmission(
  input: ValidateTexasSharedSubmissionInput
): void {
  validateEnvelope(input.offer, input.version, input.terms);
  validateContractIdentity(input.terms);
  validateParties(input.version);
  validateProperty(input.offer, input.terms);
  validateSalesPrice(input.terms);
  validateEarnestMoneyAndOption(input.terms);
  validateTitlePolicy(input.terms);
  validatePropertyCondition(input.terms);
  validateClosingAndPossession(input.terms, input.now);
  validateExpenses(input.terms);
  validateSpecialProvisions(input.terms);
  validateAddenda(input.terms);
  validateDelivery(input.version, input.terms, input.now);
  validateSharedConditionalAddenda(input.terms);
}


function validateEnvelope(
  offer: OfferDocument,
  version: TexasOfferVersionDocument,
  terms: TexasOfferTermsDocument
): void {
  requireCondition(
    offer.stateCode === 'TX' &&
      version.stateCode === 'TX' &&
      terms.stateCode === 'TX',
    'The offer, version, and contract terms must all use state code TX.'
  );

  requireCondition(
    offer.currentVersionUid === version.Uid,
    'Only the current offer version may be submitted.'
  );

  requireCondition(
    version.offerUid === offer.Uid,
    'The offer version does not belong to this offer.'
  );

  requireCondition(
    version.status === 'draft',
    'Only a draft offer version may be submitted.'
  );

  requireCondition(
    version.immutable === false,
    'The offer version is already locked.'
  );
}


function validateContractIdentity(
  terms: TexasOfferTermsDocument
): void {
  const definition = getTexasContractDefinition(
    terms.contractType
  );

  requireCondition(
    terms.form.formId === definition.formId &&
      terms.form.effectiveDate === definition.effectiveDate &&
      terms.form.revisionDate === definition.revisionDate,
    `The offer does not use the supported ${definition.formId} form version.`
  );
}


function validateParties(
  version: TexasOfferVersionDocument
): void {
  requireCondition(
    version.buyers.length >= 1,
    'At least one buyer is required.'
  );
  requireCondition(
    version.sellers.length >= 1,
    'At least one seller is required.'
  );

  version.buyers.forEach(validateParty);
  version.sellers.forEach(validateParty);

  const initiatingParties = [
    ...version.buyers,
    ...version.sellers,
  ].filter(
    party => party.userUid === version.initiatedByUid
  );

  requireCondition(
    initiatingParties.length > 0,
    'The initiating party is not included in this offer version.'
  );

  initiatingParties.forEach(party => {
    requireCondition(
      party.identityVerification.status === 'verified',
      `${party.legalName || 'The initiating party'} must complete identity verification before submission.`
    );

  });
}


function validateParty(
  party: OfferVersionPartySnapshotDocument
): void {
  requireText(
    party.legalName,
    'Every party must have a legal name.'
  );
  requireCondition(
    isValidEmail(party.email),
    `A valid email address is required for ${party.legalName || 'every party'}.`
  );
  requireText(
    party.phone,
    `A phone number is required for ${party.legalName || 'every party'}.`
  );
}


function validateProperty(
  offer: OfferDocument,
  terms: TexasOfferTermsDocument
): void {
  const property = terms.property;

  requireCondition(
    property.listingUid === offer.listingUid,
    'The contract property does not match the offer listing.'
  );
  requireCondition(
    property.state.trim().toUpperCase() === 'TX',
    'The property must be located in Texas.'
  );
  requireText(property.addressLine1, 'The property street address is required.');
  requireText(property.city, 'The property city is required.');
  requireText(property.zipCode, 'The property ZIP code is required.');
  requireText(property.county, 'The property county is required.');
}


function validateSalesPrice(
  terms: TexasSharedSubmissionTerms
): void {
  const price = terms.salesPrice;

  requireNonNegativeMoney(
    price.cashPortionInCents,
    'The cash portion cannot be negative.'
  );
  requireNonNegativeMoney(
    price.financingInCents,
    'The financing portion cannot be negative.'
  );
  requireCondition(
    isPositiveMoney(price.salesPriceInCents),
    'The sales price must be greater than zero.'
  );
  requireCondition(
    price.cashPortionInCents + price.financingInCents ===
      price.salesPriceInCents,
    'The cash and financing portions must equal the total sales price.'
  );
  requireCondition(
    price.financingInCents === 0 ||
      price.financingAddenda.length > 0,
    'Select the applicable financing addendum.'
  );
}


function validateEarnestMoneyAndOption(
  terms: TexasSharedSubmissionTerms
): void {
  const money = terms.earnestMoneyAndOption;

  requireNonNegativeMoney(money.earnestMoneyInCents, 'The earnest money cannot be negative.');
  requireNonNegativeMoney(money.optionFeeInCents, 'The option fee cannot be negative.');

  if (money.additionalEarnestMoneyInCents !== undefined) {
    requireNonNegativeMoney(
      money.additionalEarnestMoneyInCents,
      'The additional earnest money cannot be negative.'
    );

    if (money.additionalEarnestMoneyInCents > 0) {
      requirePositiveDays(
        money.additionalEarnestMoneyDeliveryDays,
        'Enter the additional earnest-money delivery period.'
      );
    }
  }

  if (money.optionFeeInCents > 0) {
    requirePositiveDays(money.optionPeriodDays, 'Enter the option period.');
  }
}


function validateTitlePolicy(
  terms: TexasSharedSubmissionTerms
): void {
  const title = terms.titlePolicy;

  requireCondition(
    title.titlePolicyExpensePayer !== 'unselected',
    'Select who pays for the owner title policy.'
  );
  requireCondition(
    title.boundaryExceptionTreatment !== 'unselected',
    'Select the boundary-exception treatment.'
  );

  if (title.boundaryExceptionTreatment === 'amended_to_shortages_in_area') {
    requireCondition(
      title.boundaryAmendmentExpensePayer !== undefined &&
        title.boundaryAmendmentExpensePayer !== 'unselected',
      'Select who pays for the boundary amendment.'
    );
  }
}


function validatePropertyCondition(
  terms: TexasSharedSubmissionTerms
): void {
  const condition = terms.propertyCondition;

  requireCondition(
    condition.acceptance !== 'unselected',
    'Select the buyer property-condition acceptance.'
  );

  if (condition.acceptance === 'as_is_with_specific_repairs') {
    requireText(
      condition.partyProvidedRepairsAndTreatments,
      'Enter the party- or attorney-provided repairs and treatments.'
    );
  }

  if (
    condition.residentialServiceContractReimbursementInCents !==
      undefined
  ) {
    requireNonNegativeMoney(
      condition.residentialServiceContractReimbursementInCents,
      'The residential service-contract reimbursement cannot be negative.'
    );
  }
}


function validateClosingAndPossession(
  terms: TexasSharedSubmissionTerms,
  now: Date
): void {
  const closing = terms.closingAndPossession;

  requireCondition(
    isValidDate(closing.closingDate),
    'Enter a valid closing date.'
  );
  requireCondition(
    closing.possession !== 'unselected',
    'Select when possession will be delivered.'
  );

  if (closing.possession === 'temporary_residential_lease') {
    requireText(
      closing.temporaryResidentialLeaseDocumentUid,
      'Attach the applicable temporary residential lease.'
    );
  }

  const closingDate = parseDate(closing.closingDate);

  requireCondition(
    closingDate !== null &&
      closingDate.getTime() >= startOfUtcDay(now).getTime(),
    'The closing date cannot be in the past.'
  );
}


function validateExpenses(
  terms: TexasSharedSubmissionTerms
): void {
  const expenses = terms.expenses;

  requireCondition(
    expenses.sellerContributionToBuyerExpensesType !== 'unselected',
    'Select whether the seller will contribute to buyer expenses.'
  );

  if (
    expenses.sellerContributionToBuyerExpensesType === 'amount'
  ) {
    requireCondition(
      expenses.sellerContributionToBuyerExpensesInCents !== undefined &&
        isPositiveMoney(
          expenses.sellerContributionToBuyerExpensesInCents
        ),
      'Enter a seller contribution to buyer expenses greater than zero.'
    );
  }

  if (expenses.sellerContributionToBuyerExpensesInCents !== undefined) {
    requireNonNegativeMoney(
      expenses.sellerContributionToBuyerExpensesInCents,
      'The seller contribution to buyer expenses cannot be negative.'
    );
  }

  validateBrokerageContribution(
    expenses.sellerContributionToBuyerBroker,
    'seller contribution to the buyer broker'
  );
  validateBrokerageContribution(
    expenses.buyerContributionToSellerBroker,
    'buyer contribution to the seller broker'
  );
}


function validateBrokerageContribution(
  contribution: TexasBrokerageContributionTermsDocument,
  title: string
): void {
  requireCondition(
    contribution.contributionType !== 'unselected',
    `Select the ${title}.`
  );

  if (contribution.contributionType === 'amount') {
    requireCondition(
      contribution.amountInCents !== undefined &&
        isPositiveMoney(contribution.amountInCents),
      `Enter a ${title} amount greater than zero.`
    );
  }

  if (contribution.contributionType === 'percentage') {
    requireCondition(
      typeof contribution.percentageOfSalesPrice === 'number' &&
        Number.isFinite(contribution.percentageOfSalesPrice) &&
        contribution.percentageOfSalesPrice > 0 &&
        contribution.percentageOfSalesPrice <= 100,
      `Enter a valid ${title} percentage.`
    );
  }
}


function validateSpecialProvisions(
  terms: TexasSharedSubmissionTerms
): void {
  const provisions = terms.specialProvisions;

  if (!provisions.included) {
    return;
  }

  requireCondition(
    provisions.preparedBy === 'buyer' ||
      provisions.preparedBy === 'seller' ||
      provisions.preparedBy === 'attorney',
    'Identify who supplied the special provisions.'
  );
  requireText(
    provisions.partyProvidedText,
    'Enter the party- or attorney-provided special provisions.'
  );
}


function validateAddenda(
  terms: TexasSharedSubmissionTerms
): void {
  const approvedIds = new Set(
    createTexasApprovedAddendaCatalog()
      .map(addendum => addendum.formId)
  );
  const observedIds = new Set<string>();

  terms.addenda.forEach(addendum => {
    requireCondition(
      approvedIds.has(addendum.formId),
      `The addendum ${addendum.formId || '(missing identifier)'} is not approved for this Texas contract package.`
    );
    requireCondition(
      !observedIds.has(addendum.formId),
      `The addendum ${addendum.formId} appears more than once.`
    );

    observedIds.add(addendum.formId);

    if (addendum.included) {
      requireText(addendum.title, 'Every included addendum must have a title.');
    }
  });

  requireCondition(
    observedIds.size === approvedIds.size &&
      [...approvedIds].every(id => observedIds.has(id)),
    'The Texas approved addenda catalog is incomplete.'
  );
}


function validateDelivery(
  version: TexasOfferVersionDocument,
  terms: TexasSharedSubmissionTerms,
  now: Date
): void {
  const delivery = terms.delivery;

  requireCondition(
    isValidDateTime(delivery.expiresAt),
    'Enter a valid offer expiration date and time with a UTC offset.'
  );
  requireCondition(
    delivery.expiresAt === version.expiresAt,
    'The contract expiration must match the offer-version expiration.'
  );
  requireCondition(
    delivery.timeZone === getTexasPropertyTimeZone(terms.property.county),
    'The contract timezone does not match the Texas property location.'
  );
  requireCondition(
    delivery.electronicDeliveryAuthorized === true,
    'Electronic delivery must be authorized before submission.'
  );

  const expiration = parseDate(delivery.expiresAt);
  const closing = parseDate(terms.closingAndPossession.closingDate);

  requireCondition(
    expiration !== null && expiration.getTime() > now.getTime(),
    'The offer expiration must be in the future.'
  );
  requireCondition(
    expiration !== null &&
      closing !== null &&
      expiration.getTime() < closing.getTime(),
    'The offer must expire before the proposed closing date.'
  );
}


function validateSharedConditionalAddenda(
  terms: TexasSharedSubmissionTerms
): void {
  const includedIds = new Set(
    terms.addenda
      .filter(addendum => addendum.included)
      .map(addendum => addendum.formId)
  );

  const financingMap:
    Record<TexasFinancingAddendumTypeDocument, string> = {
      third_party_financing: 'third-party-financing',
      loan_assumption: 'loan-assumption',
      seller_financing: 'seller-financing',
    };

  terms.salesPrice.financingAddenda.forEach(financingType => {
    const requiredAddendumId = financingMap[financingType];

    requireCondition(
      includedIds.has(requiredAddendumId),
      `Include the ${requiredAddendumId} addendum selected in the financing terms.`
    );
  });

  if (terms.closingAndPossession.possession === 'temporary_residential_lease') {
    requireCondition(
      includedIds.has('buyer-temporary-residential-lease') ||
        includedIds.has('seller-temporary-residential-lease'),
      'Include the applicable temporary residential lease.'
    );
  }
}


export function validatePropertyIdentification(
  terms: {
    property: TexasOfferTermsDocument['property'];
    propertyIdentification: TexasOneToFourFamilyResaleOfferTermsDocument['propertyIdentification'];
  }
): void {
  const identification = terms.propertyIdentification;
  const hasLotAndAddition =
    hasText(identification.lot) &&
    hasText(identification.addition);
  const hasOtherLegalDescription =
    hasText(terms.property.legalDescription) ||
    hasText(identification.legalDescriptionExhibitDocumentUid) ||
    (
      hasText(terms.property.addressLine1) &&
      hasText(terms.property.city) &&
      hasText(terms.property.county) &&
      hasText(terms.property.state) &&
      hasText(terms.property.zipCode)
    );

  requireCondition(
    hasLotAndAddition || hasOtherLegalDescription,
    'The listing must contain a complete property address, lot and addition, or legal-description exhibit.'
  );
}


export function validatePropertyTerms(
  propertyTerms: TexasOneToFourFamilyResaleOfferTermsDocument['propertyTerms']
): void {
  requireCondition(
    propertyTerms.mineralWaterTimberReservationApplies !== null,
    'Select whether a mineral, water, or timber reservation applies.'
  );

}


export function validateLeaseTerms(
  leases: TexasOneToFourFamilyResaleOfferTermsDocument['leases']
): void {
  requireCondition(
    leases.residentialLeasesExist !== null,
    'Select whether residential leases exist.'
  );

  requireCondition(
    leases.fixtureLeasesExist !== null,
    'Select whether fixture leases exist.'
  );

  if (leases.residentialLeasesExist) {
    requireCondition(
      leases.residentialLeasesReceived !== null,
      'Indicate whether the residential leases were received.'
    );
  }

  if (leases.fixtureLeasesExist) {
    requireCondition(
      leases.fixtureLeasesReceived !== null,
      'Indicate whether the fixture leases were received.'
    );
  }

  requireCondition(
    leases.naturalResourceLeasesExist !== null,
    'The seller must complete the natural-resource lease statement.'
  );

  requireCondition(
    leases.naturalResourceLeasesExist !== true ||
      leases.naturalResourceLeaseStatus !== 'unselected',
    'Select the natural-resource lease status.'
  );
  if (
    leases.naturalResourceLeasesExist === true &&
    leases.naturalResourceLeaseStatus === 'not_delivered'
  ) {
    requirePositiveDays(
      leases.naturalResourceLeaseDeliveryDays,
      'Enter the natural-resource lease delivery period.'
    );
    requirePositiveDays(
      leases.naturalResourceLeaseTerminationDays,
      'Enter the natural-resource lease termination period.'
    );
  }
}


export function validateSurveyTerms(
  survey: TexasOneToFourFamilyResaleOfferTermsDocument['survey']
): void {
  requireCondition(
    survey.selection !== 'unselected',
    'Select the applicable survey option.'
  );
  requirePositiveDays(survey.deliveryDays, 'Enter the survey delivery period.');
  requirePositiveDays(survey.titleObjectionDays, 'Enter the title-objection period.');

  if (survey.selection === 'seller_existing_survey') {
    requireCondition(
      survey.newSurveyIfExistingRejectedExpensePayer !== undefined &&
        survey.newSurveyIfExistingRejectedExpensePayer !== 'unselected',
      'Select who pays for a replacement survey if the existing survey is unacceptable.'
    );
  }
}


export function validateAssociationTerms(
  association: TexasOneToFourFamilyResaleOfferTermsDocument['propertyAssociation']
): void {
  requireCondition(
    association.mandatoryMembership !== null,
    'Select whether mandatory property-owner association membership applies.'
  );

}


export function validateDisclosureTerms(
  disclosures: TexasOneToFourFamilyResaleOfferTermsDocument['disclosures']
): void {
  validateDisclosure(disclosures.propertyCondition, 'seller disclosure notice');
  validateDisclosure(disclosures.waterRights, 'water and mineral rights disclosure');

  requireCondition(
    disclosures.leadBasedPaintApplies !== null,
    'Select whether the lead-based-paint addendum applies.'
  );
}


function validateDisclosure(
  disclosure: TexasDisclosureDeliveryTermsDocument,
  title: string
): void {
  requireCondition(
    disclosure.status !== 'unselected',
    `Select the status of the ${title}.`
  );
  if (disclosure.status === 'not_received') {
    requirePositiveDays(
      disclosure.deliveryDays,
      `Enter the delivery period for the ${title}.`
    );
  }
}
