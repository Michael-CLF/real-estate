import type {
  OfferParty,
} from '../../../models/offer-party.model';

import type {
  OfferValidationContext,
  OfferValidationIssue,
  OfferValidationResult,
} from '../../../models/offer-validation.model';

import type {
  StateOfferValidator,
} from '../../state-offer-validator';

import type {
  TexasBrokerageContributionTerms,
  TexasDisclosureDeliveryTerms,
  TexasOneToFourFamilyResaleOfferTerms,
} from '../models/texas-offer-terms.model';


export class TexasOneToFourFamilyResaleValidator
implements StateOfferValidator<
  TexasOneToFourFamilyResaleOfferTerms
> {
  readonly stateCode = 'TX' as const;


  validate(
    terms:
      TexasOneToFourFamilyResaleOfferTerms,
    buyers: OfferParty[],
    sellers: OfferParty[],
    context: OfferValidationContext
  ): OfferValidationResult {
    const issues: OfferValidationIssue[] = [];

    this.validateContractIdentity(
      terms,
      issues
    );
    this.validateParties(
      buyers,
      sellers,
      context,
      issues
    );
    this.validateProperty(
      terms,
      issues
    );
    this.validatePropertyTerms(
      terms,
      issues
    );
    this.validateSalesPrice(
      terms,
      issues
    );
    this.validateLeases(
      terms,
      issues
    );
    this.validateEarnestMoneyAndOption(
      terms,
      issues
    );
    this.validateTitlePolicy(
      terms,
      issues
    );
    this.validateSurvey(
      terms,
      issues
    );
    this.validateAssociation(
      terms,
      issues
    );
    this.validateDisclosures(
      terms,
      context,
      issues
    );
    this.validatePropertyCondition(
      terms,
      issues
    );
    this.validateClosingAndPossession(
      terms,
      context,
      issues
    );
    this.validateExpenses(
      terms,
      issues
    );
    this.validateSpecialProvisions(
      terms,
      issues
    );
    this.validateAddenda(
      terms,
      issues
    );
    this.validateDelivery(
      terms,
      context,
      issues
    );

    const errors = issues.filter(
      issue => issue.severity === 'error'
    );

    const warnings = issues.filter(
      issue => issue.severity === 'warning'
    );

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }


  private validateContractIdentity(
    terms:
      TexasOneToFourFamilyResaleOfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    if (terms.stateCode !== 'TX') {
      this.addError(
        issues,
        'stateCode',
        'The Texas contract must use state code TX.'
      );
    }

    if (
      terms.contractType !==
        'one_to_four_family_resale'
    ) {
      this.addError(
        issues,
        'contractType',
        'The selected terms do not match the Texas One to Four Family Residential Contract.'
      );
    }

    if (
      terms.form.formId !== '20-19' ||
      terms.form.effectiveDate !==
        '2026-07-01' ||
      terms.form.revisionDate !==
        '2026-05-04'
    ) {
      this.addError(
        issues,
        'form',
        'The offer does not use the supported TREC 20-19 form version.'
      );
    }
  }


  private validateParties(
    buyers: OfferParty[],
    sellers: OfferParty[],
    context: OfferValidationContext,
    issues: OfferValidationIssue[]
  ): void {
    if (buyers.length < 1) {
      this.addError(
        issues,
        'buyers',
        'At least one buyer is required.'
      );
    }

    if (sellers.length < 1) {
      this.addError(
        issues,
        'sellers',
        'At least one seller is required.'
      );
    }

    buyers.forEach(
      (buyer, index) =>
        this.validateParty(
          buyer,
          'buyers.' + index,
          context,
          issues
        )
    );

    sellers.forEach(
      (seller, index) =>
        this.validateParty(
          seller,
          'sellers.' + index,
          context,
          issues
        )
    );
  }


  private validateParty(
    party: OfferParty,
    fieldPath: string,
    context: OfferValidationContext,
    issues: OfferValidationIssue[]
  ): void {
    if (!this.hasText(party.legalName)) {
      this.addError(
        issues,
        fieldPath + '.legalName',
        'A legal name is required.'
      );
    }

    if (!this.isValidEmail(party.email)) {
      this.addError(
        issues,
        fieldPath + '.email',
        'A valid email address is required.'
      );
    }

    if (!this.hasText(party.phone)) {
      this.addError(
        issues,
        fieldPath + '.phone',
        'A phone number is required.'
      );
    }

    const identityCheckApplies =
      (
        context.mode === 'submit' ||
        context.mode === 'signature'
      ) &&
      (
        !context.currentUserUid ||
        party.userUid ===
          context.currentUserUid
      );

    if (
      identityCheckApplies &&
      party.signature.required &&
      party.identityVerification.status !==
        'verified'
    ) {
      this.addError(
        issues,
        fieldPath +
          '.identityVerification',
        'Identity verification is required before this party can sign.'
      );
    }

    if (
      context.mode === 'signature' &&
      identityCheckApplies &&
      !party
        .electronicTransactionsConsentAccepted
    ) {
      this.addError(
        issues,
        fieldPath +
          '.electronicTransactionsConsentAccepted',
        'Consent to electronic transactions is required before signing.'
      );
    }
  }


  private validateProperty(
    terms:
      TexasOneToFourFamilyResaleOfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    const property = terms.property;

    const requiredText = [
      {
        value: property.listingUid,
        path: 'property.listingUid',
        message:
          'A listing identifier is required.',
      },
      {
        value: property.addressLine1,
        path: 'property.addressLine1',
        message:
          'The property street address is required.',
      },
      {
        value: property.city,
        path: 'property.city',
        message:
          'The property city is required.',
      },
      {
        value: property.zipCode,
        path: 'property.zipCode',
        message:
          'The property ZIP code is required.',
      },
      {
        value: property.county,
        path: 'property.county',
        message:
          'The property county is required.',
      },
    ];

    requiredText.forEach(field => {
      if (!this.hasText(field.value)) {
        this.addError(
          issues,
          field.path,
          field.message
        );
      }
    });

    if (
      property.state.trim().toUpperCase() !==
      'TX'
    ) {
      this.addError(
        issues,
        'property.state',
        'The property must be located in Texas.'
      );
    }

    const identification =
      terms.propertyIdentification;

    const hasLotAndAddition =
      this.hasText(identification.lot) &&
      this.hasText(identification.addition);

    const hasOtherLegalDescription =
      this.hasText(property.legalDescription) ||
      this.hasText(
        identification
          .legalDescriptionExhibitDocumentUid
      );

    if (
      !hasLotAndAddition &&
      !hasOtherLegalDescription
    ) {
      this.addError(
        issues,
        'propertyIdentification',
        'Enter the lot and addition or attach a complete legal description.'
      );
    }
  }


  private validatePropertyTerms(
    terms:
      TexasOneToFourFamilyResaleOfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    const propertyTerms =
      terms.propertyTerms;

    if (
      propertyTerms
        .mineralWaterTimberReservationApplies ===
        null
    ) {
      this.addError(
        issues,
        'propertyTerms.mineralWaterTimberReservationApplies',
        'Indicate whether a mineral, water, or timber reservation applies.'
      );
    }

    if (
      propertyTerms
        .mineralWaterTimberReservationApplies ===
        true &&
      !this.hasText(
        propertyTerms
          .reservationAddendumDocumentUid
      )
    ) {
      this.addError(
        issues,
        'propertyTerms.reservationAddendumDocumentUid',
        'Attach the applicable reservation addendum.'
      );
    }
  }


  private validateSalesPrice(
    terms:
      TexasOneToFourFamilyResaleOfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    const price = terms.salesPrice;

    this.validateNonNegativeMoney(
      price.cashPortionInCents,
      'salesPrice.cashPortionInCents',
      issues
    );
    this.validateNonNegativeMoney(
      price.financingInCents,
      'salesPrice.financingInCents',
      issues
    );

    if (
      !Number.isInteger(
        price.salesPriceInCents
      ) ||
      price.salesPriceInCents <= 0
    ) {
      this.addError(
        issues,
        'salesPrice.salesPriceInCents',
        'The sales price must be greater than zero.'
      );
    }

    if (
      price.cashPortionInCents +
        price.financingInCents !==
      price.salesPriceInCents
    ) {
      this.addError(
        issues,
        'salesPrice',
        'The cash and financing portions must equal the total sales price.'
      );
    }

    if (
      price.financingInCents > 0 &&
      price.financingAddenda.length === 0
    ) {
      this.addError(
        issues,
        'salesPrice.financingAddenda',
        'Select the applicable financing addendum.'
      );
    }
  }


  private validateLeases(
    terms:
      TexasOneToFourFamilyResaleOfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    const leases = terms.leases;

    if (leases.residentialLeasesExist === null) {
      this.addError(
        issues,
        'leases.residentialLeasesExist',
        'Indicate whether residential leases exist.'
      );
    }

    if (
      leases.residentialLeasesExist === true &&
      leases.residentialLeasesReceived === null
    ) {
      this.addError(
        issues,
        'leases.residentialLeasesReceived',
        'Indicate whether you received the residential leases from the seller.'
      );
    }

    if (leases.fixtureLeasesExist === null) {
      this.addError(
        issues,
        'leases.fixtureLeasesExist',
        'Indicate whether fixture leases exist.'
      );
    }

    if (
      leases.fixtureLeasesExist === true &&
      leases.fixtureLeasesReceived === null
    ) {
      this.addError(
        issues,
        'leases.fixtureLeasesReceived',
        'Indicate whether you received the fixture leases from the seller.'
      );
    }

    if (leases.naturalResourceLeasesExist === null) {
      this.addError(
        issues,
        'leases.naturalResourceLeasesExist',
        'The seller must complete the natural-resource lease statement.'
      );
    }

    if (
      leases.naturalResourceLeasesExist === true &&
      leases.naturalResourceLeaseStatus === 'unselected'
    ) {
      this.addError(
        issues,
        'leases.naturalResourceLeaseStatus',
        'Select the natural-resource lease status.'
      );
    }

    if (
      leases.naturalResourceLeasesExist === true &&
      leases.naturalResourceLeaseStatus ===
        'not_delivered'
    ) {
      this.validatePositiveDays(
        leases.naturalResourceLeaseDeliveryDays,
        'leases.naturalResourceLeaseDeliveryDays',
        'Enter the lease-delivery period.',
        issues
      );

      this.validatePositiveDays(
        leases.naturalResourceLeaseTerminationDays,
        'leases.naturalResourceLeaseTerminationDays',
        'Enter the buyer termination period.',
        issues
      );
    }
  }


  private validateEarnestMoneyAndOption(
    terms:
      TexasOneToFourFamilyResaleOfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    const money =
      terms.earnestMoneyAndOption;

    if (!this.hasText(money.escrowAgentName)) {
      this.addError(
        issues,
        'earnestMoneyAndOption.escrowAgentName',
        'Enter the escrow agent or title company.'
      );
    }

    if (!this.hasText(money.escrowAgentAddress)) {
      this.addError(
        issues,
        'earnestMoneyAndOption.escrowAgentAddress',
        'Enter the escrow agent address.'
      );
    }

    this.validateNonNegativeMoney(
      money.earnestMoneyInCents,
      'earnestMoneyAndOption.earnestMoneyInCents',
      issues
    );
    this.validateNonNegativeMoney(
      money.optionFeeInCents,
      'earnestMoneyAndOption.optionFeeInCents',
      issues
    );

    if (
      money.additionalEarnestMoneyInCents !==
        undefined
    ) {
      this.validateNonNegativeMoney(
        money.additionalEarnestMoneyInCents,
        'earnestMoneyAndOption.additionalEarnestMoneyInCents',
        issues
      );

      if (
        money.additionalEarnestMoneyInCents >
        0
      ) {
        this.validatePositiveDays(
          money
            .additionalEarnestMoneyDeliveryDays,
          'earnestMoneyAndOption.additionalEarnestMoneyDeliveryDays',
          'Enter the additional earnest-money delivery period.',
          issues
        );
      }
    }

    if (money.optionFeeInCents > 0) {
      this.validatePositiveDays(
        money.optionPeriodDays,
        'earnestMoneyAndOption.optionPeriodDays',
        'Enter the option period.',
        issues
      );
    }
  }


  private validateTitlePolicy(
    terms:
      TexasOneToFourFamilyResaleOfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    const title = terms.titlePolicy;

    if (!this.hasText(title.titleCompanyName)) {
      this.addError(
        issues,
        'titlePolicy.titleCompanyName',
        'Enter the title company.'
      );
    }

    if (
      title.titlePolicyExpensePayer ===
        'unselected'
    ) {
      this.addError(
        issues,
        'titlePolicy.titlePolicyExpensePayer',
        'Select who will pay for the owner title policy.'
      );
    }

    if (
      title.boundaryExceptionTreatment ===
        'unselected'
    ) {
      this.addError(
        issues,
        'titlePolicy.boundaryExceptionTreatment',
        'Select the boundary-exception treatment.'
      );
    }

    if (
      title.boundaryExceptionTreatment ===
        'amended_to_shortages_in_area' &&
      (
        !title.boundaryAmendmentExpensePayer ||
        title.boundaryAmendmentExpensePayer ===
          'unselected'
      )
    ) {
      this.addError(
        issues,
        'titlePolicy.boundaryAmendmentExpensePayer',
        'Select who will pay for the boundary amendment.'
      );
    }
  }


  private validateSurvey(
    terms:
      TexasOneToFourFamilyResaleOfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    const survey = terms.survey;

    if (survey.selection === 'unselected') {
      this.addError(
        issues,
        'survey.selection',
        'Select the applicable survey option.'
      );
      return;
    }

    this.validatePositiveDays(
      survey.deliveryDays,
      'survey.deliveryDays',
      'Enter the survey delivery period.',
      issues
    );

    this.validatePositiveDays(
      survey.titleObjectionDays,
      'survey.titleObjectionDays',
      'Enter the title-objection period.',
      issues
    );

    if (
      survey.selection ===
        'seller_existing_survey' &&
      (
        !survey
          .newSurveyIfExistingRejectedExpensePayer ||
        survey
          .newSurveyIfExistingRejectedExpensePayer ===
          'unselected'
      )
    ) {
      this.addError(
        issues,
        'survey.newSurveyIfExistingRejectedExpensePayer',
        'Select who pays for a replacement survey if the existing survey is unacceptable.'
      );
    }
  }


  private validateAssociation(
    terms:
      TexasOneToFourFamilyResaleOfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    const association =
      terms.propertyAssociation;

    if (association.mandatoryMembership === null) {
      this.addError(
        issues,
        'propertyAssociation.mandatoryMembership',
        'Indicate whether mandatory property-owner association membership applies.'
      );
    }

    if (
      association.mandatoryMembership === true &&
      !this.hasText(
        association.associationAddendumDocumentUid
      )
    ) {
      this.addError(
        issues,
        'propertyAssociation.associationAddendumDocumentUid',
        'Attach the mandatory property-owner association addendum.'
      );
    }
  }


  private validateDisclosures(
    terms:
      TexasOneToFourFamilyResaleOfferTerms,
    context: OfferValidationContext,
    issues: OfferValidationIssue[]
  ): void {
    if (context.mode === 'draft') {
      return;
    }

    this.validateDisclosure(
      terms.disclosures.propertyCondition,
      'disclosures.propertyCondition',
      'seller disclosure notice',
      issues
    );

    this.validateDisclosure(
      terms.disclosures.waterRights,
      'disclosures.waterRights',
      'water and mineral rights disclosure',
      issues
    );

    if (
      terms.disclosures.leadBasedPaintApplies ===
        null
    ) {
      this.addError(
        issues,
        'disclosures.leadBasedPaintApplies',
        'Indicate whether the lead-based-paint addendum applies.'
      );
    }

    if (
      terms.disclosures.leadBasedPaintApplies ===
        true &&
      !this.hasText(
        terms.disclosures
          .leadBasedPaintAddendumDocumentUid
      )
    ) {
      this.addError(
        issues,
        'disclosures.leadBasedPaintAddendumDocumentUid',
        'Attach the lead-based-paint addendum.'
      );
    }
  }


  private validateDisclosure(
    disclosure: TexasDisclosureDeliveryTerms,
    fieldPath: string,
    title: string,
    issues: OfferValidationIssue[]
  ): void {
    if (disclosure.status === 'unselected') {
      this.addError(
        issues,
        fieldPath + '.status',
        'Select the status of the ' + title + '.'
      );
    }

    if (
      disclosure.status === 'received' &&
      !this.hasText(disclosure.documentUid)
    ) {
      this.addError(
        issues,
        fieldPath + '.documentUid',
        'Attach the received ' + title + '.'
      );
    }

    if (disclosure.status === 'not_received') {
      this.validatePositiveDays(
        disclosure.deliveryDays,
        fieldPath + '.deliveryDays',
        'Enter the delivery period for the ' +
          title + '.',
        issues
      );
    }
  }


  private validatePropertyCondition(
    terms:
      TexasOneToFourFamilyResaleOfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    const condition =
      terms.propertyCondition;

    if (condition.acceptance === 'unselected') {
      this.addError(
        issues,
        'propertyCondition.acceptance',
        'Select the buyer property-condition acceptance.'
      );
    }

    if (
      condition.acceptance ===
        'as_is_with_specific_repairs' &&
      !this.hasText(
        condition
          .partyProvidedRepairsAndTreatments
      )
    ) {
      this.addError(
        issues,
        'propertyCondition.partyProvidedRepairsAndTreatments',
        'Enter the party-provided repairs and treatments.'
      );
    }

    if (
      condition
        .residentialServiceContractReimbursementInCents !==
        undefined
    ) {
      this.validateNonNegativeMoney(
        condition
          .residentialServiceContractReimbursementInCents,
        'propertyCondition.residentialServiceContractReimbursementInCents',
        issues
      );
    }
  }


  private validateClosingAndPossession(
    terms:
      TexasOneToFourFamilyResaleOfferTerms,
    context: OfferValidationContext,
    issues: OfferValidationIssue[]
  ): void {
    const closing =
      terms.closingAndPossession;

    if (!this.isValidDate(closing.closingDate)) {
      this.addError(
        issues,
        'closingAndPossession.closingDate',
        'Enter a valid closing date.'
      );
    }

    if (closing.possession === 'unselected') {
      this.addError(
        issues,
        'closingAndPossession.possession',
        'Select when possession will be delivered.'
      );
    }

    if (
      closing.possession ===
        'temporary_residential_lease' &&
      !this.hasText(
        closing
          .temporaryResidentialLeaseDocumentUid
      )
    ) {
      this.addError(
        issues,
        'closingAndPossession.temporaryResidentialLeaseDocumentUid',
        'Attach the applicable temporary residential lease.'
      );
    }

    const closingDate =
      this.parseDate(closing.closingDate);

    const currentDate =
      context.currentDateTime ?? new Date();

    if (
      closingDate &&
      closingDate.getTime() <
        this.startOfUtcDay(currentDate).getTime()
    ) {
      this.addError(
        issues,
        'closingAndPossession.closingDate',
        'The closing date cannot be in the past.'
      );
    }
  }


  private validateExpenses(
    terms:
      TexasOneToFourFamilyResaleOfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    const expenses = terms.expenses;

    if (
      expenses
        .sellerContributionToBuyerExpensesInCents !==
        undefined
    ) {
      this.validateNonNegativeMoney(
        expenses
          .sellerContributionToBuyerExpensesInCents,
        'expenses.sellerContributionToBuyerExpensesInCents',
        issues
      );
    }

    this.validateBrokerageContribution(
      expenses.sellerContributionToBuyerBroker,
      'expenses.sellerContributionToBuyerBroker',
      issues
    );

    this.validateBrokerageContribution(
      expenses.buyerContributionToSellerBroker,
      'expenses.buyerContributionToSellerBroker',
      issues
    );
  }


  private validateBrokerageContribution(
    contribution:
      TexasBrokerageContributionTerms,
    fieldPath: string,
    issues: OfferValidationIssue[]
  ): void {
    if (
      contribution.contributionType ===
        'unselected'
    ) {
      this.addError(
        issues,
        fieldPath + '.contributionType',
        'Select the brokerage-contribution type.'
      );
      return;
    }

    if (
      contribution.contributionType === 'amount'
    ) {
      if (
        contribution.amountInCents === undefined ||
        !Number.isInteger(
          contribution.amountInCents
        ) ||
        contribution.amountInCents <= 0
      ) {
        this.addError(
          issues,
          fieldPath + '.amountInCents',
          'Enter a brokerage-contribution amount greater than zero.'
        );
      }
    }

    if (
      contribution.contributionType ===
        'percentage'
    ) {
      const percentage =
        contribution.percentageOfSalesPrice;

      if (
        typeof percentage !== 'number' ||
        !Number.isFinite(percentage) ||
        percentage <= 0 ||
        percentage > 100
      ) {
        this.addError(
          issues,
          fieldPath + '.percentageOfSalesPrice',
          'Enter a percentage greater than zero and no more than 100.'
        );
      }
    }
  }


  private validateSpecialProvisions(
    terms:
      TexasOneToFourFamilyResaleOfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    const provisions =
      terms.specialProvisions;

    if (!provisions.included) {
      return;
    }

    if (
      provisions.preparedBy !== 'buyer' &&
      provisions.preparedBy !== 'seller' &&
      provisions.preparedBy !== 'attorney'
    ) {
      this.addError(
        issues,
        'specialProvisions.preparedBy',
        'Identify who supplied the special provisions.'
      );
    }

    if (!this.hasText(provisions.partyProvidedText)) {
      this.addError(
        issues,
        'specialProvisions.partyProvidedText',
        'Enter the party- or attorney-provided special provisions.'
      );
    }
  }


  private validateAddenda(
    terms:
      TexasOneToFourFamilyResaleOfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    terms.addenda.forEach(
      (addendum, index) => {
        if (!addendum.included) {
          return;
        }

        const path = 'addenda.' + index;

        if (!this.hasText(addendum.formId)) {
          this.addError(
            issues,
            path + '.formId',
            'An included addendum needs a form identifier.'
          );
        }

        if (!this.hasText(addendum.title)) {
          this.addError(
            issues,
            path + '.title',
            'An included addendum needs a title.'
          );
        }

        if (!this.hasText(addendum.documentUid)) {
          this.addError(
            issues,
            path + '.documentUid',
            'An included addendum needs a document.'
          );
        }
      }
    );
  }


  private validateDelivery(
    terms:
      TexasOneToFourFamilyResaleOfferTerms,
    context: OfferValidationContext,
    issues: OfferValidationIssue[]
  ): void {
    const delivery = terms.delivery;

    if (!this.isValidDateTime(delivery.expiresAt)) {
      this.addError(
        issues,
        'delivery.expiresAt',
        'Enter a valid offer expiration date and time with a UTC offset.'
      );
    }

    if (
      delivery.timeZone !==
        'America/Chicago' &&
      delivery.timeZone !==
        'America/Denver'
    ) {
      this.addError(
        issues,
        'delivery.timeZone',
        'Use the Central or Mountain time zone determined from the Texas property location.'
      );
    }

    if (
      context.mode !== 'draft' &&
      delivery.electronicDeliveryAuthorized !==
        true
    ) {
      this.addError(
        issues,
        'delivery.electronicDeliveryAuthorized',
        'Electronic delivery must be authorized before submission.'
      );
    }

    const expiration =
      this.parseDate(delivery.expiresAt);

    const currentDateTime =
      context.currentDateTime ?? new Date();

    if (
      expiration &&
      expiration.getTime() <=
        currentDateTime.getTime()
    ) {
      this.addError(
        issues,
        'delivery.expiresAt',
        'The offer expiration must be in the future.'
      );
    }

    const closing = this.parseDate(
      terms.closingAndPossession.closingDate
    );

    if (
      expiration &&
      closing &&
      expiration.getTime() >= closing.getTime()
    ) {
      this.addError(
        issues,
        'delivery.expiresAt',
        'The offer must expire before the proposed closing date.'
      );
    }
  }


  private validateNonNegativeMoney(
    value: number,
    fieldPath: string,
    issues: OfferValidationIssue[]
  ): void {
    if (
      !Number.isInteger(value) ||
      value < 0
    ) {
      this.addError(
        issues,
        fieldPath,
        'The amount cannot be negative.'
      );
    }
  }


  private validatePositiveDays(
    value: number | undefined,
    fieldPath: string,
    message: string,
    issues: OfferValidationIssue[]
  ): void {
    if (
      !Number.isInteger(value) ||
      (value ?? 0) < 1 ||
      (value ?? 0) > 365
    ) {
      this.addError(
        issues,
        fieldPath,
        message
      );
    }
  }


  private isValidDate(
    value: string | undefined
  ): boolean {
    if (
      !value ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
      return false;
    }

    const parsed =
      new Date(value + 'T12:00:00Z');

    return (
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) ===
        value
    );
  }


  private isValidDateTime(
    value: string | undefined
  ): boolean {
    return (
      typeof value === 'string' &&
      /(Z|[+-]\d{2}:\d{2})$/.test(value) &&
      this.parseDate(value) !== null
    );
  }


  private parseDate(
    value: string | undefined
  ): Date | null {
    if (!value) {
      return null;
    }

    const normalized =
      /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? value + 'T12:00:00Z'
        : value;

    const parsed = new Date(normalized);

    return Number.isNaN(parsed.getTime())
      ? null
      : parsed;
  }


  private startOfUtcDay(value: Date): Date {
    return new Date(
      Date.UTC(
        value.getUTCFullYear(),
        value.getUTCMonth(),
        value.getUTCDate()
      )
    );
  }


  private hasText(
    value: string | undefined
  ): boolean {
    return (
      typeof value === 'string' &&
      value.trim().length > 0
    );
  }


  private isValidEmail(
    value: string | undefined
  ): boolean {
    return (
      typeof value === 'string' &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        value.trim()
      )
    );
  }


  private addError(
    issues: OfferValidationIssue[],
    fieldPath: string,
    message: string
  ): void {
    issues.push({
      fieldPath,
      message,
      severity: 'error',
    });
  }
}
