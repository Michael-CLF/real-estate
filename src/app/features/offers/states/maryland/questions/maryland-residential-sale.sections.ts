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
export const MARYLAND_RESIDENTIAL_SALE_SECTIONS: readonly OfferSectionDefinition[] = [
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
        label: 'Named Maryland escrow agent',
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
        helpText: 'Optional at the offer stage. The parties may select a qualified closing professional later.',
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
    { id: 'propertyConditionStatus', type: 'single_choice', label: "Maryland seller disclosure or documented lawful exception", fieldPath: 'disclosures.propertyConditionStatus', validation: required('Select the actual receipt status.'), options: [{value:'received',label:'Received and reviewed the uploaded document'},{value:'pending',label:'Not yet received or reviewed'},{value:'exempt',label:'Signed statutory exemption evidence reviewed'}], helpText: "For covered resales, Real Property 10-702 requires delivery of the current Commission disclosure or disclaimer on or before entering into the contract. A disclaimer still discloses actually known latent health or safety defects; it is not a statutory exemption. Each purchaser shall date and sign receipt, attached to or included in this contract. Where the receipt status is Received, each buyer electronic signature and its timestamp expressly acknowledge receipt of the identified uploaded statement; Pending is not an acknowledgment. An actual 10-702(b)(2) exception requires supporting evidence. If delivery is late, buyer may rescind by written notice before receipt or within five days after receipt and obtain return of deposits, subject to the specific lender-notice limits in 10-702(h) and closing/occupancy limits in 10-702(k). These rights cannot be waived in this agreement. Early receipt does not itself create a statutory right to cancel because of the disclosed information. Independent inspections remain available under the negotiated inspection condition." },
    { id: 'statutoryPacketStatus', type: 'single_choice', label: "Property-specific statutory and local records", fieldPath: 'disclosures.statutoryPacketStatus', validation: required('Select the actual receipt status.'), options: [{value:'received',label:'Received and reviewed the uploaded document'},{value:'pending',label:'Not yet received or reviewed'}], helpText: "Any applicable completed and separately executed deferred water/sewer notice, NPL Superfund addendum, rental lead risk-reduction notice, local enforcement/impact-fee notice or agricultural-transfer-tax notice selected as Received in the statutory packet is expressly attached to and incorporated in this agreement. Seller must identify property-specific applicability and provide the complete facts and statutory text before contract formation. A generic receipt answer does not complete or sign a separate addendum. For recorded deferred charges, include the annual amount, payment month, ending date and collector name/address, prepayment information, and the statutory explanation that these are contractual private charges rather than county charges. Preserve the specific 14-117(b)(3) rescission, deposit-return and undisclosed-charge remedies. For property within one mile of an NPL site, separately identify the site and EPA search/dashboard URLs, obtain both dated signatures, and preserve the five-day cancellation and full-refund right under 10-714. The seller condition statement does not replace these contract addenda. If a private or domestic well is present, buyer shall ensure State-certified laboratory water quality testing as a condition of this sale under Real Property 10-713. Eligible results remain valid for three years. Settlement shall not occur until both parties receive and review the results, and each shall certify receipt and review in writing at settlement. The negotiated inspection deadline does not waive this requirement. This agreement grants buyer a contractual right to terminate by written notice before settlement if required results are unavailable or unacceptable, with deposits returned subject to lawful disbursement. This workflow does not provide the statutory testing-waiver option. For an on-site sewage system, buyer is advised to review EPA Septic Systems Outreach Toolkit materials at https://www.epa.gov/septic/septic-systems-outreach-toolkit. Obtain applicable permits, maintenance obligations and advanced treatment records, and meet county/MDE requirements. This notice does not itself require a new septic inspection in every sale. Chapter 776 of the 2026 Laws of Maryland took effect October 1, 2026, but the new Real Property 10-716 seller delivery duty begins July 1, 2027. On and after that date, covered sellers must provide the completed MDE flood-risk form before entering the contract, plus available FEMA elevation certificate, applicable claim proceeds accounting and flooding-event count. The MDE form is due for publication by June 1, 2027. No new universal flood-form upload is imposed for October 2026 merely because the Act is effective. Existing duties to disclose known hazards still apply. Record any actual statutory exception separately; a condition disclaimer is not a flood exemption. Buyer may select the title, settlement, escrow and financing providers as applicable law permits. Closing shall verify ownership, liens, recording, taxes, permits and any county addenda. Apply the lawful Maryland first-time principal-residence purchaser transfer-tax treatment where eligible; do not override statutory seller payment with a generic cost allocation. Verify nonresident-seller withholding and any FIRPTA duty. Ground-rent/leasehold, agricultural transfers requiring specialized tax information, wholesale assignments, new construction and developer offerings require separate provisions and are outside the standard fee-simple resale scope unless an applicable recorded property notice can be supplied and reviewed. No dropdown completes a statutory form or tax filing." },
    {id:'hoa-seller',type:'yes_no',label:'Seller reports an owners association',fieldPath:'disclosures.sellerReportsHoa',readOnly:true,validation:required('The seller must answer the association question.')},
    { id: 'hoaDocumentsStatus', type: 'single_choice', label: "Association resale documents", fieldPath: 'disclosures.hoaDocumentsStatus', validation: required('Select the actual receipt status.'), options: [{value:'received',label:'Received and reviewed the uploaded document'},{value:'pending',label:'Not yet received or reviewed'},{value:'not_applicable',label:'Seller reports no association'}], helpText: "Provide property-specific governing documents, fees and assessments. Developer condominium sales are outside this resale workflow." },
    { id: 'leadPaintStatus', type: 'single_choice', label: "Federal lead-based paint packet", fieldPath: 'disclosures.leadPaintStatus', validation: required('Select the actual receipt status.'), options: [{value:'received',label:'Received and reviewed the uploaded document'},{value:'pending',label:'Not yet received or reviewed'},{value:'built_1978_or_later',label:'Listing confirms construction after 1977'},{value:'exempt',label:'Documented federal exemption received'}], helpText: "For covered housing, receive the signed statement, available records and EPA pamphlet before being bound. An inspection waiver does not waive disclosure." },
    {id:'lead-inspection',type:'single_choice',label:'Lead inspection opportunity',fieldPath:'disclosures.leadInspectionSelection',visibleWhen:{match:'all',conditions:[{fieldPath:'disclosures.leadPaintStatus',operator:'equals',value:'received'}]},validation:required('Select the inspection opportunity.'),options:[{value:'ten_days',label:'10 days'},{value:'waived',label:'Inspection opportunity waived in writing'},{value:'other_period',label:'Different period agreed in writing'}]},
    {id:'lead-days',type:'number',label:'Agreed lead inspection days',fieldPath:'disclosures.leadInspectionDays',visibleWhen:{match:'all',conditions:[{fieldPath:'disclosures.leadInspectionSelection',operator:'equals',value:'other_period'}]},validation:{required:true,minimum:1,maximum:60,message:'Enter 1 to 60 days.'}},
    {id:'tax-warning',helpText:"Review the county assessor\u2019s current property tax, exemption and special assessment information. Seller\u2019s current tax bill does not guarantee the buyer\u2019s tax bill.",type:'information',label:'Property tax information'},
    {id:'radon-warning',type:'acknowledgement',label:'I have reviewed the Maryland property notices',fieldPath:'disclosures.radonNoticeAcknowledged',helpText:"For covered resales, Real Property 10-702 requires delivery of the current Commission disclosure or disclaimer on or before entering into the contract. A disclaimer still discloses actually known latent health or safety defects; it is not a statutory exemption. Each purchaser shall date and sign receipt, attached to or included in this contract. Where the receipt status is Received, each buyer electronic signature and its timestamp expressly acknowledge receipt of the identified uploaded statement; Pending is not an acknowledgment. An actual 10-702(b)(2) exception requires supporting evidence. If delivery is late, buyer may rescind by written notice before receipt or within five days after receipt and obtain return of deposits, subject to the specific lender-notice limits in 10-702(h) and closing/occupancy limits in 10-702(k). These rights cannot be waived in this agreement. Early receipt does not itself create a statutory right to cancel because of the disclosed information. Independent inspections remain available under the negotiated inspection condition. Any applicable completed and separately executed deferred water/sewer notice, NPL Superfund addendum, rental lead risk-reduction notice, local enforcement/impact-fee notice or agricultural-transfer-tax notice selected as Received in the statutory packet is expressly attached to and incorporated in this agreement. Seller must identify property-specific applicability and provide the complete facts and statutory text before contract formation. A generic receipt answer does not complete or sign a separate addendum. For recorded deferred charges, include the annual amount, payment month, ending date and collector name/address, prepayment information, and the statutory explanation that these are contractual private charges rather than county charges. Preserve the specific 14-117(b)(3) rescission, deposit-return and undisclosed-charge remedies. For property within one mile of an NPL site, separately identify the site and EPA search/dashboard URLs, obtain both dated signatures, and preserve the five-day cancellation and full-refund right under 10-714. The seller condition statement does not replace these contract addenda. If a private or domestic well is present, buyer shall ensure State-certified laboratory water quality testing as a condition of this sale under Real Property 10-713. Eligible results remain valid for three years. Settlement shall not occur until both parties receive and review the results, and each shall certify receipt and review in writing at settlement. The negotiated inspection deadline does not waive this requirement. This agreement grants buyer a contractual right to terminate by written notice before settlement if required results are unavailable or unacceptable, with deposits returned subject to lawful disbursement. This workflow does not provide the statutory testing-waiver option. For an on-site sewage system, buyer is advised to review EPA Septic Systems Outreach Toolkit materials at https://www.epa.gov/septic/septic-systems-outreach-toolkit. Obtain applicable permits, maintenance obligations and advanced treatment records, and meet county/MDE requirements. This notice does not itself require a new septic inspection in every sale. Chapter 776 of the 2026 Laws of Maryland took effect October 1, 2026, but the new Real Property 10-716 seller delivery duty begins July 1, 2027. On and after that date, covered sellers must provide the completed MDE flood-risk form before entering the contract, plus available FEMA elevation certificate, applicable claim proceeds accounting and flooding-event count. The MDE form is due for publication by June 1, 2027. No new universal flood-form upload is imposed for October 2026 merely because the Act is effective. Existing duties to disclose known hazards still apply. Record any actual statutory exception separately; a condition disclaimer is not a flood exemption. Buyer may select the title, settlement, escrow and financing providers as applicable law permits. Closing shall verify ownership, liens, recording, taxes, permits and any county addenda. Apply the lawful Maryland first-time principal-residence purchaser transfer-tax treatment where eligible; do not override statutory seller payment with a generic cost allocation. Verify nonresident-seller withholding and any FIRPTA duty. Ground-rent/leasehold, agricultural transfers requiring specialized tax information, wholesale assignments, new construction and developer offerings require separate provisions and are outside the standard fee-simple resale scope unless an applicable recorded property notice can be supplied and reviewed. No dropdown completes a statutory form or tax filing.",validation:{required:true,message:'Review and acknowledge the state notices.'}},
    {id:'leases',type:'yes_no',label:'Seller reports existing leases',fieldPath:'disclosures.sellerReportsExistingLeases',readOnly:true,validation:required('The seller must answer the leases question.')},
    {id:'lease-review',type:'acknowledgement',label:'I reviewed the seller’s lease statement and any attached leases.',fieldPath:'disclosures.leaseStatementAcknowledged',validation:required('Acknowledge the lease statement.')},
    {id:'state-rights',type:'information',label:"For covered resales, Real Property 10-702 requires delivery of the current Commission disclosure or disclaimer on or before entering into the contract. A disclaimer still discloses actually known latent health or safety defects; it is not a statutory exemption. Each purchaser shall date and sign receipt, attached to or included in this contract. Where the receipt status is Received, each buyer electronic signature and its timestamp expressly acknowledge receipt of the identified uploaded statement; Pending is not an acknowledgment. An actual 10-702(b)(2) exception requires supporting evidence. If delivery is late, buyer may rescind by written notice before receipt or within five days after receipt and obtain return of deposits, subject to the specific lender-notice limits in 10-702(h) and closing/occupancy limits in 10-702(k). These rights cannot be waived in this agreement. Early receipt does not itself create a statutory right to cancel because of the disclosed information. Independent inspections remain available under the negotiated inspection condition. Any applicable completed and separately executed deferred water/sewer notice, NPL Superfund addendum, rental lead risk-reduction notice, local enforcement/impact-fee notice or agricultural-transfer-tax notice selected as Received in the statutory packet is expressly attached to and incorporated in this agreement. Seller must identify property-specific applicability and provide the complete facts and statutory text before contract formation. A generic receipt answer does not complete or sign a separate addendum. For recorded deferred charges, include the annual amount, payment month, ending date and collector name/address, prepayment information, and the statutory explanation that these are contractual private charges rather than county charges. Preserve the specific 14-117(b)(3) rescission, deposit-return and undisclosed-charge remedies. For property within one mile of an NPL site, separately identify the site and EPA search/dashboard URLs, obtain both dated signatures, and preserve the five-day cancellation and full-refund right under 10-714. The seller condition statement does not replace these contract addenda."}
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
        helpText: 'Leave blank if there are no other terms. Ask a Maryland attorney to review any new legal language.',
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
