import type {
  OfferParty,
} from '../../../../../core/domains/offers/models/offer-party.model';

import type {
  OfferValidationContext,
  OfferValidationIssue,
  OfferValidationResult,
} from '../../../../../core/domains/offers/models/offer-validation.model';

import type {
  StateOfferValidator,
} from '../../../../../core/domains/offers/state-contracts/state-offer-validator';

import type {
  OfferQuestionDefinition,
  OfferQuestionVisibilityRule,
} from '../../../engine/models/offer-question-definition';

import {
  getTexasContractSections,
} from '../contracts/texas-contract-sections';

import {
  TEXAS_CONTRACT_DEFINITIONS,
} from '../../../../../core/domains/offers/state-contracts/texas/models/texas-contract-type.model';

import type {
  TexasOfferTerms,
} from '../../../../../core/domains/offers/state-contracts/texas/models/texas-offer-terms.model';


export class TexasOfferValidator
implements StateOfferValidator<TexasOfferTerms> {
  readonly stateCode = 'TX' as const;


  validate(
    terms: TexasOfferTerms,
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

    this.validateQuestions(
      terms,
      issues
    );

    this.validateSalesPrice(
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
    terms: TexasOfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    if (terms.stateCode !== 'TX') {
      this.addError(
        issues,
        'stateCode',
        'The Texas offer must use state code TX.'
      );
    }

    const definition =
      TEXAS_CONTRACT_DEFINITIONS[
        terms.contractType
      ];

    if (
      terms.form.formId !==
        definition.formId ||
      terms.form.formName !==
        definition.formName ||
      terms.form.effectiveDate !==
        definition.effectiveDate ||
      terms.form.revisionDate !==
        definition.revisionDate
    ) {
      this.addError(
        issues,
        'form',
        `The offer does not use the supported TREC ${definition.formId} form version.`
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

    const identityCheckApplies =
      context.mode === 'signature' &&
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
        `${fieldPath}.identityVerification`,
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
        `${fieldPath}.electronicTransactionsConsentAccepted`,
        'Consent to electronic transactions is required before signing.'
      );
    }
  }


  private validateProperty(
    terms: TexasOfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    const property = terms.property;

    const requiredText = [
      ['listingUid', property.listingUid],
      ['addressLine1', property.addressLine1],
      ['city', property.city],
      ['state', property.state],
      ['zipCode', property.zipCode],
      ['county', property.county],
      ['propertyType', property.propertyType],
    ] as const;

    for (const [fieldName, value] of requiredText) {
      if (!this.hasText(value)) {
        this.addError(
          issues,
          `property.${fieldName}`,
          'This property value is required.'
        );
      }
    }

    if (
      property.state
        .trim()
        .toUpperCase() !== 'TX'
    ) {
      this.addError(
        issues,
        'property.state',
        'The property snapshot must identify Texas.'
      );
    }

    if (
      !Number.isSafeInteger(
        property.listPriceInCents
      ) ||
      property.listPriceInCents <= 0
    ) {
      this.addError(
        issues,
        'property.listPriceInCents',
        'The property must have a valid list price.'
      );
    }
  }


  private validateQuestions(
    terms: TexasOfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    const sections =
      getTexasContractSections(
        terms.contractType
      );

    for (const section of sections) {
      if (
        section.visibleWhen &&
        !this.matchesVisibilityRule(
          terms,
          section.visibleWhen
        )
      ) {
        continue;
      }

      for (const question of section.questions) {
        this.validateQuestion(
          terms,
          question,
          issues
        );
      }
    }
  }


  private validateQuestion(
    terms: TexasOfferTerms,
    question: OfferQuestionDefinition,
    issues: OfferValidationIssue[]
  ): void {
    if (
      !question.fieldPath
    ) {
      return;
    }

    if (
      question.visibleWhen &&
      !this.matchesVisibilityRule(
        terms,
        question.visibleWhen
      )
    ) {
      return;
    }

    const value = this.readFieldPath(
      terms,
      question.fieldPath
    );

    const validation = question.validation;

    if (
      validation?.required &&
      this.isMissingQuestionValue(
        value,
        question
      )
    ) {
      this.addError(
        issues,
        question.fieldPath,
        validation.message ??
          `${question.label} is required.`
      );

      return;
    }

    if (this.isEmpty(value)) {
      return;
    }

    if (
      typeof value === 'number'
    ) {
      if (
        validation?.minimum !== undefined &&
        value < validation.minimum
      ) {
        this.addError(
          issues,
          question.fieldPath,
          validation.message ??
            `${question.label} must be at least ${validation.minimum}.`
        );
      }

      if (
        validation?.maximum !== undefined &&
        value > validation.maximum
      ) {
        this.addError(
          issues,
          question.fieldPath,
          validation.message ??
            `${question.label} must not exceed ${validation.maximum}.`
        );
      }
    }

    if (typeof value === 'string') {
      const normalizedValue = value.trim();

      if (
        validation?.minimumLength !== undefined &&
        normalizedValue.length <
          validation.minimumLength
      ) {
        this.addError(
          issues,
          question.fieldPath,
          validation.message ??
            `${question.label} is too short.`
        );
      }

      if (
        validation?.maximumLength !== undefined &&
        normalizedValue.length >
          validation.maximumLength
      ) {
        this.addError(
          issues,
          question.fieldPath,
          validation.message ??
            `${question.label} is too long.`
        );
      }

      if (
        validation?.pattern &&
        !new RegExp(
          validation.pattern
        ).test(normalizedValue)
      ) {
        this.addError(
          issues,
          question.fieldPath,
          validation.message ??
            `${question.label} is invalid.`
        );
      }
    }
  }


  private validateSalesPrice(
    terms: TexasOfferTerms,
    issues: OfferValidationIssue[]
  ): void {
    const salesPrice = terms.salesPrice;

    if (
      !Number.isSafeInteger(
        salesPrice.salesPriceInCents
      ) ||
      salesPrice.salesPriceInCents <= 0
    ) {
      this.addError(
        issues,
        'salesPrice.salesPriceInCents',
        'The sales price must be greater than zero.'
      );
    }

    if (
      salesPrice.cashPortionInCents +
        salesPrice.financingInCents !==
      salesPrice.salesPriceInCents
    ) {
      this.addError(
        issues,
        'salesPrice',
        'The cash and financing portions must equal the sales price.'
      );
    }

    if (
      salesPrice.financingInCents > 0 &&
      salesPrice.financingAddenda.length < 1
    ) {
      this.addError(
        issues,
        'salesPrice.financingAddenda',
        'Select the financing addendum that applies to the financed portion.'
      );
    }
  }


  private validateDelivery(
    terms: TexasOfferTerms,
    context: OfferValidationContext,
    issues: OfferValidationIssue[]
  ): void {
    const delivery = terms.delivery;
    const expiration = new Date(
      delivery.expiresAt
    );

    if (
      !Number.isFinite(
        expiration.getTime()
      )
    ) {
      this.addError(
        issues,
        'delivery.expiresAt',
        'A valid offer expiration date and time is required.'
      );
    } else if (
      (
        context.mode === 'submit' ||
        context.mode === 'counteroffer'
      ) &&
      expiration.getTime() <=
        (
          context.currentDateTime ??
          new Date()
        ).getTime()
    ) {
      this.addError(
        issues,
        'delivery.expiresAt',
        'The offer expiration must be in the future.'
      );
    }

    if (!this.hasText(delivery.timeZone)) {
      this.addError(
        issues,
        'delivery.timeZone',
        'The property time zone is required.'
      );
    }

    if (
      (
        context.mode === 'submit' ||
        context.mode === 'counteroffer' ||
        context.mode === 'signature'
      ) &&
      delivery.electronicDeliveryAuthorized !==
        true
    ) {
      this.addError(
        issues,
        'delivery.electronicDeliveryAuthorized',
        'Electronic delivery authorization is required.'
      );
    }
  }


  private matchesVisibilityRule(
    terms: TexasOfferTerms,
    rule: OfferQuestionVisibilityRule
  ): boolean {
    const matches = rule.conditions.map(
      condition => {
        const actualValue =
          this.readFieldPath(
            terms,
            condition.fieldPath
          );

        switch (condition.operator) {
          case 'equals':
            return actualValue ===
              condition.value;

          case 'not_equals':
            return actualValue !==
              condition.value;

          case 'includes':
            return this.includesValue(
              actualValue,
              condition.value
            );

          case 'not_includes':
            return !this.includesValue(
              actualValue,
              condition.value
            );

          case 'is_empty':
            return this.isEmpty(
              actualValue
            );

          case 'is_not_empty':
            return !this.isEmpty(
              actualValue
            );

          case 'is_true':
            return actualValue === true;

          case 'is_false':
            return actualValue === false;
        }
      }
    );

    return rule.match === 'all'
      ? matches.every(Boolean)
      : matches.some(Boolean);
  }


  private includesValue(
    collection: unknown,
    expected: unknown
  ): boolean {
    if (typeof collection === 'string') {
      return collection.includes(
        String(expected ?? '')
      );
    }

    if (!Array.isArray(collection)) {
      return false;
    }

    return collection.some(
      item =>
        item === expected ||
        (
          this.isRecord(item) &&
          (
            item['formId'] === expected ||
            item['value'] === expected
          ) &&
          item['included'] !== false
        )
    );
  }


  private isMissingQuestionValue(
    value: unknown,
    question: OfferQuestionDefinition
  ): boolean {
    if (
      question.type === 'multiple_choice' &&
      question.objectSelection &&
      Array.isArray(value)
    ) {
      const selectedKey =
        question.objectSelection
          .selectedKey ?? 'included';

      return !value.some(
        item =>
          this.isRecord(item) &&
          item[selectedKey] === true
      );
    }

    return this.isEmpty(value);
  }


  private readFieldPath(
    source: unknown,
    fieldPath: string
  ): unknown {
    let current: unknown = source;

    for (const segment of fieldPath.split('.')) {
      if (!this.isRecord(current)) {
        return undefined;
      }

      current = current[segment];
    }

    return current;
  }


  private isEmpty(value: unknown): boolean {
    return (
      value === undefined ||
      value === null ||
      value === 'unselected' ||
      (
        typeof value === 'string' &&
        value.trim().length === 0
      ) ||
      (
        Array.isArray(value) &&
        value.length === 0
      )
    );
  }


  private hasText(value: unknown): value is string {
    return (
      typeof value === 'string' &&
      value.trim().length > 0
    );
  }


  private isValidEmail(value: unknown): boolean {
    return (
      this.hasText(value) &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        value.trim()
      )
    );
  }


  private isRecord(
    value: unknown
  ): value is Record<string, unknown> {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
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
