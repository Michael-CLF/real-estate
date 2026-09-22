import {
  OfferParty
} from '../../../models/offer-party.model';

import {
  MoneyInCents,
  OfferDate,
  OfferDateTime
} from '../../../models/offer-terms.model';

import {
  NorthCarolinaOfferTerms
} from '../models/north-carolina-offer-terms.model';

import {
  OfferValidationContext,
  OfferValidationIssue,
  OfferValidationResult
} from '../../../models/offer-validation.model';

import type {
  StateOfferValidator
} from '../../state-offer-validator';


export class NorthCarolinaOfferValidator
implements StateOfferValidator<NorthCarolinaOfferTerms> {
  readonly stateCode = 'NC' as const;

  validate(
    terms: NorthCarolinaOfferTerms,
    buyers: OfferParty[],
    sellers: OfferParty[],
    context: OfferValidationContext
  ): OfferValidationResult {
    const issues: OfferValidationIssue[] = [];

    this.validateState(
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

    this.validatePurchaseTerms(
      terms,
      issues
    );

    this.validateDeposits(
      terms,
      issues
    );

    this.validateConcessions(
      terms,
      issues
    );

    this.validateSettlement(
      terms,
      issues
    );

    this.validateBuyerDisclosures(
      terms,
      context,
      issues
    );

    this.validateSellerStatements(
      terms,
      issues
    );

    this.validateAddenda(
      terms,
      issues
    );

    this.validateAdditionalTerms(
      terms,
      issues
    );

    this.validateDelivery(
      terms,
      context,
      issues
    );

    this.validateChronology(
      terms,
      issues
    );

    const errors =
      issues.filter(
        issue =>
          issue.severity === 'error'
      );

    const warnings =
      issues.filter(
        issue =>
          issue.severity === 'warning'
      );

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }


  private validateState(
    terms: NorthCarolinaOfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    if (terms.stateCode !== 'NC') {
      this.addError(
        issues,
        'stateCode',
        'NavStreet currently supports only the North Carolina purchase agreement.'
      );
    }
  }


  private validateParties(
    buyers: OfferParty[],
    sellers: OfferParty[],
    context: OfferValidationContext,
    issues: OfferValidationIssue[]
  ): void {
    if (buyers.length !== 1) {
      this.addError(
        issues,
        'buyers',
        'The NavStreet offer form currently supports exactly one buyer.'
      );
    }

    if (sellers.length !== 1) {
      this.addError(
        issues,
        'sellers',
        'The NavStreet offer form currently supports exactly one seller.'
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
        (
          party.legalName ||
          'This signer'
        ) +
          ' must complete identity verification.'
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
        (
          party.legalName ||
          'This signer'
        ) +
          ' must consent to electronic transactions.'
      );
    }
  }


  private validateProperty(
    terms: NorthCarolinaOfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    const property =
      terms.property;

    const requiredTextFields: Array<{
      value: string | undefined;
      path: string;
      message: string;
    }> = [
      {
        value: property.listingUid,
        path: 'property.listingUid',
        message:
          'A listing identifier is required.'
      },
      {
        value: property.addressLine1,
        path: 'property.addressLine1',
        message:
          'The property street address is required.'
      },
      {
        value: property.city,
        path: 'property.city',
        message:
          'The property city is required.'
      },
      {
        value: property.state,
        path: 'property.state',
        message:
          'The property state is required.'
      },
      {
        value: property.zipCode,
        path: 'property.zipCode',
        message:
          'The property ZIP code is required.'
      },
      {
        value: property.county,
        path: 'property.county',
        message:
          'The property county is required.'
      }
    ];

    requiredTextFields.forEach(
      field => {
        if (!this.hasText(field.value)) {
          this.addError(
            issues,
            field.path,
            field.message
          );
        }
      }
    );

    if (
      property.state.toUpperCase() !==
      terms.stateCode
    ) {
      this.addError(
        issues,
        'property.state',
        'The contract state must match the property state.'
      );
    }
  }


  private validatePropertyTerms(
    terms: NorthCarolinaOfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    const propertyTerms =
      terms.propertyTerms;

    if (
      propertyTerms
        .separatePropertyIncluded &&
      !this.hasText(
        propertyTerms
          .separatePropertyDescription
      )
    ) {
      this.addError(
        issues,
        'propertyTerms.separatePropertyDescription',
        'Describe the separate property included in the purchase.'
      );
    }
  }


  private validatePurchaseTerms(
    terms: NorthCarolinaOfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    const purchase =
      terms.purchase;

    if (
      !this.isPositiveMoney(
        purchase.purchasePriceInCents
      )
    ) {
      this.addError(
        issues,
        'purchase.purchasePriceInCents',
        'The purchase price must be greater than zero.'
      );
    }

    if (
      purchase.financingType !== 'cash' &&
      purchase.financingType !== 'loan'
    ) {
      this.addError(
        issues,
        'purchase.financingType',
        'Select cash or loan.'
      );
    }

    if (
      purchase
        .otherPropertyWillFundPurchase &&
      !this.hasText(
        purchase.otherPropertyDescription
      )
    ) {
      this.addError(
        issues,
        'purchase.otherPropertyDescription',
        'Identify the other property expected to fund this purchase.'
      );
    }
  }


  private validateDeposits(
    terms: NorthCarolinaOfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    const deposits =
      terms.deposits;

    this.validateRequiredMoney(
      deposits.depositInCents,
      'deposits.depositInCents',
      'The Deposit cannot be negative.',
      issues
    );

    if (
      !Number.isInteger(
        deposits.depositDeliveryDays
      ) ||
      deposits.depositDeliveryDays < 1 ||
      deposits.depositDeliveryDays > 30
    ) {
      this.addError(
        issues,
        'deposits.depositDeliveryDays',
        'Enter a Deposit delivery period from 1 to 30 calendar days.'
      );
    }

    if (
      deposits.escrowAgentName.trim().length > 200
    ) {
      this.addError(
        issues,
        'deposits.escrowAgentName',
        'The escrow-agent name cannot exceed 200 characters.'
      );
    }

    if (
      deposits.dueDiligenceDeadlineType ===
        'specific_date'
    ) {
      if (
        !this.isValidDate(
          deposits.dueDiligenceEndDate
        )
      ) {
        this.addError(
          issues,
          'deposits.dueDiligenceEndDate',
          'Enter a valid due-diligence end date.'
        );
      }
    } else if (
      deposits.dueDiligenceDeadlineType ===
        'days_after_effective_date'
    ) {
      const days =
        deposits
          .dueDiligenceDaysAfterEffectiveDate;

      if (
        !Number.isInteger(days) ||
        (days ?? 0) <= 0 ||
        (days ?? 0) > 365
      ) {
        this.addError(
          issues,
          'deposits.dueDiligenceDaysAfterEffectiveDate',
          'Enter a due-diligence period between 1 and 365 days.'
        );
      }
    } else {
      this.addError(
        issues,
        'deposits.dueDiligenceDeadlineType',
        'Select a due-diligence deadline.'
      );
    }

    if (
      deposits.dueDiligenceEndTime !==
        '17:00'
    ) {
      this.addError(
        issues,
        'deposits.dueDiligenceEndTime',
        'The due-diligence deadline must use 5:00 p.m.'
      );
    }
  }


  private validateConcessions(
    terms: NorthCarolinaOfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    const concessions =
      terms.concessions;

    if (
      concessions.concessionType ===
        'amount'
    ) {
      if (
        concessions
          .sellerConcessionInCents ===
            undefined ||
        !this.isPositiveMoney(
          concessions
            .sellerConcessionInCents
        )
      ) {
        this.addError(
          issues,
          'concessions.sellerConcessionInCents',
          'Enter a seller-concession amount greater than zero.'
        );
      }
    } else if (
      concessions.concessionType ===
        'percentage'
    ) {
      const percentage =
        concessions
          .sellerConcessionPercentage;

      if (
        typeof percentage !== 'number' ||
        !Number.isFinite(percentage) ||
        percentage <= 0 ||
        percentage > 100
      ) {
        this.addError(
          issues,
          'concessions.sellerConcessionPercentage',
          'Enter a seller-concession percentage greater than 0 and no more than 100.'
        );
      }
    } else if (
      concessions.concessionType !==
        'none'
    ) {
      this.addError(
        issues,
        'concessions.concessionType',
        'Select a valid seller-concession type.'
      );
    }

    if (
      concessions.homeWarrantyRequested
    ) {
      if (
        concessions.homeWarrantyInCents ===
          undefined ||
        !this.isPositiveMoney(
          concessions.homeWarrantyInCents
        )
      ) {
        this.addError(
          issues,
          'concessions.homeWarrantyInCents',
          'Enter a home-warranty amount greater than zero.'
        );
      }
    } else {
      this.validateOptionalMoney(
        concessions.homeWarrantyInCents,
        'concessions.homeWarrantyInCents',
        issues
      );
    }
  }


  private validateSettlement(
    terms: NorthCarolinaOfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    const settlement =
      terms.settlement;

    if (
      !this.isValidDate(
        settlement.settlementDate
      )
    ) {
      this.addError(
        issues,
        'settlement.settlementDate',
        'Enter a valid settlement date.'
      );
    }

    if (
      settlement.possessionTiming !==
        'at_closing' &&
      settlement.possessionTiming !==
        'other'
    ) {
      this.addError(
        issues,
        'settlement.possessionTiming',
        'Select when possession will be delivered.'
      );
    }

    if (
      settlement.possessionTiming ===
        'other' &&
      !this.hasText(
        settlement
          .possessionAgreementDocumentUid
      )
    ) {
      this.addError(
        issues,
        'settlement.possessionAgreementDocumentUid',
        'Attach the separate possession agreement.'
      );
    }
  }


  private validateBuyerDisclosures(
    terms: NorthCarolinaOfferTerms,
    context: OfferValidationContext,
    issues: OfferValidationIssue[]
  ): void {
    if (context.mode === 'draft') {
      return;
    }

    this.validateDisclosureReceipt(
      terms
        .buyerDisclosures
        .residentialProperty,
      'buyerDisclosures.residentialProperty',
      'Residential Property and Owners Association Disclosure Statement',
      issues
    );

    this.validateDisclosureReceipt(
      terms
        .buyerDisclosures
        .mineralOilGasRights,
      'buyerDisclosures.mineralOilGasRights',
      'Mineral and Oil and Gas Rights Mandatory Disclosure Statement',
      issues
    );
  }


  private validateDisclosureReceipt(
    receipt:
      NorthCarolinaOfferTerms[
        'buyerDisclosures'
      ][
        'residentialProperty'
      ],
    fieldPath: string,
    title: string,
    issues: OfferValidationIssue[]
  ): void {
    if (
      receipt.status !== 'received' &&
      receipt.status !== 'not_received' &&
      receipt.status !== 'exempt'
    ) {
      this.addError(
        issues,
        fieldPath + '.status',
        'Select the status of the ' +
          title + '.'
      );
    }

    if (!receipt.acknowledged) {
      this.addError(
        issues,
        fieldPath + '.acknowledged',
        'Acknowledge the ' +
          title + ' selection.'
      );
    }

    if (
      receipt.status === 'exempt' &&
      !this.hasText(receipt.exemptionReason)
    ) {
      this.addError(
        issues,
        fieldPath + '.exemptionReason',
        'Enter the reason this sale is exempt from the ' +
          title + '.'
      );
    }
  }


  private validateSellerStatements(
    terms: NorthCarolinaOfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    const statements =
      terms.sellerStatements;

    if (
      statements.leadBasedPaintApplies &&
      !this.hasText(
        statements
          .leadBasedPaintDisclosureDocumentUid
      )
    ) {
      this.addError(
        issues,
        'sellerStatements.leadBasedPaintDisclosureDocumentUid',
        'Attach the lead-based-paint disclosure.'
      );
    }

    if (
      statements.ownersAssociationApplies
    ) {
      if (
        !this.hasText(
          statements.ownersAssociationName
        )
      ) {
        this.addError(
          issues,
          'sellerStatements.ownersAssociationName',
          'Enter the owners association name.'
        );
      }

      this.validateOptionalMoney(
        statements
          .ownersAssociationDuesInCents,
        'sellerStatements.ownersAssociationDuesInCents',
        issues
      );
    }

    if (
      statements.fuelTankPresent &&
      statements.fuelTankOwnership !==
        'owned' &&
      statements.fuelTankOwnership !==
        'leased'
    ) {
      this.addError(
        issues,
        'sellerStatements.fuelTankOwnership',
        'Specify whether the fuel tank is owned or leased.'
      );
    }

    if (
      statements.leasesExist &&
      !this.hasText(
        statements
          .leaseAddendumDocumentUid
      )
    ) {
      this.addError(
        issues,
        'sellerStatements.leaseAddendumDocumentUid',
        'Attach the applicable lease addendum.'
      );
    }
  }


  private validateAddenda(
    terms: NorthCarolinaOfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    terms.addenda.forEach(
      (addendum, index) => {
        if (!addendum.included) {
          return;
        }

        const fieldPath =
          'addenda.' + index;

        if (!this.hasText(addendum.title)) {
          this.addError(
            issues,
            fieldPath + '.title',
            'An included addendum needs a title.'
          );
        }

        if (
          !this.hasText(
            addendum.documentUid
          )
        ) {
          this.addError(
            issues,
            fieldPath + '.documentUid',
            'An included addendum needs a document.'
          );
        }
      }
    );
  }


  private validateAdditionalTerms(
    terms: NorthCarolinaOfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    const exhibit =
      terms.additionalTermsExhibit;

    if (!exhibit.included) {
      return;
    }

    if (
      exhibit.preparedBy !== 'buyer' &&
      exhibit.preparedBy !== 'seller' &&
      exhibit.preparedBy !== 'attorney'
    ) {
      this.addError(
        issues,
        'additionalTermsExhibit.preparedBy',
        'Select who prepared the additional terms.'
      );
    }

    if (!this.hasText(exhibit.documentUid)) {
      this.addError(
        issues,
        'additionalTermsExhibit.documentUid',
        'Attach the additional-terms exhibit.'
      );
    }
  }


  private validateDelivery(
    terms: NorthCarolinaOfferTerms,
    context: OfferValidationContext,
    issues: OfferValidationIssue[]
  ): void {
    const delivery =
      terms.delivery;

    if (
      !this.isValidDateTime(
        delivery.expiresAt
      )
    ) {
      this.addError(
        issues,
        'delivery.expiresAt',
        'Enter a valid offer expiration date and time.'
      );
    }

    if (
      !this.isValidEmail(
        delivery.buyerDeliveryEmail
      )
    ) {
      this.addError(
        issues,
        'delivery.buyerDeliveryEmail',
        'A valid buyer delivery email is required.'
      );
    }

    if (
      !this.isValidEmail(
        delivery.sellerDeliveryEmail
      )
    ) {
      this.addError(
        issues,
        'delivery.sellerDeliveryEmail',
        'A valid seller delivery email is required.'
      );
    }

    if (
      delivery.timeZone !==
        'America/New_York'
    ) {
      this.addError(
        issues,
        'delivery.timeZone',
        'The offer must use North Carolina time.'
      );
    }

    if (
      context.mode !== 'draft' &&
      !delivery.electronicDeliveryAuthorized
    ) {
      this.addError(
        issues,
        'delivery.electronicDeliveryAuthorized',
        'Electronic delivery must be authorized before submission.'
      );
    }

    const currentDateTime =
      context.currentDateTime ??
      new Date();

    const expiration =
      this.parseDate(
        delivery.expiresAt
      );

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
  }


  private validateChronology(
    terms: NorthCarolinaOfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    const expiration =
      this.parseDate(
        terms.delivery.expiresAt
      );

    const settlement =
      this.parseDate(
        terms.settlement.settlementDate
      );

    if (
      expiration &&
      settlement &&
      expiration.getTime() >=
        settlement.getTime() +
          12 * 60 * 60 * 1000
    ) {
      this.addError(
        issues,
        'delivery.expiresAt',
        'The offer must expire before the proposed settlement date.'
      );
    }

    if (
      terms.deposits
        .dueDiligenceDeadlineType ===
          'specific_date'
    ) {
      const dueDiligenceDate =
        this.parseDate(
          terms.deposits
            .dueDiligenceEndDate
        );

      if (
        dueDiligenceDate &&
        settlement &&
        dueDiligenceDate.getTime() >=
          settlement.getTime()
      ) {
        this.addError(
          issues,
          'deposits.dueDiligenceEndDate',
          'The due-diligence period must end before settlement.'
        );
      }
    }
  }


  private validateRequiredMoney(
    value: MoneyInCents,
    fieldPath: string,
    message: string,
    issues: OfferValidationIssue[]
  ): void {
    if (!this.isNonNegativeMoney(value)) {
      this.addError(
        issues,
        fieldPath,
        message
      );
    }
  }


  private validateOptionalMoney(
    value: MoneyInCents | undefined,
    fieldPath: string,
    issues: OfferValidationIssue[]
  ): void {
    if (
      value !== undefined &&
      !this.isNonNegativeMoney(value)
    ) {
      this.addError(
        issues,
        fieldPath,
        'The amount cannot be negative.'
      );
    }
  }


  private isPositiveMoney(
    value: MoneyInCents
  ): boolean {
    return (
      Number.isInteger(value) &&
      value > 0
    );
  }


  private isNonNegativeMoney(
    value: MoneyInCents
  ): boolean {
    return (
      Number.isInteger(value) &&
      value >= 0
    );
  }


  private isValidDate(
    value: OfferDate | undefined
  ): boolean {
    if (
      !value ||
      !/^\d{4}-\d{2}-\d{2}$/.test(
        value
      )
    ) {
      return false;
    }

    const parsed =
      new Date(
        value + 'T12:00:00Z'
      );

    return (
      !Number.isNaN(
        parsed.getTime()
      ) &&
      parsed
        .toISOString()
        .slice(0, 10) === value
    );
  }


  private isValidDateTime(
    value: OfferDateTime | undefined
  ): boolean {
    if (
      !value ||
      !/(Z|[+-]\d{2}:\d{2})$/.test(
        value
      )
    ) {
      return false;
    }

    return this.parseDate(value) !== null;
  }


  private parseDate(
    value: string | undefined
  ): Date | null {
    if (!value) {
      return null;
    }

    const dateValue =
      /^\d{4}-\d{2}-\d{2}$/.test(
        value
      )
        ? value + 'T12:00:00Z'
        : value;

    const parsed =
      new Date(dateValue);

    return Number.isNaN(
      parsed.getTime()
    )
      ? null
      : parsed;
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
      severity: 'error'
    });
  }
}
