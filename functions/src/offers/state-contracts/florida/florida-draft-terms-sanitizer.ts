import type { SanitizeDraftTermsInput } from '../state-contract-package';
import type { FloridaOfferTermsDocument } from './florida-offer-terms.document';

const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v)
    ? v as Record<string, unknown>
    : {};

const text = (v: unknown, max = 5000) =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

const money = (v: unknown) =>
  Number.isSafeInteger(v) && Number(v) >= 0 ? Number(v) : 0;

const integer = (v: unknown) =>
  Number.isSafeInteger(v) ? Number(v) : 0;

const bool = (v: unknown): boolean | null =>
  typeof v === 'boolean' ? v : null;

const choice = <T extends string>(
  v: unknown,
  allowed: readonly T[],
  fallback: T
): T =>
  typeof v === 'string' && allowed.includes(v as T)
    ? v as T
    : fallback;

export function sanitizeFloridaDraftTerms(
  input: SanitizeDraftTermsInput<FloridaOfferTermsDocument>
): FloridaOfferTermsDocument {
  const request = record(input.requestedTerms);
  const purchase = record(request['purchase']);
  const deadlines = record(request['deadlines']);
  const conditions = record(request['conditions']);
  const items = record(request['propertyItems']);
  const settlement = record(request['settlement']);
  const disclosures = record(request['disclosures']);
  const delivery = record(request['delivery']);

  const hasDeposit = bool(purchase['hasEarnestMoney']);
  const financingType = choice(
    purchase['financingType'],
    ['unselected', 'cash', 'conventional', 'fha', 'va', 'usda'] as const,
    'unselected'
  );
  const extraDeposit = hasDeposit === true
    ? bool(conditions['additionalEarnestMoney'])
    : false;

  const sanitized: FloridaOfferTermsDocument = {
    ...input.currentTerms,

    // Property and legal description come from the seller's listing snapshot.
    legalDescription: input.currentTerms.legalDescription,

    purchase: {
      purchasePriceInCents: money(purchase['purchasePriceInCents']),
      hasEarnestMoney: hasDeposit,
      earnestMoneyInCents: hasDeposit
        ? money(purchase['earnestMoneyInCents'])
        : 0,
      additionalEarnestMoneyInCents: extraDeposit
        ? money(purchase['additionalEarnestMoneyInCents'])
        : 0,
      additionalEarnestMoneyDueDays: integer(
        purchase['additionalEarnestMoneyDueDays']
      ),
      earnestMoneyHolder: hasDeposit
        ? text(purchase['earnestMoneyHolder'], 300)
        : '',
      earnestMoneyDueDays: integer(purchase['earnestMoneyDueDays']),
      financingType,
      loanAmountInCents: financingType === 'cash'
        ? 0
        : money(purchase['loanAmountInCents']),
      loanApplicationDays: integer(purchase['loanApplicationDays']),
      loanApprovalDays: integer(purchase['loanApprovalDays']),
      loanTermYears: integer(purchase['loanTermYears']),
      sellerConcessionsInCents: money(
        purchase['sellerConcessionsInCents']
      ),
    },

    deadlines: {
      sellerDisclosureDate: text(
        deadlines['sellerDisclosureDate'],
        10
      ),
      dueDiligenceDate: '',
      inspectionPeriodDays: integer(
        deadlines['inspectionPeriodDays']
      ),
      financingAppraisalDate: '',
      settlementDate: text(deadlines['settlementDate'], 10),
    },

    conditions: {
      dueDiligence: true,
      appraisal: financingType === 'cash'
        ? false
        : bool(conditions['appraisal']),
      financing: financingType === 'cash'
        ? false
        : bool(conditions['financing']),
      saleOfBuyersProperty: bool(
        conditions['saleOfBuyersProperty']
      ),
      additionalEarnestMoney: extraDeposit,
    },

    propertyItems: {
      included: text(items['included'], 3000),
      excluded: text(items['excluded'], 3000),
      fixturesIncluded: true,
      leasedItemsDescription: text(
        items['leasedItemsDescription'],
        2000
      ),
    },

    settlement: {
      possession: 'at_recording',
      possessionDelay: 0,
      specialAssessmentPayer: choice(
        settlement['specialAssessmentPayer'],
        ['unselected', 'buyer', 'seller', 'split'] as const,
        'unselected'
      ),
      hoaTransferFeePayer: choice(
        settlement['hoaTransferFeePayer'],
        ['unselected', 'buyer', 'seller', 'split'] as const,
        'unselected'
      ),
      titlePolicyPayer: choice(
        settlement['titlePolicyPayer'],
        ['unselected', 'buyer', 'seller'] as const,
        'unselected'
      ),
      closingAgentName: text(settlement['closingAgentName'], 300),
      titleEvidenceDaysBeforeClosing: integer(
        settlement['titleEvidenceDaysBeforeClosing']
      ),
    },

    disclosures: {
      sellerReportsExistingLeases:
        input.currentTerms.disclosures.sellerReportsExistingLeases,
      sellerReportsHoa:
        input.currentTerms.disclosures.sellerReportsHoa,
      floodStatus: choice(
        disclosures['floodStatus'],
        ['unselected', 'received', 'pending'] as const,
        'unselected'
      ),
      taxNoticeAcknowledged: bool(
        disclosures['taxNoticeAcknowledged']
      ),
      radonNoticeAcknowledged: bool(
        disclosures['radonNoticeAcknowledged']
      ),
      propertyConditionStatus: choice(
        disclosures['propertyConditionStatus'],
        ['unselected', 'received', 'pending'] as const,
        'unselected'
      ),
      leadPaintStatus: choice(
        disclosures['leadPaintStatus'],
        [
          'unselected',
          'received',
          'pending',
          'built_1978_or_later',
          'exempt',
        ] as const,
        'unselected'
      ),
      leadInspectionSelection: choice(
        disclosures['leadInspectionSelection'],
        [
          'unselected',
          'ten_days',
          'waived',
          'other_period',
        ] as const,
        'unselected'
      ),
      leadInspectionDays: integer(
        disclosures['leadInspectionDays']
      ),
      hoaDocumentsStatus: choice(
        disclosures['hoaDocumentsStatus'],
        [
          'unselected',
          'received',
          'pending',
          'not_applicable',
        ] as const,
        'unselected'
      ),
      leaseStatementAcknowledged: bool(
        disclosures['leaseStatementAcknowledged']
      ),
    },

    additionalTerms: text(request['additionalTerms'], 5000),

    delivery: {
      expiresAt: text(delivery['expiresAt'], 40),
      timeZone: 'America/New_York',
      electronicDeliveryAuthorized: bool(
        delivery['electronicDeliveryAuthorized']
      ),
    },
  };

  if (input.initiatedBy === 'seller') {
    return {
      ...input.currentTerms,
      purchase: {
        ...input.currentTerms.purchase,
        purchasePriceInCents:
          sanitized.purchase.purchasePriceInCents,
        sellerConcessionsInCents:
          sanitized.purchase.sellerConcessionsInCents,
      },
      delivery: {
        ...input.currentTerms.delivery,
        expiresAt: sanitized.delivery.expiresAt,
        electronicDeliveryAuthorized:
          sanitized.delivery.electronicDeliveryAuthorized,
      },
    };
  }

  return sanitized;
}