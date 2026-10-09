import { record, text, money, integer, bool, choice } from '../draft-term-values';
import type { SanitizeDraftTermsInput } from '../state-contract-package';
import type { SouthCarolinaOfferTermsDocument } from './south-carolina-offer-terms.document';

export function sanitizeSouthCarolinaDraftTerms(
  input: SanitizeDraftTermsInput<SouthCarolinaOfferTermsDocument>
): SouthCarolinaOfferTermsDocument {
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

  const sanitized: SouthCarolinaOfferTermsDocument = {
    ...input.currentTerms,

    documentVersions: { ...input.currentTerms.documentVersions },

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
      appraisalPeriodDays: integer(deadlines['appraisalPeriodDays']),
      inspectionPeriodDays: integer(
        deadlines['inspectionPeriodDays']
      ),
      financingAppraisalDate: '',
      settlementDate: text(deadlines['settlementDate'], 10),
    },

    conditions: {
      dueDiligence: true,
      appraisal: bool(conditions['appraisal']),
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
      sellerReportsExistingLeases: input.currentTerms.disclosures.sellerReportsExistingLeases,
      sellerReportsHoa: input.currentTerms.disclosures.sellerReportsHoa,
      propertyExemptionBasis: text(disclosures['propertyExemptionBasis'], 2000),
      coastalApplies: bool(disclosures['coastalApplies']),
      coastalBaselineDescription: text(disclosures['coastalBaselineDescription'], 3000),
      coastalSetbackDescription: text(disclosures['coastalSetbackDescription'], 3000),
      coastalStructureCoordinates: text(disclosures['coastalStructureCoordinates'], 3000),
      coastalErosionRate: text(disclosures['coastalErosionRate'], 1000),
      vacationRentalsApply: bool(disclosures['vacationRentalsApply']),
      vacationRentalPeriods: text(disclosures['vacationRentalPeriods'], 5000),
      propertyConditionStatus: choice(disclosures['propertyConditionStatus'], ['unselected','received','pending','exempt','waived'] as const,'unselected'),
      hoaDocumentsStatus: choice(disclosures['hoaDocumentsStatus'], ['unselected','received','pending','not_applicable','exempt'] as const,'unselected'),
      leadPaintStatus: choice(disclosures['leadPaintStatus'],['unselected','received','pending','built_1978_or_later','exempt'] as const,'unselected'),
      leadExemptionBasis: text(disclosures['leadExemptionBasis'], 2000),
      leadInspectionSelection: choice(disclosures['leadInspectionSelection'],['unselected','ten_days','waived','other_period'] as const,'unselected'),
      leadInspectionDays: integer(disclosures['leadInspectionDays']),
      leaseStatementAcknowledged: bool(disclosures['leaseStatementAcknowledged']),
      southCarolinaNoticesAcknowledged: bool(disclosures['southCarolinaNoticesAcknowledged']),
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
    return {...sanitized, documentVersions: input.currentTerms.documentVersions, disclosures: {...sanitized.disclosures, leadPaintStatus: input.currentTerms.disclosures.leadPaintStatus, leadInspectionSelection: input.currentTerms.disclosures.leadInspectionSelection, leadInspectionDays: input.currentTerms.disclosures.leadInspectionDays, propertyConditionStatus: input.currentTerms.disclosures.propertyConditionStatus, hoaDocumentsStatus: input.currentTerms.disclosures.hoaDocumentsStatus, leaseStatementAcknowledged: input.currentTerms.disclosures.leaseStatementAcknowledged, southCarolinaNoticesAcknowledged: input.currentTerms.disclosures.southCarolinaNoticesAcknowledged}, conditions: {...input.currentTerms.conditions, additionalEarnestMoney: sanitized.conditions.additionalEarnestMoney},
      purchase: {...sanitized.purchase, financingType: input.currentTerms.purchase.financingType,
        loanAmountInCents: input.currentTerms.purchase.loanAmountInCents, loanTermYears: input.currentTerms.purchase.loanTermYears},
    };
  }
  return sanitized;
}
