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
export const MICHIGAN_RESIDENTIAL_SALE_SECTIONS: readonly OfferSectionDefinition[] = [
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
        label: 'The property includes existing improvements and installed fixtures, plus seller-owned appliances expressly identified in this agreement, except items expressly excluded below.',
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
        label: 'Named Michigan escrow agent',
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
        helpText: 'This resale agreement currently supports cash and conventional loans. Government loan programs require separate program-specific addenda.',
        fieldPath: 'purchase.financingType',
        validation: required('Select cash or a loan type.'),
        options: [
          { value: 'cash', label: 'Cash' },
          { value: 'conventional', label: 'Conventional loan' },
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
        label: 'inspection period (calendar days after acceptance)',
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
          match: 'any',
          conditions: [
            { fieldPath: 'conditions.financing', operator: 'is_true' },
            { fieldPath: 'conditions.appraisal', operator: 'is_true' },
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
    description: 'Stated calendar dates end at 11:59 p.m. in the property time zone shown in this offer. Required documents must be delivered before the applicable statutory deadline.',
    questions: [
      {
        id: 'seller-date',
        type: 'date',
        label: 'Deadline for optional additional seller documents (if agreed)',
        fieldPath: 'deadlines.sellerDisclosureDate',
        helpText: 'This optional date does not postpone any mandatory pre-agreement disclosure obligation.',
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
  { id: 'disclosures', title: 'Seller disclosures and property records', questions: [
    { id: 'propertyConditionStatus', type: 'single_choice', label: "Michigan seller disclosure or documented lawful exception", fieldPath: 'disclosures.propertyConditionStatus', validation: required('Select the actual receipt status.'), options: [{value:'received',label:'Received and reviewed the uploaded document'},{value:'pending',label:'Not yet received or reviewed'}], helpText: "Upload the applicable signed statement. A lawful exception needs signed evidence identifying its statutory basis. Receipt of that evidence is not an acknowledgement of a nonexistent disclosure." },
    { id: 'statutoryPacketStatus', type: 'single_choice', label: "Property-specific statutory and local records", fieldPath: 'disclosures.statutoryPacketStatus', validation: required('Select the actual receipt status.'), options: [{value:'received',label:'Received and reviewed the uploaded document'},{value:'pending',label:'Not yet received or reviewed'}], helpText: "Provide property-specific local water/septic, environmental and other transfer records, or a signed statement identifying why none is required. In Washtenaw County confirm the applicable time-of-sale water/septic inspection and approval requirements. Confirm local rules elsewhere. This packet supplements the statutory Seller Disclosure Statement and does not replace it." },
    {id:'hoa-seller',type:'yes_no',label:'Seller reports an owners association',fieldPath:'disclosures.sellerReportsHoa',readOnly:true,validation:required('The seller must answer the association question.')},
    { id: 'hoaDocumentsStatus', type: 'single_choice', label: "Association resale documents", fieldPath: 'disclosures.hoaDocumentsStatus', validation: required('Select the actual receipt status.'), options: [{value:'received',label:'Received and reviewed the uploaded document'},{value:'pending',label:'Not yet received or reviewed'},{value:'not_applicable',label:'Seller reports no association'}], helpText: "Provide property-specific governing documents, fees and assessments. Developer condominium sales are outside this resale workflow." },
    { id: 'leadPaintStatus', type: 'single_choice', label: "Federal lead-based paint packet", fieldPath: 'disclosures.leadPaintStatus', validation: required('Select the actual receipt status.'), options: [{value:'received',label:'Received and reviewed the uploaded document'},{value:'pending',label:'Not yet received or reviewed'},{value:'built_1978_or_later',label:'Listing confirms construction after 1977'},{value:'exempt',label:'Documented federal exemption received'}], helpText: "For covered housing, receive the signed statement, available records and EPA pamphlet before being bound. An inspection waiver does not waive disclosure." },
    {id:'lead-inspection',type:'single_choice',label:'Lead inspection opportunity',fieldPath:'disclosures.leadInspectionSelection',visibleWhen:{match:'all',conditions:[{fieldPath:'disclosures.leadPaintStatus',operator:'equals',value:'received'}]},validation:required('Select the inspection opportunity.'),options:[{value:'ten_days',label:'10 days'},{value:'waived',label:'Inspection opportunity waived in writing'},{value:'other_period',label:'Different period agreed in writing'}]},
    {id:'lead-days',type:'number',label:'Agreed lead inspection days',fieldPath:'disclosures.leadInspectionDays',visibleWhen:{match:'all',conditions:[{fieldPath:'disclosures.leadInspectionSelection',operator:'equals',value:'other_period'}]},validation:{required:true,minimum:1,maximum:60,message:'Enter 1 to 60 days.'}},
    {id:'tax-warning',type:'acknowledgement',label:'I read the property tax information.',fieldPath:'disclosures.taxNoticeAcknowledged',helpText:"A qualifying transfer can uncap taxable value in the calendar year following transfer, subject to statutory exceptions. The seller’s current taxes do not predict the buyer’s future tax bill. Contact the local assessor about taxable value and exemptions. The new owner must file Property Transfer Affidavit Form 2766 with the local assessor within 45 days of transfer.",validation:required('Read and acknowledge the tax information.')},
    {id:'radon-warning',type:'acknowledgement',label:'I read the radon information.',fieldPath:'disclosures.radonNoticeAcknowledged',helpText:"Radon and other known environmental hazards must be addressed in the applicable Seller Disclosure Statement. Consider independent testing. This agreement does not represent that Michigan requires every seller to obtain a new radon test.",validation:required('Read and acknowledge the radon information.')},
    {id:'leases',type:'yes_no',label:'Seller reports existing leases',fieldPath:'disclosures.sellerReportsExistingLeases',readOnly:true,validation:required('The seller must answer the leases question.')},
    {id:'lease-review',type:'acknowledgement',label:'I reviewed the seller’s lease statement and any attached leases.',fieldPath:'disclosures.leaseStatementAcknowledged',validation:required('Acknowledge the lease statement.')},
    {id:'late-delivery',type:'information',label:'Applicable Michigan late or amended disclosure termination rights are preserved. The statutory delivery windows are 72 hours for in-person delivery and 120 hours for registered mail, with rights expiring on transfer by deed or installment sales contract. An electronic delivery clock is not inferred.'}
  ] },
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
        helpText: 'Leave blank if there are no other terms. Ask a Michigan attorney to review any new legal language.',
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