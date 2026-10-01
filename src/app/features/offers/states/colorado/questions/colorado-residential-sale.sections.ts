import type { OfferSectionDefinition } from '../../../engine/models/offer-section-definition';
import type {
  OfferQuestionDefinition,
  OfferQuestionVisibilityRule,
  OfferTextQuestion,
} from '../../../engine/models/offer-question-definition';

const when = (
  fieldPath: string,
  value: unknown,
): OfferQuestionVisibilityRule => ({
  match: 'all',
  conditions: [
    { fieldPath, operator: 'equals', value },
  ],
});

const nonempty = (
  fieldPath: string,
): OfferQuestionVisibilityRule => ({
  match: 'all',
  conditions: [
    { fieldPath, operator: 'is_not_empty' },
  ],
});

const required = {
  required: true,
  message: 'Complete this question.',
};

const yn = (
  path: string,
  label: string,
  helpText = '',
): OfferQuestionDefinition => ({
  id: path,
  fieldPath: path,
  type: 'yes_no',
  label,
  helpText,
  validation: required,
});

const pick = (
  path: string,
  label: string,
  options: readonly (readonly [string, string])[],
  helpText = '',
): OfferQuestionDefinition => ({
  id: path,
  fieldPath: path,
  type: 'single_choice',
  label,
  helpText,
  validation: required,
  options: options.map(([value, optionLabel]) => ({
    value,
    label: optionLabel.toUpperCase(),
  })),
});

const txt = (
  path: string,
  label: string,
  needed = false,
  helpText = '',
): OfferTextQuestion => ({
  id: path,
  fieldPath: path,
  type: 'textarea',
  label,
  helpText,
  ...(needed ? { validation: required } : {}),
});

const cash = (
  path: string,
  label: string,
  helpText = '',
): OfferQuestionDefinition => ({
  id: path,
  fieldPath: path,
  type: 'currency',
  label,
  helpText,
  validation: {
    ...required,
    minimum: 0,
  },
});

const date = (
  key: string,
  label: string,
  helpText = '',
): OfferQuestionDefinition => ({
  id: `deadlines.${key}`,
  fieldPath: `deadlines.${key}`,
  type: 'date',
  label,
  helpText,
  validation: required,
});

const info = (
  id: string,
  label: string,
): OfferQuestionDefinition => ({
  id,
  type: 'information',
  label,
});

const payer = (
  path: string,
  label: string,
  split = false,
): OfferQuestionDefinition =>
  pick(
    path,
    label,
    split
      ? [
        ['buyer', 'BUYER'],
        ['seller', 'SELLER'],
        ['split', 'ONE-HALF EACH'],
      ]
      : [
        ['buyer', 'BUYER'],
        ['seller', 'SELLER'],
      ],
  );

const shown = (
  question: OfferQuestionDefinition,
  field: string,
  value: unknown,
): OfferQuestionDefinition => ({
  ...question,
  visibleWhen: when(field, value),
});

const fact = (
  key: string,
  label: string,
): OfferQuestionDefinition => ({
  ...txt(`propertyFacts.${key}`, label),
  readOnly: true,
});

const appraisalVisible: OfferQuestionVisibilityRule = {
  match: 'all',
  conditions: [
    {
      fieldPath: 'conditions.appraisal',
      operator: 'is_true',
    },
    {
      fieldPath: 'purchase.newLoanType',
      operator: 'not_equals',
      value: 'fha',
    },
    {
      fieldPath: 'purchase.newLoanType',
      operator: 'not_equals',
      value: 'va',
    },
  ],
};

const surveyVisible: OfferQuestionVisibilityRule = {
  match: 'all',
  conditions: [
    {
      fieldPath: 'conditions.newSurvey',
      operator: 'not_equals',
      value: 'none',
    },
    {
      fieldPath: 'conditions.newSurvey',
      operator: 'not_equals',
      value: 'unselected',
    },
  ],
};

const leadVisible: OfferQuestionVisibilityRule = {
  match: 'all',
  conditions: [
    {
      fieldPath: 'disclosures.leadPaintStatus',
      operator: 'equals',
      value: 'received',
    },
    {
      fieldPath: 'disclosures.leadInspectionChoice',
      operator: 'equals',
      value: 'deadline',
    },
  ],
};

export const COLORADO_RESIDENTIAL_SALE_SECTIONS:
  readonly OfferSectionDefinition[] = [
    {
      id: 'parties',
      title: 'Buyers and sellers',
      questionLayout: 'cards',
      questions: [
        pick(
          'elections.vesting',
          'How will the buyers hold title?',
          [
            ['joint_tenants', 'JOINT TENANTS'],
            ['tenants_in_common', 'TENANTS IN COMMON'],
            ['other', 'OTHER'],
          ],
          'Joint tenancy generally includes survivorship; tenancy in common generally permits separately transferable shares. Confirm the proposed ownership with the closing company.',
        ),
        shown(
          txt(
            'elections.vestingOther',
            'Describe the proposed ownership arrangement.',
            true,
          ),
          'elections.vesting',
          'other',
        ),
      ],
    },
    {
      id: 'property',
      title: 'Property and included items',
      questionLayout: 'cards',
      questions: [
        {
          ...txt(
            'legalDescription',
            'Seller-provided legal description',
            true,
          ),
          readOnly: true,
        },
        info(
          'standard-inclusions',
          'The agreement includes existing seller-owned attached fixtures and standard inclusions. Additional items below supplement that list. Seller facts are shown separately from your proposed terms.',
        ),
        fact('landArea', 'Seller-provided land area'),
        fact(
          'includedItems',
          'Seller-listed additional inclusions',
        ),
        fact('excludedItems', 'Seller-listed exclusions'),
        txt(
          'propertyItems.included',
          'What additional items do you propose to include? (Optional)',
        ),
        txt(
          'propertyItems.excluded',
          'What additional items do you propose to exclude? (Optional)',
        ),
        yn(
          'elections.separatePersonalPropertyAgreement',
          'Is a separate personal-property agreement part of this transaction?',
        ),
        shown(
          txt(
            'elections.personalPropertyAgreementDocument',
            'Identify the separate personal-property agreement.',
            true,
          ),
          'elections.separatePersonalPropertyAgreement',
          true,
        ),
        fact('leasedItems', 'Seller-reported leased equipment'),
        {
          ...yn(
            'elections.assumeLeasedItems',
            'Will you assume the identified equipment leases?',
            'Conditional on reviewing the actual leases and obtaining required lessor consent.',
          ),
          visibleWhen: nonempty('propertyFacts.leasedItems'),
        },
        fact(
          'encumberedItems',
          'Seller-reported equipment subject to debt',
        ),
        {
          ...yn(
            'elections.assumeEncumberedItems',
            'Will you assume the identified equipment debt?',
            'Subject to the documents and required creditor consent. FHA PACE obligations remain seller-paid.',
          ),
          visibleWhen: nonempty('propertyFacts.encumberedItems'),
        },
        fact(
          'solarPowerPlan',
          'Seller-reported solar power purchase agreement',
        ),
        {
          ...yn(
            'elections.assumeSolarPlan',
            'Will you assume the identified solar power purchase plan?',
            'Subject to reviewing the plan and obtaining required provider approval.',
          ),
          visibleWhen: nonempty('propertyFacts.solarPowerPlan'),
        },
        fact(
          'parkingStorage',
          'Seller-reported parking and storage rights',
        ),
        fact(
          'waterSource',
          'Seller-reported potable water source',
        ),
        fact(
          'deededWaterRights',
          'Seller-reported deeded water rights',
        ),
        fact(
          'otherWaterRights',
          'Seller-reported other water rights',
        ),
        fact('wellPermit', 'Seller-reported well and permit'),
        fact('waterStock', 'Seller-reported water stock'),
        txt(
          'propertyItems.waterRights',
          'Which identified water rights do you propose to receive? (Optional)',
          false,
          'Describe the rights and conveyance instrument. This proposal is not a statement that the seller owns rights.',
        ),
        yn(
          'elections.waterRightsExamination',
          'Do you want a right to examine the proposed water-rights transfer and terminate by a deadline?',
        ),
        shown(
          date(
            'waterRightsExamination',
            'Water-rights examination termination deadline',
          ),
          'elections.waterRightsExamination',
          true,
        ),
        fact(
          'mineralRights',
          'Seller-reported mineral interests',
        ),
        txt(
          'propertyItems.mineralRights',
          'Which identified mineral interests do you propose to receive or reserve? (Optional)',
        ),
        yn(
          'elections.mineralRightsExamination',
          'Do you want a right to examine mineral interests and terminate by a deadline?',
        ),
        shown(
          date(
            'mineralRightsExamination',
            'Mineral-rights examination termination deadline',
          ),
          'elections.mineralRightsExamination',
          true,
        ),
      ],
    },
    {
      id: 'price',
      title: 'Price and financing',
      questionLayout: 'cards',
      questions: [
        cash(
          'purchase.purchasePriceInCents',
          'What purchase price do you offer?',
        ),
        cash(
          'purchase.earnestMoneyInCents',
          'What earnest money will you pay? Enter $0 if none.',
        ),
        {
          ...txt(
            'purchase.earnestMoneyHolder',
            'Who will hold the earnest money?',
            true,
            'Enter the name of the person or company holding the deposit.',
          ),
          type: 'text',
          visibleWhen: {
            match: 'all',
            conditions: [
              {
                fieldPath: 'purchase.earnestMoneyInCents',
                operator: 'not_equals',
                value: 0,
              },
            ],
          },
        },
        {
          ...pick(
            'purchase.earnestMoneyForm',
            'How will you deliver the earnest money?',
            [
              ['Wire transfer', 'WIRE TRANSFER'],
              [
                'Certified funds',
                'CERTIFIED FUNDS / CASHIER’S CHECK',
              ],
              ['By check', 'PERSONAL CHECK'],
              ['Money order', 'MONEY ORDER'],
              ['Cash', 'CASH'],
            ],
            'Select the method you will use to deliver the deposit to its holder.',
          ),
          visibleWhen: {
            match: 'all',
            conditions: [
              {
                fieldPath: 'purchase.earnestMoneyInCents',
                operator: 'not_equals',
                value: 0,
              },
            ],
          },
        },
        {
          ...date(
            'alternativeEarnestMoney',
            'By what date must the earnest money be delivered?',
          ),
          visibleWhen: {
            match: 'all',
            conditions: [
              {
                fieldPath: 'purchase.earnestMoneyInCents',
                operator: 'not_equals',
                value: 0,
              },
            ],
          },
        },
        pick(
          'purchase.financingType',
          'How will you fund the purchase?',
          [
            ['cash', 'CASH'],
            ['new_loan', 'NEW INSTITUTIONAL LOAN'],
            ['assumption', 'EXISTING LOAN ASSUMPTION'],
          ],
          'Seller and private financing are outside this offer workflow.',
        ),
        shown(
          pick(
            'purchase.newLoanType',
            'Which new loan program will you use?',
            [
              ['conventional', 'CONVENTIONAL'],
              ['fha', 'FHA'],
              ['va', 'VA'],
              ['other', 'OTHER INSTITUTIONAL PROGRAM'],
            ],
          ),
          'purchase.financingType',
          'new_loan',
        ),
        shown(
          txt(
            'elections.otherLoanDescription',
            'Describe the other institutional loan program.',
            true,
          ),
          'purchase.newLoanType',
          'other',
        ),
        shown(
          cash(
            'purchase.newLoanAmountInCents',
            'What is the proposed new loan amount?',
          ),
          'purchase.financingType',
          'new_loan',
        ),
        {
          ...date(
            'newLoanApplication',
            'By what date will you make the required lender application for the new loan or assumption?',
          ),
          visibleWhen: {
            match: 'any',
            conditions: [
              {
                fieldPath: 'purchase.financingType',
                operator: 'equals',
                value: 'new_loan',
              },
              {
                fieldPath: 'purchase.financingType',
                operator: 'equals',
                value: 'assumption',
              },
            ],
          },
        },
        ...[
          [
            'newLoanTerms',
            'What is your deadline to terminate because the proposed loan terms are unsatisfactory?',
          ],
          [
            'newLoanAvailability',
            'What is your deadline to terminate because the loan is unavailable?',
          ],
        ].map(([key, label]) =>
          shown(
            date(key, label),
            'purchase.financingType',
            'new_loan',
          ),
        ),
        {
          ...cash(
            'elections.prohibitedFeeCapInCents',
            'What is the maximum seller payment toward fees the loan program prohibits charging the buyer?',
            'The cap never authorizes prohibited charges to the buyer.',
          ),
          visibleWhen: {
            match: 'any',
            conditions: [
              {
                fieldPath: 'purchase.newLoanType',
                operator: 'equals',
                value: 'fha',
              },
              {
                fieldPath: 'purchase.newLoanType',
                operator: 'equals',
                value: 'va',
              },
            ],
          },
        },
        ...(
          [
            [
              'estimatedBalanceInCents',
              'Seller-reported assumption balance',
              'currency',
            ],
            [
              'balanceAsOf',
              'Balance estimate date',
              'text',
            ],
            [
              'ratePercent',
              'Current annual interest rate (%)',
              'number',
            ],
            [
              'principalInterestPaymentInCents',
              'Current principal and interest payment',
              'currency',
            ],
            ['paymentPeriod', 'Payment period', 'text'],
            [
              'escrowRealEstateTaxes',
              'Escrow includes real estate taxes',
              'yes_no',
            ],
            [
              'escrowPropertyInsurance',
              'Escrow includes property insurance',
              'yes_no',
            ],
            [
              'escrowMortgageInsurance',
              'Escrow includes mortgage insurance',
              'yes_no',
            ],
            [
              'escrowOther',
              'Other escrow components',
              'text',
            ],
          ] as const
        ).map(([key, label, type]) => ({
          id: `sellerLoan.${key}`,
          fieldPath: `sellerLoan.${key}`,
          type,
          label,
          readOnly: true,
          visibleWhen: when(
            'purchase.financingType',
            'assumption',
          ),
        })),
        shown(
          cash(
            'purchase.assumption.maxTransferFeeInCents',
            'What is the maximum loan transfer fee you agree to pay?',
          ),
          'purchase.financingType',
          'assumption',
        ),
        shown(
          cash(
            'purchase.assumption.maxCashIncreaseInCents',
            'How much extra closing cash will you accept if the actual loan balance is lower?',
          ),
          'purchase.financingType',
          'assumption',
        ),
        {
          id: 'assumption-rate',
          fieldPath: 'purchase.assumption.maxRatePercent',
          type: 'number',
          label:
            'What is the maximum acceptable annual interest rate at assumption (%)?',
          validation: {
            ...required,
            minimum: 0.01,
            maximum: 30,
          },
          visibleWhen: when(
            'purchase.financingType',
            'assumption',
          ),
        },
        shown(
          cash(
            'purchase.assumption.maxPaymentInCents',
            'What is the maximum acceptable principal and interest payment, excluding escrow?',
          ),
          'purchase.financingType',
          'assumption',
        ),
        shown(
          txt(
            'purchase.assumption.maxPaymentPeriod',
            'What payment period applies to that maximum (for example, month)?',
            true,
          ),
          'purchase.financingType',
          'assumption',
        ),
        shown(
          yn(
            'purchase.assumption.sellerReleaseRequired',
            'Must the lender release the seller from liability on the assumed loan?',
          ),
          'purchase.financingType',
          'assumption',
        ),
        shown(
          pick(
            'purchase.assumption.releaseEvidenceTiming',
            'When must the lender release commitment be delivered?',
            [
              [
                'approval_deadline',
                'BY LOAN TRANSFER APPROVAL DEADLINE',
              ],
              ['closing', 'AT CLOSING'],
            ],
          ),
          'purchase.assumption.sellerReleaseRequired',
          true,
        ),
        shown(
          payer(
            'purchase.assumption.releaseCostPayer',
            'Who pays the cost of obtaining the seller release?',
          ),
          'purchase.assumption.sellerReleaseRequired',
          true,
        ),
        shown(
          cash(
            'purchase.assumption.maxReleaseCostInCents',
            'What is the maximum agreed release cost?',
          ),
          'purchase.assumption.sellerReleaseRequired',
          true,
        ),
        ...[
          [
            'existingLoan',
            'By what date must the seller deliver the existing-loan documents?',
          ],
          [
            'existingLoanTermination',
            'What is your deadline to terminate after reviewing those documents?',
          ],
          [
            'loanTransferApproval',
            'By what date must lender approval of the assumption be obtained?',
          ],
        ].map(([key, label]) =>
          shown(
            date(key, label),
            'purchase.financingType',
            'assumption',
          ),
        ),
        {
          ...cash(
            'purchase.cashAtClosingInCents',
            'Remaining purchase-price cash at closing',
            'Calculated: price minus earnest money minus new loan or approximate assumption balance. Excludes closing costs, prepaids, prorations and other adjustments.',
          ),
          readOnly: true,
        },
        yn(
          'purchase.availableCashConfirmed',
          'Are funds at least equal to this amount immediately verifiable and available?',
          'NO records your representation; it does not automatically prevent an offer.',
        ),
        cash(
          'purchase.sellerConcessionsInCents',
          'What seller credit do you request? Enter $0 if none.',
          'Separate from the purchase-price funding calculation and subject to lender limits.',
        ),
        yn(
          'elections.principalResidence',
          'Will you occupy the property as your principal residence?',
        ),
      ],
    },
    {
      id: 'contingencies',
      title: 'Buyer contingencies and inspections',
      questionLayout: 'cards',
      questions: [
        yn(
          'conditions.inspection',
          'Do you want inspection termination and objection rights?',
          'YES permits evaluation at your expense under the contract deadlines. NO omits these negotiated inspection rights but does not waive separate statutory rights.',
        ),
        ...[
          [
            'inspectionTermination',
            'Inspection termination deadline',
          ],
          [
            'inspectionObjection',
            'Inspection objection deadline',
          ],
          [
            'inspectionResolution',
            'Inspection resolution deadline',
          ],
        ].map(([key, label]) =>
          shown(
            date(key, label),
            'conditions.inspection',
            true,
          ),
        ),
        {
          ...yn(
            'conditions.appraisal',
            'Do you want an ordinary appraisal contingency?',
            'FHA and VA value protections apply automatically and are not waived by ordinary appraisal choices.',
          ),
          visibleWhen: {
            match: 'all',
            conditions: [
              {
                fieldPath: 'purchase.newLoanType',
                operator: 'not_equals',
                value: 'fha',
              },
              {
                fieldPath: 'purchase.newLoanType',
                operator: 'not_equals',
                value: 'va',
              },
            ],
          },
        },
        shown(
          payer(
            'elections.appraisalPayer',
            'Who will pay for the appraisal, subject to loan-program restrictions?',
          ),
          'conditions.appraisal',
          true,
        ),
        ...[
          ['appraisal', 'Appraisal delivery deadline'],
          [
            'appraisalObjection',
            'Appraisal objection deadline',
          ],
          [
            'appraisalResolution',
            'Appraisal resolution deadline',
          ],
        ].map(([key, label]) => ({
          ...date(key, label),
          visibleWhen: appraisalVisible,
        })),
        yn(
          'elections.insuranceReview',
          'Do you want a right to terminate if property insurance is unsatisfactory or unavailable?',
        ),
        shown(
          date(
            'insuranceTermination',
            'Property insurance termination deadline',
          ),
          'elections.insuranceReview',
          true,
        ),
        yn(
          'elections.dueDiligenceReview',
          'Do you want to review leases, equipment debt or leases, solar plans, permits and other due-diligence records before proceeding?',
        ),
        shown(
          txt(
            'elections.dueDiligenceOther',
            'What additional due-diligence documents do you request? (Optional)',
          ),
          'elections.dueDiligenceReview',
          true,
        ),
        ...[
          [
            'dueDiligenceDelivery',
            'Due-diligence document delivery deadline',
          ],
          [
            'dueDiligenceObjection',
            'Due-diligence objection deadline',
          ],
          [
            'dueDiligenceResolution',
            'Due-diligence resolution deadline',
          ],
        ].map(([key, label]) =>
          shown(
            date(key, label),
            'elections.dueDiligenceReview',
            true,
          ),
        ),
        yn(
          'conditions.saleOfBuyerProperty',
          'Must another property sell and close for this purchase to proceed?',
        ),
        shown(
          txt(
            'conditions.saleOfBuyerPropertyAddress',
            'What property must sell and close?',
            true,
          ),
          'conditions.saleOfBuyerProperty',
          true,
        ),
        shown(
          date(
            'conditionalSale',
            'Deadline for that property to sell and close',
          ),
          'conditions.saleOfBuyerProperty',
          true,
        ),
      ],
    },
    {
      id: 'title',
      title: 'Title insurance, title review and ILC or survey',
      questionLayout: 'cards',
      questions: [
        payer(
          'conditions.ownerTitlePolicyPayer',
          "Who will select the title company and pay for the owner's title evidence and policy?",
        ),
        pick(
          'elections.titleEvidence',
          'What title evidence must be provided?',
          [
            [
              'commitment',
              'TITLE INSURANCE COMMITMENT',
            ],
            ['abstract', 'CERTIFIED ABSTRACT OF TITLE'],
          ],
          'A commitment describes the proposed policy and exceptions; an abstract summarizes recorded history. An abstract is not an insurance policy.',
        ),
        yn(
          'elections.extendedCoverage',
          "Do you require owner's extended coverage (OEC), if available from the insurer?",
        ),
        shown(
          pick(
            'elections.extendedCoveragePayer',
            'Who pays the additional OEC premium?',
            [
              ['buyer', 'BUYER'],
              ['seller', 'SELLER'],
              ['split', 'ONE-HALF EACH'],
              ['other', 'OTHER ALLOCATION'],
            ],
          ),
          'elections.extendedCoverage',
          true,
        ),
        shown(
          txt(
            'elections.extendedCoverageOther',
            'Describe the OEC premium allocation.',
            true,
          ),
          'elections.extendedCoveragePayer',
          'other',
        ),
        payer(
          'elections.taxCertificatePayer',
          'Who pays for the tax certificate?',
        ),
        ...[
          [
            'recordTitle',
            'Record-title evidence and tax-certificate delivery deadline',
          ],
          [
            'recordTitleObjection',
            'Record-title objection deadline',
          ],
          [
            'offRecordTitle',
            'Off-record title information delivery deadline',
          ],
          [
            'offRecordTitleObjection',
            'Off-record title objection deadline',
          ],
          ['titleResolution', 'Title resolution deadline'],
        ].map(([key, label]) => date(key, label)),
        fact(
          'offRecordMatters',
          'Seller-reported off-record matters',
        ),
        fact(
          'thirdPartyRights',
          'Seller-reported third-party approval or purchase rights',
        ),
        {
          ...date(
            'thirdPartyApproval',
            'Third-party approval deadline',
          ),
          visibleWhen: nonempty('propertyFacts.thirdPartyRights'),
        },
        pick(
          'conditions.newSurvey',
          'What new property report do you require?',
          [
            ['none', 'NONE'],
            [
              'ilc',
              'NEW IMPROVEMENT LOCATION CERTIFICATE (ILC)',
            ],
            ['survey', 'NEW SURVEY'],
          ],
          'An ILC shows improvements relative to apparent boundaries; it is not a boundary survey.',
        ),
        {
          ...payer(
            'elections.surveyOrderer',
            'Who will order the new ILC or survey?',
          ),
          visibleWhen: surveyVisible,
        },
        {
          ...payer(
            'conditions.surveyPayer',
            'Who will pay for the new ILC or survey?',
          ),
          visibleWhen: surveyVisible,
        },
        shown(
          txt(
            'elections.surveyDescription',
            'Describe the new survey type, form and requirements.',
            true,
          ),
          'conditions.newSurvey',
          'survey',
        ),
        {
          ...txt(
            'elections.surveyOtherRecipients',
            'Who else must receive it, in addition to buyer, seller and title provider? (Optional)',
          ),
          visibleWhen: surveyVisible,
        },
        ...[
          [
            'survey',
            'New ILC or survey delivery deadline',
          ],
          [
            'surveyObjection',
            'New ILC or survey objection deadline',
          ],
          [
            'surveyResolution',
            'New ILC or survey resolution deadline',
          ],
        ].map(([key, label]) => ({
          ...date(key, label),
          visibleWhen: surveyVisible,
        })),
      ],
    },
    {
      id: 'closing',
      title: 'Closing and possession',
      questionLayout: 'cards',
      questions: [
        date('closing', 'On what date will closing occur?'),
        txt(
          'elections.closingCompany',
          'Closing company and contact (if known)',
        ),
        yn(
          'elections.closingInstructions',
          'Are separate closing instructions being signed with this agreement?',
        ),
        shown(
          txt(
            'elections.closingInstructionsDocument',
            'Identify those closing instructions.',
            true,
          ),
          'elections.closingInstructions',
          true,
        ),
        pick(
          'conditions.deedType',
          'What deed must the seller deliver?',
          [
            ['special_warranty', 'SPECIAL WARRANTY DEED'],
            ['general_warranty', 'GENERAL WARRANTY DEED'],
            ['bargain_sale', 'BARGAIN AND SALE DEED'],
            ['quitclaim', 'QUITCLAIM DEED'],
          ],
          'These deeds provide different title assurances. Special warranty covers claims arising through the seller; quitclaim does not provide title warranties.',
        ),
        payer(
          'conditions.closingFeePayer',
          'Who pays the closing service fee?',
          true,
        ),
        ...[
          [
            'associationRecordFeePayer',
            'Who pays the association record-change fee?',
          ],
          [
            'associationReservePayer',
            'Who pays association reserves or working capital required at closing?',
          ],
          [
            'associationOtherFeePayer',
            'Who pays other association transfer fees?',
          ],
        ].map(([key, label]) =>
          shown(
            payer(`elections.${key}`, label, true),
            'disclosures.sellerReportsHoa',
            true,
          ),
        ),
        ...[
          ['transferTaxPayer', 'Who pays any local transfer tax?'],
          ['salesUseTaxPayer', 'Who pays any sales or use tax?'],
          [
            'privateTransferFeePayer',
            'Who pays any private transfer fee?',
          ],
          [
            'waterTransferFeePayer',
            'Who pays any water-rights transfer fee?',
          ],
          [
            'utilityTransferFeePayer',
            'Who pays any utility transfer fee?',
          ],
        ].map(([key, label]) =>
          payer(`elections.${key}`, label, true),
        ),
        pick(
          'elections.taxProration',
          'How will real estate taxes be prorated?',
          [
            ['previous_year', 'PREVIOUS CALENDAR YEAR'],
            [
              'latest_assessment',
              'MOST RECENT MILL LEVY AND ASSESSED OR ACTUAL VALUE',
            ],
            ['other', 'OTHER METHOD'],
          ],
        ),
        shown(
          txt(
            'elections.taxProrationOther',
            'Describe the tax-proration method.',
            true,
          ),
          'elections.taxProration',
          'other',
        ),
        payer(
          'conditions.specialAssessmentPayer',
          'Who pays unpaid installments of special assessments attributable to improvements not yet installed?',
        ),
        fact(
          'leases',
          'Seller-reported occupancy agreements',
        ),
        {
          ...pick(
            'elections.rentProration',
            'How will rents be prorated?',
            [
              ['received', 'RENTS ACTUALLY RECEIVED'],
              ['accrued', 'RENTS ACCRUED'],
            ],
          ),
          visibleWhen: nonempty('propertyFacts.leases'),
        },
        txt(
          'elections.otherProrations',
          'Other agreed prorations (optional)',
        ),
        {
          id: 'possession-date-time',
          fieldPath: 'deadlines.possession',
          timeFieldPath: 'deadlines.possessionTime',
          type: 'date_time',
          label:
            'When will possession be delivered? (Mountain Time)',
          validation: required,
          helpText:
            'Choose the possession date and time in Mountain Time.',
        },
        cash(
          'conditions.possessionDelayChargeInCents',
          'What daily amount will apply if the seller fails to deliver possession on time?',
        ),
        txt(
          'elections.postClosingOccupancyDocument',
          'Identify the signed post-closing occupancy agreement if possession is after closing.',
          false,
          'Required for delayed possession. Identify the actual attachment; a later date alone does not create an occupancy agreement.',
        ),
      ],
    },
    {
      id: 'disclosures',
      title: 'Disclosures and buyer acknowledgements',
      questionLayout: 'cards',
      questions: [
        pick(
          'disclosures.sellerPropertyStatus',
          'Have you actually received and reviewed the seller property disclosure?',
          [['received', 'RECEIVED AND REVIEWED']],
        ),
        yn(
          'disclosures.radonBrochureAcknowledged',
          'Have you received the Colorado radon brochure?',
        ),
        yn(
          'disclosures.radonInformationAcknowledged',
          'Have you reviewed the seller radon information and any supplied test or mitigation records?',
        ),
        yn(
          'disclosures.waterSourceAcknowledged',
          'Have you received and reviewed the potable water source statement and any applicable well permit?',
        ),
        pick(
          'disclosures.leadPaintStatus',
          'Have you received the applicable lead disclosure, available records and EPA pamphlet?',
          [
            ['received', 'RECEIVED'],
            [
              'not_applicable',
              'NOT APPLICABLE — BUILT IN 1978 OR LATER',
            ],
          ],
          'Waiving an inspection does not waive delivery of lead disclosures or records.',
        ),
        shown(
          pick(
            'disclosures.leadInspectionChoice',
            'How do you want to handle the lead inspection opportunity?',
            [
              [
                'deadline',
                'CHOOSE A LEAD INSPECTION TERMINATION DATE',
              ],
              [
                'waived',
                'WAIVE THE LEAD INSPECTION OPPORTUNITY',
              ],
            ],
            'Federal law provides a 10-day opportunity unless the parties agree in writing to a different period. Your chosen date becomes the proposed agreed deadline when both parties sign.',
          ),
          'disclosures.leadPaintStatus',
          'received',
        ),
        {
          ...date(
            'leadTermination',
            'By what date may you terminate after a lead risk assessment or inspection?',
            'Choose a calendar date. The inspection waiver removes this deadline, but never the disclosure requirements.',
          ),
          visibleWhen: leadVisible,
        },
        {
          ...yn(
            'disclosures.sellerReportsHoa',
            'Seller reports an owners association',
          ),
          readOnly: true,
        },
        shown(
          pick(
            'disclosures.associationStatus',
            'Have you received the association documents?',
            [
              ['received', 'RECEIVED'],
              ['pending', 'NOT YET RECEIVED'],
            ],
          ),
          'disclosures.sellerReportsHoa',
          true,
        ),
        ...[
          [
            'associationDocuments',
            'Association document delivery deadline',
          ],
          [
            'associationTermination',
            'Association review termination deadline',
          ],
        ].map(([key, label]) =>
          shown(
            date(key, label),
            'disclosures.sellerReportsHoa',
            true,
          ),
        ),
        {
          ...pick(
            'propertyFacts.metroDistrict',
            'Seller metropolitan-district applicability',
            [
              [
                'covered',
                'COVERED METROPOLITAN DISTRICT',
              ],
              [
                'not_applicable',
                'NOT A COVERED METROPOLITAN DISTRICT',
              ],
            ],
          ),
          readOnly: true,
        },
        fact(
          'metroDistrictWebsite',
          'Seller-provided official district website',
        ),
        fact(
          'metroDistrictDisclosure',
          'Seller-provided district disclosure and records reference',
        ),
      ],
    },
    {
      id: 'additional',
      title: 'Other agreed terms and attachments',
      questionLayout: 'cards',
      questions: [
        pick(
          'elections.buyerDefaultRemedy',
          'If the buyer defaults without a valid right to terminate, what remedy will the seller have?',
          [
            ['liquidated_damages', 'LIQUIDATED DAMAGES'],
            [
              'specific_performance',
              'SPECIFIC PERFORMANCE AND DAMAGES',
            ],
          ],
          'Liquidated damages generally limits the seller to the earnest money, with specified surviving obligations and attorney-fee exceptions. The other choice permits seeking a court order enforcing the purchase or damages. A valid termination is not a default.',
        ),
        txt(
          'elections.incorporatedAttachments',
          'Identify each attachment incorporated as a contract term (optional).',
          false,
          'Use document title, date and version. Informational receipt is different from incorporating terms.',
        ),
        txt(
          'additionalTerms',
          'Additional agreed terms (optional)',
        ),
      ],
    },
    {
      id: 'delivery',
      title: 'Review and send',
      questionLayout: 'cards',
      questions: [
        {
          ...txt(
            'deadlines.timeOfDay',
            'Daily contract deadline time (Mountain Time)',
            true,
            'Applies to contract deadlines unless a specific time is stated.',
          ),
          type: 'text',
          inputType: 'time',
        },
        yn(
          'deadlines.extendHoliday',
          'Will deadlines falling on a weekend or applicable holiday extend to the next business day?',
        ),
        {
          id: 'expiration',
          fieldPath: 'delivery.expiresAt',
          type: 'date_time',
          timeZone: 'America/Denver',
          label:
            'When does this offer expire? (Mountain Time)',
          validation: required,
        },
        {
          id: 'electronic',
          fieldPath: 'delivery.electronicDeliveryAuthorized',
          type: 'acknowledgement',
          label:
            'I authorize electronic delivery and signatures under my NavStreet electronic transaction consent.',
          helpText:
            'You must be able to access, download and retain the agreement and disclosure attachments. The account consent explains paper-copy and withdrawal procedures.',
          validation: required,
        },
      ],
    },
  ];