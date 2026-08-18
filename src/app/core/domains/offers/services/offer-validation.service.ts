import {
  Injectable
} from '@angular/core';

import {
  OfferParty
} from '../models/offer-party.model';

import {
  MoneyInCents,
  OfferDate,
  OfferDateTime,
  OfferTerms
} from '../models/offer-terms.model';


export type OfferValidationSeverity =
  | 'error'
  | 'warning';


export interface OfferValidationIssue {
  fieldPath: string;

  message: string;

  severity: OfferValidationSeverity;
}


export interface OfferValidationResult {
  valid: boolean;

  errors: OfferValidationIssue[];
  warnings: OfferValidationIssue[];
}


export interface OfferValidationContext {
  mode:
    | 'draft'
    | 'submit'
    | 'counteroffer'
    | 'signature';

  currentUserUid?: string;
  currentDateTime?: Date;
}


@Injectable({
  providedIn: 'root'
})
export class OfferValidationService {

  validate(
    terms: OfferTerms,
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

    this.validatePurchaseTerms(
      terms,
      issues
    );

    this.validateExistingPropertySale(
      terms,
      issues
    );

    this.validateDeposits(
      terms,
      issues
    );

    this.validateInvestigations(
      terms,
      issues
    );

    this.validateConcessions(
      terms,
      issues
    );

    this.validatePropertyInclusions(
      terms,
      issues
    );

    this.validateSettlement(
      terms,
      issues
    );

    this.validateDisclosuresAndAddenda(
      terms,
      context,
      issues
    );

    this.validateAdditionalTerms(
      terms,
      context,
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

    const errors = issues.filter(
      issue =>
        issue.severity === 'error'
    );

    const warnings = issues.filter(
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
    terms: OfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    if (!this.hasText(terms.stateCode)) {
      this.addError(
        issues,
        'stateCode',
        'A state contract jurisdiction is required.'
      );

      return;
    }

    if (!/^[A-Z]{2}$/.test(terms.stateCode)) {
      this.addError(
        issues,
        'stateCode',
        'The state code must contain two uppercase letters.'
      );
    }
  }


  private validateParties(
    buyers: OfferParty[],
    sellers: OfferParty[],
    context: OfferValidationContext,
    issues: OfferValidationIssue[]
  ): void {
    if (buyers.length === 0) {
      this.addError(
        issues,
        'buyers',
        'At least one buyer is required.'
      );
    }

    if (sellers.length === 0) {
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
          `buyers.${index}`,
          context,
          issues
        )
    );

    sellers.forEach(
      (seller, index) =>
        this.validateParty(
          seller,
          `sellers.${index}`,
          context,
          issues
        )
    );

    const buyerEmails =
      buyers.map(
        buyer =>
          buyer.email
            .trim()
            .toLowerCase()
      );

    if (
      new Set(buyerEmails).size !==
      buyerEmails.length
    ) {
      this.addError(
        issues,
        'buyers',
        'Every buyer must use a separate email address.'
      );
    }

    const sellerEmails =
      sellers.map(
        seller =>
          seller.email
            .trim()
            .toLowerCase()
      );

    if (
      new Set(sellerEmails).size !==
      sellerEmails.length
    ) {
      this.addError(
        issues,
        'sellers',
        'Every seller must use a separate email address.'
      );
    }
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
        `${fieldPath}.legalName`,
        'A legal name is required.'
      );
    }

    if (!this.isValidEmail(party.email)) {
      this.addError(
        issues,
        `${fieldPath}.email`,
        'A valid email address is required.'
      );
    }

    if (!this.hasText(party.phone)) {
      this.addError(
        issues,
        `${fieldPath}.phone`,
        'A phone number is required.'
      );
    }

    if (
      !this.hasText(
        party.mailingAddress.addressLine1
      )
    ) {
      this.addError(
        issues,
        `${fieldPath}.mailingAddress.addressLine1`,
        'A mailing address is required.'
      );
    }

    if (
      !this.hasText(
        party.mailingAddress.city
      )
    ) {
      this.addError(
        issues,
        `${fieldPath}.mailingAddress.city`,
        'A city is required.'
      );
    }

    if (
      !this.hasText(
        party.mailingAddress.state
      )
    ) {
      this.addError(
        issues,
        `${fieldPath}.mailingAddress.state`,
        'A state is required.'
      );
    }

    if (
      !this.hasText(
        party.mailingAddress.zipCode
      )
    ) {
      this.addError(
        issues,
        `${fieldPath}.mailingAddress.zipCode`,
        'A ZIP code is required.'
      );
    }

    if (
      (
        context.mode === 'signature' ||
        context.mode === 'submit'
      ) &&
      party.signature.required &&
      party.identityVerification.status !==
      'verified'
    ) {
      this.addError(
        issues,
        `${fieldPath}.identityVerification`,
        `${party.legalName || 'This signer'} must complete identity verification before signing.`
      );
    }

    if (
      context.mode === 'signature' &&
      !party
        .electronicTransactionsConsentAccepted
    ) {
      this.addError(
        issues,
        `${fieldPath}.electronicTransactionsConsentAccepted`,
        `${party.legalName || 'This signer'} must consent to electronic transactions.`
      );
    }
  }


  private validateProperty(
    terms: OfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    const property = terms.property;

    if (!this.hasText(property.listingUid)) {
      this.addError(
        issues,
        'property.listingUid',
        'A listing identifier is required.'
      );
    }

    if (!this.hasText(property.addressLine1)) {
      this.addError(
        issues,
        'property.addressLine1',
        'The property street address is required.'
      );
    }

    if (!this.hasText(property.city)) {
      this.addError(
        issues,
        'property.city',
        'The property city is required.'
      );
    }

    if (!this.hasText(property.state)) {
      this.addError(
        issues,
        'property.state',
        'The property state is required.'
      );
    }

    if (!this.hasText(property.zipCode)) {
      this.addError(
        issues,
        'property.zipCode',
        'The property ZIP code is required.'
      );
    }

    if (!this.hasText(property.county)) {
      this.addError(
        issues,
        'property.county',
        'The property county is required.'
      );
    }

    if (
      property.state.toUpperCase() !==
      terms.stateCode.toUpperCase()
    ) {
      this.addError(
        issues,
        'property.state',
        'The contract jurisdiction must match the property state.'
      );
    }
  }


  private validatePurchaseTerms(
    terms: OfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    const purchase = terms.purchase;

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
      purchase.financingType ===
      'financing'
    ) {
      if (
        purchase.loanType ===
        'not_applicable'
      ) {
        this.addError(
          issues,
          'purchase.loanType',
          'Select the proposed loan type.'
        );
      }

      if (
        purchase.loanType === 'other' &&
        !this.hasText(
          purchase.otherLoanTypeDescription
        )
      ) {
        this.addError(
          issues,
          'purchase.otherLoanTypeDescription',
          'Describe the proposed loan type.'
        );
      }

      if (
        purchase
          .proposedLoanAmountInCents ===
          undefined ||
        !this.isPositiveMoney(
          purchase.proposedLoanAmountInCents
        )
      ) {
        this.addError(
          issues,
          'purchase.proposedLoanAmountInCents',
          'Enter the proposed loan amount.'
        );
      }
    }

    if (
      purchase.financingType === 'cash' &&
      !purchase.proofOfFundsProvided
    ) {
      this.addWarning(
        issues,
        'purchase.proofOfFundsProvided',
        'A cash offer without proof of funds may be less persuasive to the seller.'
      );
    }

    if (
      purchase.financingType ===
        'financing' &&
      !purchase.preapprovalProvided
    ) {
      this.addWarning(
        issues,
        'purchase.preapprovalProvided',
        'A financed offer without a preapproval letter may be less persuasive to the seller.'
      );
    }

    this.validateOptionalMoney(
      purchase.proposedLoanAmountInCents,
      'purchase.proposedLoanAmountInCents',
      issues
    );

    this.validateOptionalMoney(
      purchase.proposedDownPaymentInCents,
      'purchase.proposedDownPaymentInCents',
      issues
    );

    this.validateOptionalMoney(
      purchase.proposedCashContributionInCents,
      'purchase.proposedCashContributionInCents',
      issues
    );
  }


  private validateExistingPropertySale(
    terms: OfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    const sale =
      terms.existingPropertySale;

    if (!sale.required) {
      return;
    }

    if (!this.hasText(sale.propertyAddress)) {
      this.addError(
        issues,
        'existingPropertySale.propertyAddress',
        'Enter the address of the property the buyer must sell.'
      );
    }

    if (
      sale.status === 'not_applicable'
    ) {
      this.addError(
        issues,
        'existingPropertySale.status',
        'Select the current status of the buyer’s property.'
      );
    }
  }


  private validateDeposits(
    terms: OfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    const deposits = terms.deposits;

    this.validateRequiredMoney(
      deposits.dueDiligenceFeeInCents,
      'deposits.dueDiligenceFeeInCents',
      'The due-diligence fee cannot be negative.',
      issues
    );

    this.validateRequiredMoney(
      deposits.initialEarnestMoneyInCents,
      'deposits.initialEarnestMoneyInCents',
      'The initial earnest-money deposit cannot be negative.',
      issues
    );

    this.validateRequiredMoney(
      deposits.additionalEarnestMoneyInCents,
      'deposits.additionalEarnestMoneyInCents',
      'The additional earnest-money deposit cannot be negative.',
      issues
    );

    if (
      !this.isValidDateTime(
        deposits
          .dueDiligenceFeeDeliveryDeadline
      )
    ) {
      this.addError(
        issues,
        'deposits.dueDiligenceFeeDeliveryDeadline',
        'Enter a valid due-diligence fee delivery deadline.'
      );
    }

    if (
      !this.isValidDateTime(
        deposits.dueDiligenceExpiration
      )
    ) {
      this.addError(
        issues,
        'deposits.dueDiligenceExpiration',
        'Enter a valid due-diligence expiration date and time.'
      );
    }

    if (
      !this.isValidDateTime(
        deposits
          .initialEarnestMoneyDeliveryDeadline
      )
    ) {
      this.addError(
        issues,
        'deposits.initialEarnestMoneyDeliveryDeadline',
        'Enter a valid initial earnest-money delivery deadline.'
      );
    }

    if (
      deposits.additionalEarnestMoneyInCents >
        0 &&
      !this.isValidDateTime(
        deposits
          .additionalEarnestMoneyDeliveryDeadline
      )
    ) {
      this.addError(
        issues,
        'deposits.additionalEarnestMoneyDeliveryDeadline',
        'Enter a valid additional earnest-money delivery deadline.'
      );
    }

    if (!this.hasText(deposits.escrowAgentName)) {
      this.addError(
        issues,
        'deposits.escrowAgentName',
        'An escrow agent is required.'
      );
    }
  }


  private validateInvestigations(
    terms: OfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    const investigations =
      terms.investigations;

    if (
      investigations
        .otherInvestigationRequested &&
      !this.hasText(
        investigations
          .otherInvestigationDescription
      )
    ) {
      this.addError(
        issues,
        'investigations.otherInvestigationDescription',
        'Describe the additional investigation.'
      );
    }
  }


  private validateConcessions(
    terms: OfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    const concessions =
      terms.concessions;

    this.validateRequiredMoney(
      concessions
        .sellerPaidBuyerExpensesInCents,
      'concessions.sellerPaidBuyerExpensesInCents',
      'Seller-paid expenses cannot be negative.',
      issues
    );

    this.validateRequiredMoney(
      concessions.homeWarrantyInCents,
      'concessions.homeWarrantyInCents',
      'The home-warranty amount cannot be negative.',
      issues
    );

    this.validateRequiredMoney(
      concessions
        .buyerAgentCompensationInCents,
      'concessions.buyerAgentCompensationInCents',
      'Buyer-agent compensation cannot be negative.',
      issues
    );

    this.validateRequiredMoney(
      concessions.otherConcessionInCents,
      'concessions.otherConcessionInCents',
      'The other concession amount cannot be negative.',
      issues
    );

    if (
      concessions
        .sellerPaidBuyerExpensesRequested &&
      concessions
        .sellerPaidBuyerExpensesInCents === 0
    ) {
      this.addError(
        issues,
        'concessions.sellerPaidBuyerExpensesInCents',
        'Enter the requested seller-paid expense amount.'
      );
    }

    if (
      concessions.homeWarrantyRequested &&
      concessions.homeWarrantyInCents === 0
    ) {
      this.addError(
        issues,
        'concessions.homeWarrantyInCents',
        'Enter the requested home-warranty amount.'
      );
    }

    if (
      concessions.otherConcessionRequested &&
      !this.hasText(
        concessions
          .otherConcessionDescription
      )
    ) {
      this.addError(
        issues,
        'concessions.otherConcessionDescription',
        'Describe the requested concession.'
      );
    }
  }


  private validatePropertyInclusions(
    terms: OfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    const inclusions =
      terms.propertyInclusions;

    if (
      inclusions
        .additionalPersonalPropertyRequested &&
      !this.hasText(
        inclusions
          .additionalPersonalPropertyDescription
      )
    ) {
      this.addError(
        issues,
        'propertyInclusions.additionalPersonalPropertyDescription',
        'Describe the requested personal property.'
      );
    }

    if (
      inclusions.leasedEquipmentPresent &&
      !inclusions
        .leasedEquipmentObligationsAccepted
    ) {
      this.addWarning(
        issues,
        'propertyInclusions.leasedEquipmentObligationsAccepted',
        'The parties must determine how leased-equipment obligations will be handled.'
      );
    }
  }


  private validateSettlement(
    terms: OfferTerms,
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
      !this.isValidDate(
        settlement.closingDate
      )
    ) {
      this.addError(
        issues,
        'settlement.closingDate',
        'Enter a valid closing date.'
      );
    }

    if (
      !this.hasText(
        settlement.proposedDeedName
      )
    ) {
      this.addError(
        issues,
        'settlement.proposedDeedName',
        'Enter the proposed deed recipient name.'
      );
    }

    if (
      settlement.possessionTiming !==
        'at_closing' &&
      !this.isValidDate(
        settlement.possessionDate
      )
    ) {
      this.addError(
        issues,
        'settlement.possessionDate',
        'Enter the proposed possession date.'
      );
    }

    if (
      settlement.possessionTiming !==
        'at_closing' &&
      !this.hasText(
        settlement.possessionTime
      )
    ) {
      this.addError(
        issues,
        'settlement.possessionTime',
        'Enter the proposed possession time.'
      );
    }
  }


  private validateDisclosuresAndAddenda(
    terms: OfferTerms,
    context: OfferValidationContext,
    issues: OfferValidationIssue[]
  ): void {
    if (context.mode === 'draft') {
      return;
    }

    terms.disclosures
      .filter(
        disclosure =>
          disclosure.required
      )
      .forEach(
        disclosure => {
          if (!disclosure.received) {
            this.addError(
              issues,
              `disclosures.${disclosure.disclosureUid}.received`,
              `${disclosure.title} must be received before submission.`
            );
          }

          if (!disclosure.acknowledged) {
            this.addError(
              issues,
              `disclosures.${disclosure.disclosureUid}.acknowledged`,
              `${disclosure.title} must be acknowledged before submission.`
            );
          }
        }
      );

    terms.addenda
      .filter(
        addendum =>
          addendum.required
      )
      .forEach(
        addendum => {
          if (!addendum.selected) {
            this.addError(
              issues,
              `addenda.${addendum.addendumUid}`,
              `${addendum.title} is required for this offer.`
            );
          }
        }
      );
  }


  private validateAdditionalTerms(
    terms: OfferTerms,
    context: OfferValidationContext,
    issues: OfferValidationIssue[]
  ): void {
    terms.additionalTermRequests.forEach(
      request => {
        if (
          !this.hasText(
            request.plainLanguageRequest
          )
        ) {
          this.addError(
            issues,
            `additionalTermRequests.${request.Uid}.plainLanguageRequest`,
            'Describe the requested additional term.'
          );
        }

        if (
          context.mode !== 'draft' &&
          (
            request.resolution ===
              'pending_review' ||
            request.resolution ===
              'attorney_language_required'
          )
        ) {
          this.addError(
            issues,
            `additionalTermRequests.${request.Uid}.resolution`,
            'This additional term must be resolved before the offer can be submitted.'
          );
        }

        if (
          request.resolution ===
            'attorney_language_received' &&
          (
            !request.approvedByBuyer ||
            !request.approvedBySeller
          )
        ) {
          this.addError(
            issues,
            `additionalTermRequests.${request.Uid}`,
            'Attorney-prepared language must be approved by both parties.'
          );
        }
      }
    );
  }


  private validateDelivery(
    terms: OfferTerms,
    context: OfferValidationContext,
    issues: OfferValidationIssue[]
  ): void {
    const delivery = terms.delivery;

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
        'Enter a valid buyer delivery email.'
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
        'Enter a valid seller delivery email.'
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
    terms: OfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    const offerExpiration =
      this.parseDate(
        terms.delivery.expiresAt
      );

    const dueDiligenceExpiration =
      this.parseDate(
        terms.deposits
          .dueDiligenceExpiration
      );

    const settlementDate =
      this.parseDate(
        terms.settlement.settlementDate
      );

    const closingDate =
      this.parseDate(
        terms.settlement.closingDate
      );

    if (
      offerExpiration &&
      dueDiligenceExpiration &&
      offerExpiration.getTime() >=
        dueDiligenceExpiration.getTime()
    ) {
      this.addError(
        issues,
        'delivery.expiresAt',
        'The offer must expire before the proposed due-diligence period ends.'
      );
    }

    if (
      dueDiligenceExpiration &&
      settlementDate &&
      dueDiligenceExpiration.getTime() >=
        settlementDate.getTime()
    ) {
      this.addError(
        issues,
        'deposits.dueDiligenceExpiration',
        'The due-diligence period must end before settlement.'
      );
    }

    if (
      settlementDate &&
      closingDate &&
      closingDate.getTime() <
        settlementDate.getTime()
    ) {
      this.addError(
        issues,
        'settlement.closingDate',
        'The closing date cannot occur before settlement.'
      );
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

    return this.parseDate(value) !== null;
  }


  private isValidDateTime(
    value: OfferDateTime | undefined
  ): boolean {
    if (!value) {
      return false;
    }

    /*
     * A deadline must include an explicit UTC offset or Z
     * suffix so it cannot be interpreted differently by
     * buyers, sellers or backend Functions.
     */
    if (
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

    const parsed = new Date(value);

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
    if (!value) {
      return false;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      value.trim()
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


  private addWarning(
    issues: OfferValidationIssue[],
    fieldPath: string,
    message: string
  ): void {
    issues.push({
      fieldPath,
      message,
      severity: 'warning'
    });
  }
}