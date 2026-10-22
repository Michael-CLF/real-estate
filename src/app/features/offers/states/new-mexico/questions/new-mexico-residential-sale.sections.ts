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
export const NEW_MEXICO_RESIDENTIAL_SALE_SECTIONS: readonly OfferSectionDefinition[] = [
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
        label: 'Named New Mexico escrow agent',
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
    { id: 'propertyConditionStatus', type: 'single_choice', label: "New Mexico seller disclosure or documented lawful exception", fieldPath: 'disclosures.propertyConditionStatus', validation: required('Select the actual receipt status.'), options: [{value:'received',label:'Received and reviewed the uploaded document'},{value:'pending',label:'Not yet received or reviewed'},{value:'exempt',label:'Signed statutory exemption evidence reviewed'}], helpText: "This ordinary resale package does not impose a universal state-prescribed seller condition form as a prerequisite to an offer. Seller shall disclose known adverse material facts and shall not misrepresent or actively conceal conditions. A voluntarily supplied condition statement is not a warranty or substitute for inspection. Professional broker duties under 16.61.19 NMAC apply to licensed brokers; they do not make NavStreet a broker or create a statewide FSBO form requirement. A receipt answer records actual delivery, not a completed or signed separate statement." },
    { id: 'statutoryPacketStatus', type: 'single_choice', label: "Property-specific statutory and local records", fieldPath: 'disclosures.statutoryPacketStatus', validation: required('Select the actual receipt status.'), options: [{value:'received',label:'Received and reviewed the uploaded document'},{value:'pending',label:'Not yet received or reviewed'}], helpText: "Under NMSA 47-13-4, before accepting an offer the seller or seller broker shall request the county assessor tax-levy estimate at the listed price and provide the written response to buyer or buyer broker. The response includes current/prior taxes, the estimated following-year levy and the statutory warning about the stated price, current-and-correct value and actual future rates. A current seller tax bill alone is insufficient. County online printable estimates may satisfy the response requirement. When the statutory packet is marked Received, buyer electronic signature and timestamp expressly acknowledge written receipt of the assessor estimate. Pending is not an acknowledgment. NavStreet collects the assessor estimate or documented unavailability before online offers open. If not readily available, each buyer must sign the statutory waiver before making the offer. For a covered HOA lot under NMSA 47-16-11 through 47-16-13, seller shall supply the association disclosure certificate no later than seven days before closing and the applicable declaration, bylaws, covenants and rules before closing. Buyer may cancel within seven days after receipt of the certificate through the statutory notice method, without penalty; payments are refunded within fifteen days. A pending HOA certificate does not universally block offer creation. Verify actual statutory applicability and supported exceptions; condominium offerings are outside this package. Preserve statutory certificate, assessment and cancellation protections despite a separate negotiated inspection deadline. For an established on-site liquid waste system, seller shall arrange the qualified NMED property-transfer evaluation before transfer, required permitting/registration and correction of deficiencies under 20.7.3 NMAC. Evaluation reports go to NMED within fifteen days. Verify report validity and any approved extension; advanced treatment, alternative disposal and holding-tank systems require applicable ownership and operating/maintenance updates. This is a transfer requirement, not a universal pre-offer evaluation. Seller shall provide records and meet required compliance before closing; buyer may terminate before settlement if required transfer compliance is not achieved, subject to lawful return of deposits. Where 20.4.5 NMAC applies, owner shall give written notice of a clandestine drug laboratory to a proposed transferee, obtain the transferee written acknowledgment, and supply copies to NMED Hazardous Waste Bureau as required by 20.4.5.13. No unauthorized entry or occupancy is permitted while residual contamination remains subject to the notice. Separately execute the notice and acknowledgment and verify department-approved remediation before occupancy. A signed purchase agreement or generic packet status does not certify cleanup, authorize entry or submit notices to NMED. Seller must comply before transfer; known contamination is not made harmless by an as-is provision. Closing shall verify recorded legal description, ownership, title insurance, community-property/spousal joinder and acknowledged deed requirements. Seller-owned appurtenant water rights intended to convey shall be expressly identified in the deed unless lawfully reserved; provide OSE records and perform applicable county/OSE ownership updates. A well or irrigation use does not by itself establish transferable water rights. Review shared-well agreements, acequia/ditch obligations, legal access and local permits during inspection. The existing seller tax valuation is not a guarantee of buyer taxes. Federal and state withholding and sales-information reporting remain the closing agent responsibilities." },
    {id:'hoa-seller',type:'yes_no',label:'Seller reports an owners association',fieldPath:'disclosures.sellerReportsHoa',readOnly:true,validation:required('The seller must answer the association question.')},
    { id: 'hoaDocumentsStatus', type: 'single_choice', label: "Association resale documents", fieldPath: 'disclosures.hoaDocumentsStatus', validation: required('Select the actual receipt status.'), options: [{value:'received',label:'Received and reviewed the uploaded document'},{value:'pending',label:'Not yet received or reviewed'},{value:'not_applicable',label:'Seller reports no association'}], helpText: "Provide property-specific governing documents, fees and assessments. Developer condominium sales are outside this resale workflow." },
    { id: 'leadPaintStatus', type: 'single_choice', label: "Federal lead-based paint packet", fieldPath: 'disclosures.leadPaintStatus', validation: required('Select the actual receipt status.'), options: [{value:'received',label:'Received and reviewed the uploaded document'},{value:'pending',label:'Not yet received or reviewed'},{value:'built_1978_or_later',label:'Listing confirms construction after 1977'},{value:'exempt',label:'Documented federal exemption received'}], helpText: "For covered housing, receive the signed statement, available records and EPA pamphlet before being bound. An inspection waiver does not waive disclosure." },
    {id:'lead-inspection',type:'single_choice',label:'Lead inspection opportunity',fieldPath:'disclosures.leadInspectionSelection',visibleWhen:{match:'all',conditions:[{fieldPath:'disclosures.leadPaintStatus',operator:'equals',value:'received'}]},validation:required('Select the inspection opportunity.'),options:[{value:'ten_days',label:'10 days'},{value:'waived',label:'Inspection opportunity waived in writing'},{value:'other_period',label:'Different period agreed in writing'}]},
    {id:'lead-days',type:'number',label:'Agreed lead inspection days',fieldPath:'disclosures.leadInspectionDays',visibleWhen:{match:'all',conditions:[{fieldPath:'disclosures.leadInspectionSelection',operator:'equals',value:'other_period'}]},validation:{required:true,minimum:1,maximum:60,message:'Enter 1 to 60 days.'}},
    {id:'tax-warning',type:'acknowledgement',label:'I read the property tax information.',fieldPath:'disclosures.taxNoticeAcknowledged',helpText:"Review the county assessor\u2019s current property tax, exemption and special assessment information. Seller\u2019s current tax bill does not guarantee the buyer\u2019s tax bill.",validation:required('Read and acknowledge the tax information.')},
    {id:'radon-warning',type:'acknowledgement',label:'I have reviewed the New Mexico property notices',fieldPath:'disclosures.radonNoticeAcknowledged',helpText:"This ordinary resale package does not impose a universal state-prescribed seller condition form as a prerequisite to an offer. Seller shall disclose known adverse material facts and shall not misrepresent or actively conceal conditions. A voluntarily supplied condition statement is not a warranty or substitute for inspection. Professional broker duties under 16.61.19 NMAC apply to licensed brokers; they do not make NavStreet a broker or create a statewide FSBO form requirement. A receipt answer records actual delivery, not a completed or signed separate statement. Under NMSA 47-13-4, before accepting an offer the seller or seller broker shall request the county assessor tax-levy estimate at the listed price and provide the written response to buyer or buyer broker. The response includes current/prior taxes, the estimated following-year levy and the statutory warning about the stated price, current-and-correct value and actual future rates. A current seller tax bill alone is insufficient. County online printable estimates may satisfy the response requirement. When the statutory packet is marked Received, buyer electronic signature and timestamp expressly acknowledge written receipt of the assessor estimate. Pending is not an acknowledgment. NavStreet collects the assessor estimate or documented unavailability before online offers open. If not readily available, each buyer must sign the statutory waiver before making the offer. For a covered HOA lot under NMSA 47-16-11 through 47-16-13, seller shall supply the association disclosure certificate no later than seven days before closing and the applicable declaration, bylaws, covenants and rules before closing. Buyer may cancel within seven days after receipt of the certificate through the statutory notice method, without penalty; payments are refunded within fifteen days. A pending HOA certificate does not universally block offer creation. Verify actual statutory applicability and supported exceptions; condominium offerings are outside this package. Preserve statutory certificate, assessment and cancellation protections despite a separate negotiated inspection deadline. For an established on-site liquid waste system, seller shall arrange the qualified NMED property-transfer evaluation before transfer, required permitting/registration and correction of deficiencies under 20.7.3 NMAC. Evaluation reports go to NMED within fifteen days. Verify report validity and any approved extension; advanced treatment, alternative disposal and holding-tank systems require applicable ownership and operating/maintenance updates. This is a transfer requirement, not a universal pre-offer evaluation. Seller shall provide records and meet required compliance before closing; buyer may terminate before settlement if required transfer compliance is not achieved, subject to lawful return of deposits. Where 20.4.5 NMAC applies, owner shall give written notice of a clandestine drug laboratory to a proposed transferee, obtain the transferee written acknowledgment, and supply copies to NMED Hazardous Waste Bureau as required by 20.4.5.13. No unauthorized entry or occupancy is permitted while residual contamination remains subject to the notice. Separately execute the notice and acknowledgment and verify department-approved remediation before occupancy. A signed purchase agreement or generic packet status does not certify cleanup, authorize entry or submit notices to NMED. Seller must comply before transfer; known contamination is not made harmless by an as-is provision. Closing shall verify recorded legal description, ownership, title insurance, community-property/spousal joinder and acknowledged deed requirements. Seller-owned appurtenant water rights intended to convey shall be expressly identified in the deed unless lawfully reserved; provide OSE records and perform applicable county/OSE ownership updates. A well or irrigation use does not by itself establish transferable water rights. Review shared-well agreements, acequia/ditch obligations, legal access and local permits during inspection. The existing seller tax valuation is not a guarantee of buyer taxes. Federal and state withholding and sales-information reporting remain the closing agent responsibilities.",validation:{required:true,message:'Review and acknowledge the state notices.'}},
    {id:'leases',type:'yes_no',label:'Seller reports existing leases',fieldPath:'disclosures.sellerReportsExistingLeases',readOnly:true,validation:required('The seller must answer the leases question.')},
    {id:'lease-review',type:'acknowledgement',label:'I reviewed the seller’s lease statement and any attached leases.',fieldPath:'disclosures.leaseStatementAcknowledged',validation:required('Acknowledge the lease statement.')},
    {id:'state-rights',type:'information',label:"This ordinary resale package does not impose a universal state-prescribed seller condition form as a prerequisite to an offer. Seller shall disclose known adverse material facts and shall not misrepresent or actively conceal conditions. A voluntarily supplied condition statement is not a warranty or substitute for inspection. Professional broker duties under 16.61.19 NMAC apply to licensed brokers; they do not make NavStreet a broker or create a statewide FSBO form requirement. A receipt answer records actual delivery, not a completed or signed separate statement. Under NMSA 47-13-4, before accepting an offer the seller or seller broker shall request the county assessor tax-levy estimate at the listed price and provide the written response to buyer or buyer broker. The response includes current/prior taxes, the estimated following-year levy and the statutory warning about the stated price, current-and-correct value and actual future rates. A current seller tax bill alone is insufficient. County online printable estimates may satisfy the response requirement. When the statutory packet is marked Received, buyer electronic signature and timestamp expressly acknowledge written receipt of the assessor estimate. Pending is not an acknowledgment. NavStreet collects the assessor estimate or documented unavailability before online offers open. If not readily available, each buyer must sign the statutory waiver before making the offer."}
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
        helpText: 'Leave blank if there are no other terms. Ask a New Mexico attorney to review any new legal language.',
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
