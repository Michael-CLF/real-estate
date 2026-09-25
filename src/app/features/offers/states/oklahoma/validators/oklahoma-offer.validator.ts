import type { OfferParty } from '../../../../../core/domains/offers/models/offer-party.model';
import type { OfferValidationContext, OfferValidationIssue, OfferValidationResult } from '../../../../../core/domains/offers/models/offer-validation.model';
import type { StateOfferValidator } from '../../../../../core/domains/offers/state-contracts/state-offer-validator';
import type { OklahomaOfferTerms } from '../../../../../core/domains/offers/state-contracts/oklahoma/models/oklahoma-offer-terms.model';

const FINANCING_DOCUMENTS = new Set([
  'conventional_loan', 'fha_loan', 'va_loan', 'usda_loan',
  'native_american_loan', 'assumption', 'seller_financing',
]);

export class OklahomaOfferValidator implements StateOfferValidator<OklahomaOfferTerms> {
  readonly stateCode = 'OK' as const;

  validate(
    terms: OklahomaOfferTerms,
    buyers: OfferParty[],
    sellers: OfferParty[],
    context: OfferValidationContext
  ): OfferValidationResult {
    const issues: OfferValidationIssue[] = [];
    const error = (fieldPath: string, message: string) => issues.push({ fieldPath, message, severity: 'error' as const });

    if (terms.stateCode !== 'OK' || terms.contractType !== 'residential_sale_2026') {
      error('form', 'The offer must use the supported 2026 OREC Residential Sale contract.');
    }
    if (terms.form.formId !== 'OREC-RESIDENTIAL-SALE-2026' || terms.form.effectiveDate !== '2026-01-01') {
      error('form', 'The official OREC form identity does not match the supported version.');
    }
    if (terms.property.state.trim().toUpperCase() !== 'OK') {
      error('property.state', 'The property must be located in Oklahoma.');
    }

    this.validateParties(buyers, 'buyers', error);
    this.validateParties(sellers, 'sellers', error);

    if (!terms.legalDescription.trim()) error('legalDescription', 'The property legal description is required.');
    if (!positiveMoney(terms.purchase.purchasePriceInCents)) error('purchase.purchasePriceInCents', 'Purchase price must be greater than $0.00.');
    if (!positiveMoney(terms.purchase.earnestMoneyInCents)) error('purchase.earnestMoneyInCents', 'Earnest money must be greater than $0.00.');
    if (!terms.purchase.trustAccountHolder.trim()) error('purchase.trustAccountHolder', 'The earnest-money trust-account holder is required.');
    if (!validDate(terms.closing.closingDate)) error('closing.closingDate', 'A valid closing date is required.');

    const financingSelections = terms.contractDocuments.filter(value => FINANCING_DOCUMENTS.has(value));
    if (financingSelections.length > 1) {
      error('contractDocuments', 'Select no more than one financing supplement.');
    }

    if (!integerBetween(terms.timePeriods.inspectionDays, 1, 180)) error('timePeriods.inspectionDays', 'Enter an inspection period from 1 through 180 days.');
    if (!integerBetween(terms.timePeriods.trrNegotiationDays, 1, 180)) error('timePeriods.trrNegotiationDays', 'Enter a TRR negotiation period from 1 through 180 days.');
    if (!integerBetween(terms.timePeriods.titleCureDelayDays, 1, 180)) error('timePeriods.titleCureDelayDays', 'Enter a title-cure period from 1 through 180 days.');
    if (terms.timePeriods.referenceDate && !validDate(terms.timePeriods.referenceDate)) error('timePeriods.referenceDate', 'Enter a valid Time Reference Date or leave it blank.');

    if (terms.disclosures.propertyConditionStatus === 'unselected') error('disclosures.propertyConditionStatus', 'Select the property-condition disclosure status.');
    if (terms.disclosures.leadBasedPaintStatus === 'unselected') error('disclosures.leadBasedPaintStatus', 'Select the lead-based paint disclosure status.');
    if (!terms.disclosures.costEstimateReceived) error('disclosures.costEstimateReceived', 'Acknowledgment of the transaction-cost estimate is required.');
    if (!terms.disclosures.contractGuideAvailable) error('disclosures.contractGuideAvailable', 'Acknowledgment of the OREC Contract Guide is required.');

    if (terms.title.evidenceSelection === 'unselected') error('title.evidenceSelection', 'Select the title-evidence option.');
    if (terms.title.surveySelection === 'unselected') error('title.surveySelection', 'Select the survey or inspection-report option.');
    if (terms.title.surveySelection !== 'none_unless_required' && terms.title.surveyExpensePayer === 'unselected') {
      error('title.surveyExpensePayer', 'Select who will pay the survey or report expense.');
    }

    if (terms.serviceAgreement.selection === 'unselected') error('serviceAgreement.selection', 'Select the residential service-agreement option.');
    if (terms.serviceAgreement.selection === 'buyer_selected') {
      if (!positiveMoney(terms.serviceAgreement.approximateCostInCents)) error('serviceAgreement.approximateCostInCents', 'Enter an approximate service-agreement cost greater than $0.00.');
      if (!nonNegativeMoney(terms.serviceAgreement.sellerContributionInCents)) error('serviceAgreement.sellerContributionInCents', 'Enter a valid seller contribution.');
      if (terms.serviceAgreement.sellerContributionInCents > terms.serviceAgreement.approximateCostInCents) {
        error('serviceAgreement.sellerContributionInCents', 'The seller contribution cannot exceed the approximate agreement cost.');
      }
    }

    if (terms.additionalProvisions.included && !terms.additionalProvisions.partyProvidedText.trim()) {
      error('additionalProvisions.partyProvidedText', 'Enter the party- or attorney-provided provisions.');
    }
    if (!terms.buyerAffidavitComplianceConfirmed) error('buyerAffidavitComplianceConfirmed', 'Buyer affidavit-compliance confirmation is required.');
    if (!terms.delivery.timeZone.trim()) error('delivery.timeZone', 'The property time zone is required.');
    const expiration = new Date(terms.delivery.expiresAt);
    if (!Number.isFinite(expiration.getTime())) {
      error('delivery.expiresAt', 'A valid offer expiration date and time is required.');
    } else if (['submit', 'counteroffer'].includes(context.mode) && expiration.getTime() <= (context.currentDateTime ?? new Date()).getTime()) {
      error('delivery.expiresAt', 'The offer expiration must be in the future.');
    }
    if (['submit', 'counteroffer', 'signature'].includes(context.mode) && terms.delivery.electronicDeliveryAuthorized !== true) {
      error('delivery.electronicDeliveryAuthorized', 'Electronic-delivery authorization is required.');
    }

    const errors = issues.filter(issue => issue.severity === 'error');
    return { valid: errors.length === 0, errors, warnings: [] };
  }

  private validateParties(
    parties: readonly OfferParty[],
    field: 'buyers' | 'sellers',
    error: (fieldPath: string, message: string) => void
  ): void {
    if (!parties.length) error(field, `At least one ${field === 'buyers' ? 'buyer' : 'seller'} is required.`);
    parties.forEach((party, index) => {
      if (!party.legalName.trim()) error(`${field}.${index}.legalName`, 'A legal name is required.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(party.email.trim())) error(`${field}.${index}.email`, 'A valid email address is required.');
      if (!party.phone.trim()) error(`${field}.${index}.phone`, 'A phone number is required.');
    });
  }
}

function positiveMoney(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

function nonNegativeMoney(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function integerBetween(value: number, minimum: number, maximum: number): boolean {
  return Number.isSafeInteger(value) && value >= minimum && value <= maximum;
}

function validDate(value: string): boolean {
  return Boolean(value) && Number.isFinite(new Date(value).getTime());
}
