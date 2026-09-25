import type { SanitizeDraftTermsInput } from '../state-contract-package';
import type { OklahomaOfferTermsDocument } from './oklahoma-offer-terms.document';

const DOCUMENTS = new Set([
  'conventional_loan', 'fha_loan', 'va_loan', 'usda_loan', 'native_american_loan',
  'assumption', 'seller_financing', 'proof_of_funds', 'single_family_hoa',
  'condo_townhouse_association', 'supplement', 'buyer_property_under_contract',
  'buyer_property_not_under_contract', 'cooperative_compensation',
]);

export function sanitizeOklahomaDraftTerms(
  input: SanitizeDraftTermsInput<OklahomaOfferTermsDocument>
): OklahomaOfferTermsDocument {
  const requested = record(input.requestedTerms);
  const purchase = record(requested['purchase']);
  const closing = record(requested['closing']);
  const accessories = record(requested['accessories']);
  const timePeriods = record(requested['timePeriods']);
  const disclosures = record(requested['disclosures']);
  const title = record(requested['title']);
  const serviceAgreement = record(requested['serviceAgreement']);
  const additionalProvisions = record(requested['additionalProvisions']);
  const delivery = record(requested['delivery']);
  const current = input.currentTerms;

  return {
    ...current,
    contractDocuments: arrayOfStrings(requested['contractDocuments']).filter(value => DOCUMENTS.has(value)),
    legalDescription: text(requested['legalDescription'], 4000),
    purchase: {
      purchasePriceInCents: money(purchase['purchasePriceInCents']),
      earnestMoneyInCents: money(purchase['earnestMoneyInCents']),
      trustAccountHolder: text(purchase['trustAccountHolder'], 300),
    },
    closing: {
      closingDate: text(closing['closingDate'], 10),
      possessionTerms: text(closing['possessionTerms'], 1000),
    },
    accessories: {
      additionalInclusions: text(accessories['additionalInclusions'], 3000),
      exclusions: text(accessories['exclusions'], 3000),
    },
    timePeriods: {
      referenceDate: text(timePeriods['referenceDate'], 10),
      inspectionDays: integer(timePeriods['inspectionDays']),
      additionalInvestigations: text(timePeriods['additionalInvestigations'], 2000),
      trrNegotiationDays: integer(timePeriods['trrNegotiationDays']),
      titleCureDelayDays: integer(timePeriods['titleCureDelayDays']),
    },
    disclosures: {
      inHouseBrokerageServices: boolean(disclosures['inHouseBrokerageServices']),
      propertyConditionStatus: choice(disclosures['propertyConditionStatus'], ['unselected', 'disclosure_received', 'disclaimer_received', 'exempt', 'not_required'], 'unselected'),
      leadBasedPaintStatus: choice(disclosures['leadBasedPaintStatus'], ['unselected', 'received', 'built_1978_or_later', 'not_residential'], 'unselected'),
      costEstimateReceived: boolean(disclosures['costEstimateReceived']),
      contractGuideAvailable: boolean(disclosures['contractGuideAvailable']),
    },
    title: {
      evidenceSelection: choice(title['evidenceSelection'], ['unselected', 'title_insurance_commitment', 'attorney_title_opinion'], 'unselected'),
      surveySelection: choice(title['surveySelection'], ['unselected', 'mortgage_inspection_report', 'pin_stake_boundary_survey', 'none_unless_required'], 'unselected'),
      surveyExpensePayer: choice(title['surveyExpensePayer'], ['unselected', 'buyer', 'seller'], 'unselected'),
    },
    serviceAgreement: {
      selection: choice(serviceAgreement['selection'], ['unselected', 'none', 'seller_existing_transfer', 'buyer_selected'], 'unselected'),
      approximateCostInCents: money(serviceAgreement['approximateCostInCents']),
      sellerContributionInCents: money(serviceAgreement['sellerContributionInCents']),
    },
    additionalProvisions: {
      included: boolean(additionalProvisions['included']),
      partyProvidedText: text(additionalProvisions['partyProvidedText'], 5000),
    },
    buyerAffidavitComplianceConfirmed: boolean(requested['buyerAffidavitComplianceConfirmed']),
    delivery: {
      expiresAt: text(delivery['expiresAt'], 40),
      timeZone: 'America/Chicago',
      electronicDeliveryAuthorized: nullableBoolean(delivery['electronicDeliveryAuthorized']),
    },
  };
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function text(value: unknown, maximum: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maximum) : '';
}
function money(value: unknown): number {
  return Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : 0;
}
function integer(value: unknown): number {
  return Number.isSafeInteger(value) ? Number(value) : 0;
}
function boolean(value: unknown): boolean { return value === true; }
function nullableBoolean(value: unknown): boolean | null { return typeof value === 'boolean' ? value : null; }
function arrayOfStrings(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter(item => typeof item === 'string').map(item => item.trim()))] : [];
}
function choice<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && allowed.includes(value as T) ? value as T : fallback;
}
