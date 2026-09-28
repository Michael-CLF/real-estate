import type { OfferParty } from '../../../../../core/domains/offers/models/offer-party.model';
import type {
  OfferValidationContext,
  OfferValidationIssue,
  OfferValidationResult,
} from '../../../../../core/domains/offers/models/offer-validation.model';
import type { StateOfferValidator } from '../../../../../core/domains/offers/state-contracts/state-offer-validator';
import type { LouisianaOfferTerms } from '../../../../../core/domains/offers/state-contracts/louisiana/models/louisiana-offer-terms.model';

const money = (value: number, positive = false): boolean =>
  Number.isSafeInteger(value) && (positive ? value > 0 : value >= 0);

const days = (value: number, minimum: number, maximum: number): boolean =>
  Number.isSafeInteger(value) &&
  value >= minimum &&
  value <= maximum;

const date = (value: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T12:00:00Z`));

export class LouisianaOfferValidator
  implements StateOfferValidator<LouisianaOfferTerms> {
  readonly stateCode = 'LA' as const;

  validate(
    terms: LouisianaOfferTerms,
    buyers: OfferParty[],
    sellers: OfferParty[],
    context: OfferValidationContext
  ): OfferValidationResult {
    const errors: OfferValidationIssue[] = [];

    const error = (fieldPath: string, message: string): void => {
      errors.push({ fieldPath, message, severity: 'error' });
    };

    const purchase = terms.purchase;
    const conditions = terms.conditions;
    const deadlines = terms.deadlines;
    const disclosures = terms.disclosures;

    if (
      terms.stateCode !== 'LA' ||
      terms.contractType !== 'lrec_louisiana_residential_agreement_2026'
    ) {
      error('form', 'Select the current Louisiana residential agreement.');
    }

    if (
      terms.property.state !== 'LA' ||
      !['single_family', 'townhome', 'pud'].includes(
        terms.property.propertyType
      )
    ) {
      error(
        'property.propertyType',
        'This agreement requires a Louisiana residential resale listing.'
      );
    }

    for (const [side, parties] of [
      ['buyers', buyers],
      ['sellers', sellers],
    ] as const) {
      if (parties.length === 0) {
        error(
          side,
          `At least one ${side === 'buyers' ? 'buyer' : 'seller'} is required.`
        );
      }

      parties.forEach((party, index) => {
        if (!party.legalName?.trim()) {
          error(`${side}.${index}.legalName`, 'Enter the legal name.');
        }

        if (
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            party.email?.trim() ?? ''
          )
        ) {
          error(`${side}.${index}.email`, 'Enter a valid email.');
        }

        if (!party.phone?.trim()) {
          error(`${side}.${index}.phone`, 'Enter a phone number.');
        }
      });
    }

    if (!terms.legalDescription.trim()) {
      error(
        'legalDescription',
        'The seller must enter the legal description in the listing.'
      );
    }

    if (typeof terms.propertyItems.mineralRightsReserved !== 'boolean') {
      error(
        'propertyItems.mineralRightsReserved',
        'Choose whether the seller reserves mineral rights.'
      );
    }

    if (
      terms.propertyItems.mineralRightsReserved &&
      !(
        terms.propertyItems.mineralRightsPercent > 0 &&
        terms.propertyItems.mineralRightsPercent <= 100
      )
    ) {
      error(
        'propertyItems.mineralRightsPercent',
        'Enter 1 to 100 percent.'
      );
    }

    if (!money(purchase.purchasePriceInCents, true)) {
      error(
        'purchase.purchasePriceInCents',
        'Enter a price above $0.'
      );
    }

    if (typeof purchase.hasEarnestMoney !== 'boolean') {
      error(
        'purchase.hasEarnestMoney',
        'Choose whether the buyer pays a deposit.'
      );
    }

    if (purchase.hasEarnestMoney) {
      if (!money(purchase.earnestMoneyInCents, true)) {
        error('purchase.earnestMoneyInCents', 'Enter the deposit.');
      }

      if (!purchase.earnestMoneyHolder.trim()) {
        error('purchase.earnestMoneyHolder', 'Name the deposit holder.');
      }

      if (
        !['check', 'certified_funds', 'electronic_transfer'].includes(
          purchase.depositMethod
        )
      ) {
        error('purchase.depositMethod', 'Choose a payment method.');
      }
    }

    if (purchase.financingType === 'unselected') {
      error(
        'purchase.financingType',
        'Select cash or financing.'
      );
    }

    if (
      purchase.financingType === 'cash' &&
      !days(purchase.cashProofDays, 1, 30)
    ) {
      error(
        'purchase.cashProofDays',
        'Enter 1 to 30 days.'
      );
    }

    if (purchase.financingType === 'financed') {
      if (
        !money(purchase.loanAmountInCents, true) ||
        purchase.loanAmountInCents > purchase.purchasePriceInCents
      ) {
        error(
          'purchase.loanAmountInCents',
          'Enter a loan amount up to the price.'
        );
      }

      if (
        !(
          purchase.maxInterestRatePercent > 0 &&
          purchase.maxInterestRatePercent <= 30
        )
      ) {
        error(
          'purchase.maxInterestRatePercent',
          'Enter a maximum annual rate up to 30%.'
        );
      }

      if (!days(purchase.loanTermYears, 1, 40)) {
        error(
          'purchase.loanTermYears',
          'Enter 1 to 40 years.'
        );
      }

      if (purchase.financingSource === 'unselected') {
        error(
          'purchase.financingSource',
          'Select a mortgage or funding program.'
        );
      }

      if (
        purchase.financingSource === 'other' &&
        !purchase.otherFinancingConditions.trim()
      ) {
        error(
          'purchase.otherFinancingConditions',
          'Describe the other financing.'
        );
      }

      if (!days(purchase.loanApplicationDays, 1, 30)) {
        error(
          'purchase.loanApplicationDays',
          'Enter 1 to 30 days.'
        );
      }
    }

    if (typeof conditions.saleOfBuyersProperty !== 'boolean') {
      error(
        'conditions.saleOfBuyersProperty',
        'Select whether the buyer must sell another property.'
      );
    }

    if (
      conditions.saleOfBuyersProperty &&
      !conditions.saleOfBuyersPropertyTerms.trim()
    ) {
      error(
        'conditions.saleOfBuyersPropertyTerms',
        'Describe the other-property contingency.'
      );
    }

    if (!days(deadlines.inspectionPeriodDays, 1, 90)) {
      error(
        'deadlines.inspectionPeriodDays',
        'Enter 1 to 90 days.'
      );
    }

    if (!days(conditions.privateWaterSystems, 0, 20)) {
      error(
        'conditions.privateWaterSystems',
        'Enter 0 to 20.'
      );
    }

    if (!days(conditions.privateSepticSystems, 0, 20)) {
      error(
        'conditions.privateSepticSystems',
        'Enter 0 to 20.'
      );
    }

    if (typeof conditions.appraisal !== 'boolean') {
      error(
        'conditions.appraisal',
        'Select the appraisal condition.'
      );
    }

    if (
      conditions.appraisal &&
      !days(deadlines.appraisalCopyDays, 1, 30)
    ) {
      error(
        'deadlines.appraisalCopyDays',
        'Enter 1 to 30 days.'
      );
    }

    if (
      conditions.appraisal &&
      !days(deadlines.appraisalResponseDays, 1, 30)
    ) {
      error(
        'deadlines.appraisalResponseDays',
        'Enter 1 to 30 days.'
      );
    }

    if (
      !['with_warranties', 'as_is', 'new_home_warranty'].includes(
        conditions.warranty
      )
    ) {
      error(
        'conditions.warranty',
        'Select the sale warranty option.'
      );
    }

    if (
      !['will', 'will_not'].includes(
        conditions.homeServiceWarranty
      )
    ) {
      error(
        'conditions.homeServiceWarranty',
        'Choose a home warranty option.'
      );
    }

    if (conditions.homeServiceWarranty === 'will') {
      if (
        !money(
          conditions.homeServiceWarrantyCostInCents,
          true
        )
      ) {
        error(
          'conditions.homeServiceWarrantyCostInCents',
          'Enter a maximum price.'
        );
      }

      if (
        conditions.homeServiceWarrantyPayer === 'unselected'
      ) {
        error(
          'conditions.homeServiceWarrantyPayer',
          'Choose who pays.'
        );
      }

      if (
        !conditions.homeServiceWarrantyOrderedBy.trim()
      ) {
        error(
          'conditions.homeServiceWarrantyOrderedBy',
          'Name who orders the warranty.'
        );
      }
    }

    if (!date(deadlines.settlementDate)) {
      error(
        'deadlines.settlementDate',
        'Enter an Act of Sale date.'
      );
    }

    if (!days(deadlines.titleCureDays, 1, 180)) {
      error(
        'deadlines.titleCureDays',
        'Enter 1 to 180 days.'
      );
    }

    if (
      disclosures.propertyDisclosureStatus !== 'received'
    ) {
      error(
        'disclosures.propertyDisclosureStatus',
        'Review the seller-signed Louisiana disclosure before continuing.'
      );
    }

    const leadStatus = disclosures.leadPaintStatus;
    const yearBuilt = terms.property.yearBuilt;

    if (leadStatus === 'unselected') {
      error(
        'disclosures.leadPaintStatus',
        'Select whether you received the lead packet or have not yet received it.'
      );

      error(
        'disclosures.leadPaintStatus',
        'The applicable lead disclosure must be received before continuing.'
      );
    }

    if (leadStatus === 'exempt') {
      error(
        'disclosures.leadPaintStatus',
        'This wizard cannot verify another federal exemption. Choose the documented property status.'
      );
    }

    if (
      leadStatus === 'built_1978_or_later' &&
      (yearBuilt == null || yearBuilt < 1978)
    ) {
      error(
        'disclosures.leadPaintStatus',
        'The listing must show a construction year of 1978 or later.'
      );
    }

    if (
      leadStatus === 'received' &&
      disclosures.leadInspectionSelection === 'unselected'
    ) {
      error(
        'disclosures.leadInspectionSelection',
        'Choose the buyer lead inspection opportunity.'
      );
    }

    if (
      leadStatus === 'received' &&
      disclosures.leadInspectionSelection === 'other_period' &&
      !days(disclosures.leadInspectionDays, 1, 60)
    ) {
      error(
        'disclosures.leadInspectionDays',
        'Enter 1 to 60 agreed lead inspection days.'
      );
    }

    if (terms.delivery.electronicDeliveryAuthorized !== true) {
      error(
        'delivery.electronicDeliveryAuthorized',
        'Authorize electronic delivery and signatures.'
      );
    }

    const expiry = new Date(terms.delivery.expiresAt);

    if (
      !Number.isFinite(expiry.getTime()) ||
      (
        context.mode !== 'draft' &&
        expiry.getTime() <=
        (context.currentDateTime ?? new Date()).getTime()
      )
    ) {
      error(
        'delivery.expiresAt',
        'Choose a future expiration.'
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: [],
    };
  }
}