import { record, text, money, integer, bool, choice } from '../draft-term-values';
import type { SanitizeDraftTermsInput } from '../state-contract-package';
import type { MissouriOfferTermsDocument } from './missouri-offer-terms.document';

export function sanitizeMissouriDraftTerms(
  input: SanitizeDraftTermsInput<MissouriOfferTermsDocument>
): MissouriOfferTermsDocument {
  const request = record(input.requestedTerms);
  const purchase = record(request['purchase']);
  const deadlines = record(request['deadlines']);
  const conditions = record(request['conditions']);
  const items = record(request['propertyItems']);
  const settlement = record(request['settlement']);
  const disclosures = record(request['disclosures']);
  const delivery = record(request['delivery']);
  const special = record(request['specialProperty']);
  const versions = record(request['documentVersions']);

  const hasDeposit = bool(purchase['hasEarnestMoney']);
  const financingType = choice(
    purchase['financingType'],
    ['unselected', 'cash', 'conventional', 'fha', 'va', 'usda'] as const,
    'unselected'
  );
  const extraDeposit = hasDeposit === true
    ? bool(conditions['additionalEarnestMoney'])
    : false;

  const sanitized: MissouriOfferTermsDocument = {
    ...input.currentTerms,
    ...(input.currentTerms.contractType === 'navstreet_missouri_condominium_resale_2026' ? {condominiumOfferEntryRevision:'2026-10-19' as const} : {}),

    ...(input.currentTerms.specialProperty ? {specialProperty:{
      projectName:text(special['projectName'],300),unitDesignation:text(special['unitDesignation'],300),
      commonElements:text(special['commonElements'],3000),parkingStorage:text(special['parkingStorage'],3000),
      resaleCertificateStatus:choice(special['resaleCertificateStatus'],['unselected','received','pending'] as const,'unselected'),
      certificateReceivedDate:special['resaleCertificateStatus'] === 'received' ? text(special['certificateReceivedDate'],10) : '',
      condominiumRightsAcknowledged:bool(special['condominiumRightsAcknowledged']),intendedUse:text(special['intendedUse'],3000),surveyRequired:bool(special['surveyRequired']),landReviewAcknowledged:bool(special['landReviewAcknowledged']),
      tenantDocumentsStatus:choice(special['tenantDocumentsStatus'],['unselected','received','pending','not_applicable'] as const,'unselected'),tenancyTransferAcknowledged:bool(special['tenancyTransferAcknowledged'])
    }} : {}),

    ...(input.currentTerms.documentVersions ? {documentVersions:Object.fromEntries(Object.entries(versions).filter(([key,value]) => ['missouri-statutory-packet','missouri-seller-disclosure','missouri-association-documents','missouri-condominium-resale-certificate','missouri-tenant-records','lead-based-paint'].includes(key) && typeof value === 'string' && value.length > 0 && value.length <= 200 && !value.includes('/')).map(([key,value]) => [key,String(value)]))} : {}),

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
      methDisclosureRequired: input.currentTerms.disclosures.methDisclosureRequired,
      sellerReportsExistingLeases:
        input.currentTerms.disclosures.sellerReportsExistingLeases,
      sellerReportsHoa:
        input.currentTerms.disclosures.sellerReportsHoa,
      statutoryPacketStatus: choice(
        disclosures['statutoryPacketStatus'],
        ['unselected', 'received', 'pending', 'exempt'] as const,
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
        ['unselected', 'received', 'pending', 'exempt'] as const,
        'unselected'
      ),
      leadPaintStatus: input.currentTerms.property.propertyType === 'land' ? 'not_applicable' : choice(
        disclosures['leadPaintStatus'],
        [
          'unselected',
          'received',
          'pending',
          'built_1978_or_later',
          'exempt',
          'not_applicable',
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
      hoaDocumentsStatus: input.currentTerms.contractType === 'navstreet_missouri_condominium_resale_2026' ? choice(special['resaleCertificateStatus'],['unselected','received','pending'] as const,'unselected') : choice(
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
      timeZone: input.currentTerms.delivery.timeZone,
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