import {
  COLORADO_FACT_DEFAULTS,
  COLORADO_ELECTION_DEFAULTS,
} from './colorado-contract-elections';
import type { CreateInitialOfferTermsInput } from '../state-contract-package';
import type {
  ColoradoOfferTermsDocument,
  ColoradoSellerLoan,
} from './colorado-offer-terms.document';

const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};

const cents = (v: unknown) =>
  Number.isSafeInteger(v) && Number(v) >= 0 ? Number(v) : 0;

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export const COLORADO_DEADLINE_KEYS = [
  'alternativeEarnestMoney',
  'recordTitle',
  'recordTitleObjection',
  'offRecordTitle',
  'offRecordTitleObjection',
  'titleResolution',
  'thirdPartyApproval',
  'associationDocuments',
  'associationTermination',
  'sellerPropertyDisclosure',
  'leadDisclosure',
  'newLoanApplication',
  'newLoanTerms',
  'newLoanAvailability',
  'existingLoan',
  'existingLoanTermination',
  'loanTransferApproval',
  'appraisal',
  'appraisalObjection',
  'appraisalResolution',
  'survey',
  'surveyObjection',
  'surveyResolution',
  'waterRightsExamination',
  'mineralRightsExamination',
  'inspectionTermination',
  'inspectionObjection',
  'inspectionResolution',
  'insuranceTermination',
  'dueDiligenceDelivery',
  'dueDiligenceObjection',
  'dueDiligenceResolution',
  'conditionalSale',
  'leadTermination',
  'closing',
  'possession',
] as const;

function sellerLoan(value: unknown): ColoradoSellerLoan | null {
  const v = record(value);

  if (v['available'] !== true) return null;

  return {
    available: true,
    ratePercent:
      typeof v['ratePercent'] === 'number' && Number.isFinite(v['ratePercent'])
        ? v['ratePercent']
        : 0,
    estimatedBalanceInCents: cents(v['estimatedBalanceInCents']),
    balanceAsOf: str(v['balanceAsOf']).slice(0, 10),
    principalInterestPaymentInCents: cents(v['principalInterestPaymentInCents']),
    paymentPeriod: str(v['paymentPeriod']).slice(0, 30) || 'month',
    escrowRealEstateTaxes: v['escrowRealEstateTaxes'] === true,
    escrowPropertyInsurance: v['escrowPropertyInsurance'] === true,
    escrowMortgageInsurance: v['escrowMortgageInsurance'] === true,
    escrowOther: str(v['escrowOther']).slice(0, 180),
  };
}

export function createColoradoInitialOfferTerms(
  input: CreateInitialOfferTermsInput,
): ColoradoOfferTermsDocument {
  if (
    input.property.state !== 'CO' ||
    !['single_family', 'townhome', 'condo'].includes(input.property.propertyType) ||
    input.contractType !== 'navstreet_colorado_residential_2026'
  ) {
    throw new Error(
      'Choose a Colorado single-family home, townhome or condo and the NavStreet residential agreement.',
    );
  }

  const listing = record(input.listingData);
  const hoa = record(listing['hoa']);

  const deadlines = Object.fromEntries(
    COLORADO_DEADLINE_KEYS.map((key) => [key, '']),
  ) as unknown as ColoradoOfferTermsDocument['deadlines'];

  return {
    stateCode: 'CO',
    contractType: 'navstreet_colorado_residential_2026',
    property: { ...input.property, state: 'CO' },
    legalDescription: input.property.legalDescription ?? '',

    propertyFacts: {
      ...(Object.fromEntries(
        Object.entries(COLORADO_FACT_DEFAULTS).map(([key, fallback]) => [
          key,
          str(record(listing['coloradoPropertyFacts'])[key]).slice(0, 4000) ||
            fallback,
        ]),
      ) as typeof COLORADO_FACT_DEFAULTS),

      landArea:
        typeof listing['lotSize'] === 'number' &&
        Number.isFinite(listing['lotSize']) &&
        Number(listing['lotSize']) > 0
          ? `${listing['lotSize']} ${
              listing['lotSizeUnit'] === 'square_feet'
                ? 'square feet'
                : listing['lotSizeUnit'] === 'acres'
                  ? 'acres'
                  : '(unit not supplied)'
            }`
          : '',
    },

    elections: { ...COLORADO_ELECTION_DEFAULTS },
    sellerLoan: sellerLoan(listing['coloradoAssumableLoan']),

    propertyItems: {
      included: '',
      excluded: '',
      leasedItems: '',
      waterRights: '',
      wellPermit: '',
      mineralRights: '',
    },

    purchase: {
      purchasePriceInCents: input.property.listPriceInCents,
      earnestMoneyInCents: 0,
      earnestMoneyHolder: '',
      earnestMoneyForm: '',
      financingType: 'unselected',
      newLoanType: 'unselected',
      newLoanAmountInCents: 0,
      cashAtClosingInCents: 0,
      availableCashConfirmed: null,
      sellerConcessionsInCents: 0,

      assumption: {
        maxTransferFeeInCents: 0,
        maxCashIncreaseInCents: 0,
        maxRatePercent: 0,
        maxPaymentInCents: 0,
        maxPaymentPeriod: 'month',
        sellerReleaseRequired: null,
        releaseEvidenceTiming: 'unselected',
        releaseCostPayer: 'unselected',
        maxReleaseCostInCents: 0,
      },
    },

    conditions: {
      saleOfBuyerProperty: null,
      saleOfBuyerPropertyAddress: '',
      appraisal: null,
      inspection: null,
      newSurvey: 'unselected',
      surveyPayer: 'unselected',
      ownerTitlePolicyPayer: 'unselected',
      deedType: 'unselected',
      closingFeePayer: 'unselected',
      specialAssessmentPayer: 'unselected',
      possessionDelayChargeInCents: 0,
    },

    deadlines: {
      ...deadlines,
      timeOfDay: '23:59',
      extendHoliday: false,
      possessionTime: '',
    },

    disclosures: {
      sellerReportsHoa:
        typeof record(listing['sellerStatements'])['ownersAssociationApplies'] ===
        'boolean'
          ? (record(listing['sellerStatements'])[
              'ownersAssociationApplies'
            ] as boolean)
          : typeof hoa['hasHoa'] === 'boolean'
            ? (hoa['hasHoa'] as boolean)
            : null,

      sellerPropertyStatus: 'unselected',
      leadPaintStatus: 'unselected',
      leadInspectionChoice: 'unselected',
      leadInspectionDays: 10,
      associationStatus:
        hoa['hasHoa'] === true ? 'unselected' : 'not_applicable',
      waterSourceAcknowledged: null,
      radonBrochureAcknowledged: null,
      radonInformationAcknowledged: null,
    },

    additionalTerms: '',

    delivery: {
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      timeZone: 'America/Denver',
      electronicDeliveryAuthorized: null,
    },
  };
}