import type { OfferSectionDefinition } from '../../../engine/models/offer-section-definition';

const required = (message: string) => ({ required: true, message });

const yn = (path: string, label: string, message: string) => ({
  id: path,
  type: 'yes_no' as const,
  label,
  fieldPath: path,
  validation: required(message),
});

/** NavStreet-authored resale agreement. The statutory seller report is a separate document. */
export const FLORIDA_RESIDENTIAL_SALE_SECTIONS: readonly OfferSectionDefinition[] = [
  {
    id: 'parties',
    title: 'Buyers and sellers',
    description: 'Review the parties copied from the listing and account.',
    questions: [],
  },
  {
    id: 'property',
    title: 'Property and included items',
    questions: [
      {
        id: 'legal-description',
        type: 'textarea',
        label: 'Seller-provided legal description',
        fieldPath: 'legalDescription',
        readOnly: true,
        validation: required('The seller must provide the recorded legal description on the listing.'),
        helpText: 'Copied from the seller’s listing. Ask the seller to correct the listing if this description is missing.',
      },
      {
        id: 'included-by-default',
        type: 'information',
        label: 'The property includes existing improvements and installed fixtures, plus seller-owned appliances and other items listed in the Florida agreement, except items expressly excluded below.',
      },
      {
        id: 'included',
        type: 'textarea',
        label: 'Additional personal property included',
        fieldPath: 'propertyItems.included',
        placeholder: 'For example: lawnmower, patio furniture, or a freestanding appliance',
      },
      {
        id: 'excluded',
        type: 'textarea',
        label: 'Specific items excluded from the purchase',
        fieldPath: 'propertyItems.excluded',
        helpText: 'List each fixture or personal-property item the seller will keep. An unlisted installed fixture remains included.',
      },
      {
        id: 'leased-items',
        type: 'textarea',
        label: 'Leased equipment and transfer arrangements',
        fieldPath: 'propertyItems.leasedItemsDescription',
        helpText: 'Identify leased appliances, tanks, solar equipment or other items and whether buyer will assume a lease.',
      },
    ],
  },
  {
    id: 'purchase',
    title: 'Price, deposit, and financing',
    questions: [
      {
        id: 'price',
        type: 'currency',
        label: 'Purchase price',
        fieldPath: 'purchase.purchasePriceInCents',
        validation: {
          required: true,
          minimum: 1,
          message: 'Enter a purchase price above $0.',
        },
      },
      yn(
        'purchase.hasEarnestMoney',
        'Does this offer include an initial escrow deposit?',
        'Select whether an initial deposit is offered.'
      ),
      {
        id: 'deposit',
        type: 'currency',
        label: 'Initial escrow deposit',
        fieldPath: 'purchase.earnestMoneyInCents',
        visibleWhen: {
          match: 'all',
          conditions: [
            { fieldPath: 'purchase.hasEarnestMoney', operator: 'is_true' },
          ],
        },
        validation: {
          required: true,
          minimum: 1,
          message: 'Enter the offered initial deposit.',
        },
      },
      {
        id: 'holder',
        type: 'text',
        label: 'Named Florida escrow agent',
        fieldPath: 'purchase.earnestMoneyHolder',
        visibleWhen: {
          match: 'all',
          conditions: [
            { fieldPath: 'purchase.hasEarnestMoney', operator: 'is_true' },
          ],
        },
        validation: required('Name the agent who will hold the deposit.'),
      },
      {
        id: 'due-days',
        type: 'number',
        label: 'Calendar days after acceptance to deliver the initial deposit',
        fieldPath: 'purchase.earnestMoneyDueDays',
        visibleWhen: {
          match: 'all',
          conditions: [
            { fieldPath: 'purchase.hasEarnestMoney', operator: 'is_true' },
          ],
        },
        validation: {
          required: true,
          minimum: 1,
          maximum: 30,
          message: 'Enter 1 to 30 days.',
        },
      },
      {
        id: 'funding',
        type: 'single_choice',
        label: 'How will the purchase be funded?',
        fieldPath: 'purchase.financingType',
        validation: required('Select cash or a loan type.'),
        options: [
          { value: 'cash', label: 'Cash' },
          { value: 'conventional', label: 'Conventional loan' },
          { value: 'fha', label: 'FHA loan' },
          { value: 'va', label: 'VA loan' },
          { value: 'usda', label: 'USDA loan' },
        ],
      },
      {
        id: 'loan',
        type: 'currency',
        label: 'Proposed loan amount',
        fieldPath: 'purchase.loanAmountInCents',
        visibleWhen: {
          match: 'all',
          conditions: [
            {
              fieldPath: 'purchase.financingType',
              operator: 'not_equals',
              value: 'cash',
            },
          ],
        },
        validation: {
          required: true,
          minimum: 1,
          message: 'Enter a loan amount above $0.',
        },
      },
      {
        id: 'loan-term',
        type: 'number',
        label: 'Proposed loan term in years',
        fieldPath: 'purchase.loanTermYears',
        visibleWhen: {
          match: 'all',
          conditions: [
            {
              fieldPath: 'purchase.financingType',
              operator: 'not_equals',
              value: 'cash',
            },
          ],
        },
        validation: {
          required: true,
          minimum: 1,
          maximum: 40,
          message: 'Enter a loan term of 1 to 40 years.',
        },
      },
      {
        id: 'concessions',
        type: 'currency',
        label: 'Seller concessions',
        fieldPath: 'purchase.sellerConcessionsInCents',
      },
      {
        id: 'extra-deposit',
        type: 'currency',
        label: 'Additional earnest money, if agreed',
        fieldPath: 'purchase.additionalEarnestMoneyInCents',
        visibleWhen: {
          match: 'all',
          conditions: [
            {
              fieldPath: 'conditions.additionalEarnestMoney',
              operator: 'is_true',
            },
          ],
        },
        validation: {
          required: true,
          minimum: 1,
          message: 'Enter an additional deposit above $0.',
        },
      },
      {
        id: 'extra-deposit-days',
        type: 'number',
        label: 'Calendar days after acceptance to deliver the additional deposit',
        fieldPath: 'purchase.additionalEarnestMoneyDueDays',
        visibleWhen: {
          match: 'all',
          conditions: [
            {
              fieldPath: 'conditions.additionalEarnestMoney',
              operator: 'is_true',
            },
          ],
        },
        validation: {
          required: true,
          minimum: 1,
          maximum: 60,
          message: 'Enter 1 to 60 days.',
        },
      },
    ],
  },
  {
    id: 'conditions',
    title: 'Inspection and financing conditions',
    description: 'The inspection period and any loan approval contingency affect the buyer’s cancellation and deposit rights.',
    questions: [
      {
        id: 'inspection-period',
        type: 'number',
        label: 'AS IS inspection period (calendar days after acceptance)',
        fieldPath: 'deadlines.inspectionPeriodDays',
        validation: {
          required: true,
          minimum: 1,
          maximum: 60,
          message: 'Choose 1 to 60 calendar days.',
        },
        helpText: 'The buyer may give written cancellation notice during this period if the property is unacceptable. The period starts after the agreement takes effect.',
      },
      {
        id: 'funding-condition',
        type: 'information',
        label: 'A cash offer has no loan contingency. For a financed purchase, state whether loan approval is a condition of the agreement.',
      },
      {
        ...yn(
          'conditions.financing',
          'Is this offer conditioned on loan approval?',
          'Select the loan approval condition.'
        ),
        visibleWhen: {
          match: 'all',
          conditions: [
            {
              fieldPath: 'purchase.financingType',
              operator: 'not_equals',
              value: 'cash',
            },
          ],
        },
      },
      {
        ...yn(
          'conditions.appraisal',
          'Is an appraisal or lender valuation required?',
          'Select the appraisal condition.'
        ),
        visibleWhen: {
          match: 'all',
          conditions: [
            {
              fieldPath: 'purchase.financingType',
              operator: 'not_equals',
              value: 'cash',
            },
          ],
        },
      },
      {
        id: 'application-days',
        type: 'number',
        label: 'Days after acceptance to apply for financing',
        fieldPath: 'purchase.loanApplicationDays',
        visibleWhen: {
          match: 'all',
          conditions: [
            { fieldPath: 'conditions.financing', operator: 'is_true' },
          ],
        },
        validation: {
          required: true,
          minimum: 1,
          maximum: 30,
          message: 'Enter 1 to 30 days.',
        },
      },
      {
        id: 'approval-days',
        type: 'number',
        label: 'Loan approval period (calendar days after acceptance)',
        fieldPath: 'purchase.loanApprovalDays',
        visibleWhen: {
          match: 'all',
          conditions: [
            { fieldPath: 'conditions.financing', operator: 'is_true' },
          ],
        },
        validation: {
          required: true,
          minimum: 1,
          maximum: 90,
          message: 'Enter 1 to 90 days.',
        },
      },
      yn(
        'conditions.saleOfBuyersProperty',
        'Conditioned on the sale of another property?',
        'Select the sale condition.'
      ),
      {
        id: 'sale-property-terms',
        type: 'textarea',
        label: 'Terms for sale of the buyer’s property',
        fieldPath: 'additionalTerms',
        visibleWhen: {
          match: 'all',
          conditions: [
            {
              fieldPath: 'conditions.saleOfBuyersProperty',
              operator: 'is_true',
            },
          ],
        },
        validation: required(
          'Describe the property-sale condition before continuing.'
        ),
        helpText: 'Identify the property to be sold, the deadline, and what happens if that sale does not close. You may include other negotiated terms here.',
      },
      {
        ...yn(
          'conditions.additionalEarnestMoney',
          'Will an additional earnest money deposit be due?',
          'Select an additional-deposit option.'
        ),
        visibleWhen: {
          match: 'all',
          conditions: [
            { fieldPath: 'purchase.hasEarnestMoney', operator: 'is_true' },
          ],
        },
      },
    ],
  },
  {
    id: 'deadlines',
    title: 'Contract deadlines',
    description: 'Stated calendar dates end at 11:59 p.m. Eastern Time. Seller flood, condition and applicable HOA summaries must be provided before contract execution.',
    questions: [
      {
        id: 'seller-date',
        type: 'date',
        label: 'Deadline for optional additional seller documents (if agreed)',
        fieldPath: 'deadlines.sellerDisclosureDate',
        helpText: 'Required flood, condition and applicable HOA disclosures are due before contract execution regardless of this optional date.',
      },
      {
        id: 'inspection-date-note',
        type: 'information',
        label: 'The inspection deadline is calculated from the effective date using the inspection period selected in Section 4.',
      },
      {
        id: 'financing-date-note',
        type: 'information',
        label: 'The financing deadline is calculated from the effective date using the loan approval period selected in Section 4.',
      },
      {
        id: 'settlement-date',
        type: 'date',
        label: 'Settlement deadline',
        fieldPath: 'deadlines.settlementDate',
        validation: required('Set the settlement deadline.'),
      },
    ],
  },
  {
    id: 'settlement',
    title: 'Title, settlement, and possession',
    questionLayout: 'cards',
    questions: [
      {
        id: 'possession-note',
        type: 'information',
        label: 'Seller delivers vacant possession and keys at closing. Any tenancy or occupancy continuing after closing requires separately agreed written terms.',
      },
      {
        id: 'title-payer',
        type: 'single_choice',
        label: 'Who pays for the owner’s title insurance policy and title search?',
        fieldPath: 'settlement.titlePolicyPayer',
        validation: required('Choose who pays for the owner’s title policy.'),
        options: [
          { value: 'seller', label: 'Seller' },
          { value: 'buyer', label: 'Buyer' },
        ],
      },
      {
        id: 'closing-agent',
        type: 'text',
        label: 'Closing agent or title company',
        fieldPath: 'settlement.closingAgentName',
        validation: required('Identify the closing agent or title company.'),
      },
      {
        id: 'title-evidence',
        type: 'number',
        label: 'Days before closing to deliver title evidence',
        fieldPath: 'settlement.titleEvidenceDaysBeforeClosing',
        validation: {
          required: true,
          minimum: 1,
          maximum: 45,
          message: 'Enter 1 to 45 days.',
        },
      },
      {
        id: 'assessment-payer',
        type: 'single_choice',
        label: 'Who pays pre-settlement special assessments?',
        fieldPath: 'settlement.specialAssessmentPayer',
        validation: required('Select who pays special assessments.'),
        options: [
          { value: 'buyer', label: 'Buyer' },
          { value: 'seller', label: 'Seller' },
          { value: 'split', label: 'Split equally' },
        ],
      },
      {
        id: 'hoa-payer',
        type: 'single_choice',
        label: 'Who pays association transfer fees, if any?',
        fieldPath: 'settlement.hoaTransferFeePayer',
        visibleWhen: {
          match: 'all',
          conditions: [
            {
              fieldPath: 'disclosures.sellerReportsHoa',
              operator: 'is_true',
            },
          ],
        },
        validation: required(
          'Select who pays association transfer fees.'
        ),
        options: [
          { value: 'buyer', label: 'Buyer' },
          { value: 'seller', label: 'Seller' },
          { value: 'split', label: 'Split equally' },
        ],
      },
    ],
  },
  {
    id: 'disclosures',
    title: 'Seller disclosures',
    questions: [
      {
        id: 'flood-status',
        type: 'single_choice',
        label: 'Florida statutory flood disclosure (seller signed)',
        fieldPath: 'disclosures.floodStatus',
        validation: required(
          'Select whether you received the seller-signed flood disclosure.'
        ),
        options: [
          {
            value: 'received',
            label: 'I received and reviewed the seller-signed statutory flood disclosure',
          },
          {
            value: 'pending',
            label: 'I have not received the seller-signed flood disclosure yet',
          },
        ],
        helpText: 'Answer truthfully. If this disclosure is pending, ask the seller to upload it and review it before submitting an offer.',
      },
      {
        id: 'condition-status',
        type: 'single_choice',
        label: 'Seller property condition statement',
        fieldPath: 'disclosures.propertyConditionStatus',
        validation: required(
          'Select whether you received the seller condition statement.'
        ),
        options: [
          {
            value: 'received',
            label: 'I received and reviewed the seller-signed statement',
          },
          {
            value: 'pending',
            label: 'I have not received the seller-signed statement yet',
          },
        ],
        helpText: 'The seller’s statement should include known material defects and known sanitary sewer lateral defects.',
      },
      {
        id: 'hoa-seller',
        type: 'yes_no',
        label: 'Seller reports the home is in an owners association',
        fieldPath: 'disclosures.sellerReportsHoa',
        readOnly: true,
        validation: required(
          'The seller must answer the association question in the listing.'
        ),
      },
      {
        id: 'hoa-status',
        type: 'single_choice',
        label: 'Mandatory HOA disclosure summary (if applicable)',
        fieldPath: 'disclosures.hoaDocumentsStatus',
        validation: required(
          'Choose an association disclosure status.'
        ),
        options: [
          {
            value: 'received',
            label: 'I received and read the seller-signed HOA disclosure summary',
          },
          {
            value: 'pending',
            label: 'The seller reports an HOA, but I have not received the summary yet',
          },
          {
            value: 'not_applicable',
            label: 'Seller states that no mandatory HOA applies',
          },
        ],
        helpText: 'If an HOA applies and its summary is pending, ask the seller to upload it and review it before submitting an offer.',
      },
      {
        id: 'lead-status',
        type: 'single_choice',
        label: 'Federal lead-based paint packet',
        fieldPath: 'disclosures.leadPaintStatus',
        validation: required('Select the lead disclosure status.'),
        options: [
          {
            value: 'received',
            label: 'Signed seller disclosure, available records and EPA pamphlet received',
          },
          {
            value: 'pending',
            label: 'I have not received the signed lead-based paint packet yet',
          },
          {
            value: 'built_1978_or_later',
            label: 'Listing shows construction after 1977',
          },
          { value: 'exempt', label: 'Another federal exemption applies' },
        ],
      },
      {
        id: 'lead-inspection',
        type: 'single_choice',
        label: 'Buyer’s lead inspection opportunity',
        fieldPath: 'disclosures.leadInspectionSelection',
        visibleWhen: {
          match: 'all',
          conditions: [
            {
              fieldPath: 'disclosures.leadPaintStatus',
              operator: 'equals',
              value: 'received',
            },
          ],
        },
        validation: required(
          'Select the lead inspection opportunity.'
        ),
        options: [
          {
            value: 'ten_days',
            label: '10 days for inspection or risk assessment',
          },
          { value: 'waived', label: 'Buyer waives the inspection opportunity' },
          { value: 'other_period', label: 'Another period agreed in writing' },
        ],
      },
      {
        id: 'lead-inspection-days',
        type: 'number',
        label: 'Agreed inspection days',
        fieldPath: 'disclosures.leadInspectionDays',
        visibleWhen: {
          match: 'all',
          conditions: [
            {
              fieldPath: 'disclosures.leadInspectionSelection',
              operator: 'equals',
              value: 'other_period',
            },
          ],
        },
        validation: {
          required: true,
          minimum: 1,
          maximum: 60,
          message: 'Enter 1 to 60 agreed days.',
        },
      },
      {
        id: 'tax-notice',
        type: 'acknowledgement',
        label: 'I read the Florida property tax reassessment notice provided with this agreement.',
        fieldPath: 'disclosures.taxNoticeAcknowledged',
        helpText: 'BUYER SHOULD NOT RELY ON THE SELLER’S CURRENT PROPERTY TAXES AS THE AMOUNT OF PROPERTY TAXES THAT THE BUYER MAY BE OBLIGATED TO PAY IN THE YEAR SUBSEQUENT TO PURCHASE. A CHANGE OF OWNERSHIP OR PROPERTY IMPROVEMENTS TRIGGERS REASSESSMENTS OF THE PROPERTY THAT COULD RESULT IN HIGHER PROPERTY TAXES. IF YOU HAVE ANY QUESTIONS CONCERNING VALUATION, CONTACT THE COUNTY PROPERTY APPRAISER’S OFFICE FOR INFORMATION.',
        validation: required('Acknowledge the tax notice.'),
      },
      {
        id: 'radon-notice',
        type: 'acknowledgement',
        label: 'I read the Florida radon gas notice provided with this agreement.',
        fieldPath: 'disclosures.radonNoticeAcknowledged',
        helpText: 'RADON GAS: Radon is a naturally occurring radioactive gas that, when it has accumulated in a building in sufficient quantities, may present health risks to persons who are exposed to it over time. Levels of radon that exceed federal and state guidelines have been found in buildings in Florida. Additional information regarding radon and radon testing may be obtained from your county health department.',
        validation: required('Acknowledge the radon notice.'),
      },
      {
        id: 'seller-lease-statement',
        type: 'yes_no',
        label: 'Seller reports existing leases',
        fieldPath: 'disclosures.sellerReportsExistingLeases',
        readOnly: true,
        validation: required(
          'The seller must answer the leases question on the listing.'
        ),
      },
      {
        id: 'lease-acknowledgement',
        type: 'acknowledgement',
        label: 'I have reviewed the seller’s existing-leases statement, including any identified leases.',
        fieldPath: 'disclosures.leaseStatementAcknowledged',
        validation: required('Acknowledge the lease statement.'),
      },
    ],
  },
  {
    id: 'additional',
    title: 'Additional terms',
    questions: [
      {
        id: 'additional-terms',
        type: 'textarea',
        label: 'Party-provided additional terms (optional)',
        fieldPath: 'additionalTerms',
        visibleWhen: {
          match: 'all',
          conditions: [
            {
              fieldPath: 'conditions.saleOfBuyersProperty',
              operator: 'is_false',
            },
          ],
        },
        helpText: 'Leave blank if there are no other terms. Ask a Florida attorney to review any new legal language.',
      },
      {
        id: 'sale-terms-location',
        type: 'information',
        label: 'Your sale-of-property terms were entered in Purchase conditions. Return to section 4 to revise them; no further terms are required here.',
        visibleWhen: {
          match: 'all',
          conditions: [
            {
              fieldPath: 'conditions.saleOfBuyersProperty',
              operator: 'is_true',
            },
          ],
        },
      },
    ],
  },
  {
    id: 'delivery',
    title: 'Offer delivery and review',
    questions: [
      {
        id: 'expiration',
        type: 'date_time',
        label: 'Offer expires',
        fieldPath: 'delivery.expiresAt',
        validation: required('Set a future expiration date and time.'),
      },
      {
        id: 'electronic',
        type: 'acknowledgement',
        label: 'I agree to electronic delivery and signatures for this offer.',
        fieldPath: 'delivery.electronicDeliveryAuthorized',
        validation: required('Electronic delivery consent is required.'),
      },
    ],
  },
];