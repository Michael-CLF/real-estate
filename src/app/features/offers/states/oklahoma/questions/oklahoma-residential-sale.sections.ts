import type { OfferSectionDefinition } from '../../../engine/models/offer-section-definition';

const required = (message: string) => ({ required: true, message });

export const OKLAHOMA_RESIDENTIAL_SALE_SECTIONS: readonly OfferSectionDefinition[] = [
  {
    id: 'parties',
    title: 'Parties',
    description: 'Review the buyer and seller information populated from NavStreet.',
    questions: [],
  },
  {
    id: 'property-contract-documents',
    title: 'Property and contract documents',
    shortTitle: 'Property',
    description: 'Confirm the legal description and select every official supplement that will be attached.',
    questions: [
      {
        id: 'legal-description', type: 'textarea', label: 'Legal description',
        fieldPath: 'legalDescription',
        helpText: 'Use the recorded legal description. The street address alone is not a legal description.',
        validation: required('The property legal description is required.'),
      },
      {
        id: 'contract-documents', type: 'multiple_choice', label: 'Contract documents and supplements',
        fieldPath: 'contractDocuments',
        description: 'Select every document incorporated into this offer. Leave all financing choices blank only for a cash transaction.',
        options: [
          { value: 'conventional_loan', label: 'Conventional Loan' },
          { value: 'fha_loan', label: 'FHA Loan' },
          { value: 'va_loan', label: 'VA Loan' },
          { value: 'usda_loan', label: 'USDA Loan' },
          { value: 'native_american_loan', label: 'Native American Guaranteed Home Loan' },
          { value: 'assumption', label: 'Assumption' },
          { value: 'seller_financing', label: 'Seller Financing' },
          { value: 'proof_of_funds', label: 'Proof of Funds or Loan Pre-Qualification Letter' },
          { value: 'single_family_hoa', label: 'Single Family Mandatory Homeowners Association' },
          { value: 'condo_townhouse_association', label: 'Condominium / Townhouse Association' },
          { value: 'supplement', label: 'Supplement' },
          { value: 'buyer_property_under_contract', label: "Sale of Buyer’s Property - Presently Under Contract" },
          { value: 'buyer_property_not_under_contract', label: "Sale of Buyer’s Property - Not Under Contract" },
          { value: 'cooperative_compensation', label: 'Cooperative Compensation Supplement' },
        ],
      },
    ],
  },
  {
    id: 'price-earnest-money',
    title: 'Purchase price and earnest money',
    shortTitle: 'Price & deposit',
    questions: [
      {
        id: 'purchase-price', type: 'currency', label: 'Purchase price',
        fieldPath: 'purchase.purchasePriceInCents',
        validation: { required: true, minimum: 1, message: 'Purchase price must be greater than $0.00.' },
      },
      {
        id: 'earnest-money', type: 'currency', label: 'Earnest money',
        fieldPath: 'purchase.earnestMoneyInCents',
        helpText: 'The OREC contract requires delivery within three days after the contract is fully executed.',
        validation: { required: true, minimum: 1, message: 'Earnest money must be greater than $0.00.' },
      },
      {
        id: 'trust-holder', type: 'text', label: 'Trust-account holder',
        fieldPath: 'purchase.trustAccountHolder',
        placeholder: 'Title company, brokerage, or other escrow holder',
        validation: required('The earnest-money trust-account holder is required.'),
      },
    ],
  },
  {
    id: 'closing-accessories',
    title: 'Closing, possession, and property items',
    shortTitle: 'Closing',
    questions: [
      {
        id: 'closing-date', type: 'date', label: 'Closing date',
        fieldPath: 'closing.closingDate', validation: required('The closing date is required.'),
      },
      {
        id: 'possession-terms', type: 'text', label: 'Possession terms',
        fieldPath: 'closing.possessionTerms',
        placeholder: 'Leave blank for possession upon conclusion of closing',
        helpText: 'Only enter different possession terms if the parties negotiated them.',
      },
      {
        id: 'additional-inclusions', type: 'textarea', label: 'Additional inclusions',
        fieldPath: 'accessories.additionalInclusions',
        placeholder: 'Items included in addition to the standard OREC list',
      },
      {
        id: 'exclusions', type: 'textarea', label: 'Exclusions',
        fieldPath: 'accessories.exclusions',
        placeholder: 'Items that will not remain with the property',
      },
    ],
  },
  {
    id: 'investigations',
    title: 'Investigations, inspections, and repairs',
    shortTitle: 'Inspections',
    questions: [
      {
        id: 'reference-date', type: 'date', label: 'Time Reference Date',
        fieldPath: 'timePeriods.referenceDate',
        helpText: 'If left blank, the OREC contract makes this the third day after the last party signs.',
      },
      {
        id: 'inspection-days', type: 'number', label: 'Investigation and inspection period',
        fieldPath: 'timePeriods.inspectionDays', suffix: 'days',
        validation: { required: true, minimum: 1, maximum: 180, message: 'Enter an inspection period from 1 through 180 days.' },
      },
      {
        id: 'additional-investigations', type: 'textarea', label: 'Additional investigation, inspection, or review',
        fieldPath: 'timePeriods.additionalInvestigations',
        placeholder: 'Optional item 13 on the OREC contract',
      },
      {
        id: 'trr-days', type: 'number', label: 'TRR negotiation period',
        fieldPath: 'timePeriods.trrNegotiationDays', suffix: 'days',
        validation: { required: true, minimum: 1, maximum: 180, message: 'Enter a TRR negotiation period from 1 through 180 days.' },
      },
    ],
  },
  {
    id: 'disclosures',
    title: 'Acknowledgment and confirmation of disclosures',
    shortTitle: 'Disclosures',
    questions: [
      {
        id: 'in-house-brokerage', type: 'yes_no', label: 'Is one broker providing brokerage services to both parties?',
        fieldPath: 'disclosures.inHouseBrokerageServices',
      },
      {
        id: 'property-disclosure', type: 'single_choice', label: 'Residential property condition disclosure status',
        fieldPath: 'disclosures.propertyConditionStatus',
        validation: required('Select the applicable property-condition disclosure status.'),
        options: [
          { value: 'disclosure_received', label: 'Disclosure Statement received' },
          { value: 'disclaimer_received', label: 'Disclaimer Statement received' },
          { value: 'exempt', label: 'Transaction exempt under 60 O.S. Section 838' },
          { value: 'not_required', label: 'Disclosure not required under the Act' },
        ],
      },
      {
        id: 'lead-status', type: 'single_choice', label: 'Lead-based paint disclosure status',
        fieldPath: 'disclosures.leadBasedPaintStatus',
        validation: required('Select the applicable lead-based paint disclosure status.'),
        options: [
          { value: 'received', label: 'Signed disclosure and EPA pamphlet received' },
          { value: 'built_1978_or_later', label: 'Property constructed in 1978 or later' },
          { value: 'not_residential', label: 'Not a residential dwelling' },
        ],
      },
      {
        id: 'cost-estimate', type: 'acknowledgement', label: 'Buyer acknowledges receipt of the estimate of transaction costs.',
        fieldPath: 'disclosures.costEstimateReceived',
        validation: required('Acknowledgment of the transaction-cost estimate is required.'),
      },
      {
        id: 'contract-guide', type: 'acknowledgement', label: 'Buyer acknowledges that the OREC Contract Guide has been made available.',
        fieldPath: 'disclosures.contractGuideAvailable',
        validation: required('Acknowledgment of the OREC Contract Guide is required.'),
      },
    ],
  },
  {
    id: 'title-survey',
    title: 'Title evidence and survey',
    shortTitle: 'Title & survey',
    questions: [
      {
        id: 'title-evidence', type: 'single_choice', label: 'Buyer will obtain',
        fieldPath: 'title.evidenceSelection', validation: required('Select the title-evidence option.'),
        options: [
          { value: 'title_insurance_commitment', label: 'Title-insurance commitment based on an Attorney’s Title Opinion' },
          { value: 'attorney_title_opinion', label: 'Attorney’s Title Opinion without title insurance' },
        ],
      },
      {
        id: 'survey-selection', type: 'single_choice', label: 'Survey or inspection report',
        fieldPath: 'title.surveySelection', validation: required('Select the survey or inspection-report option.'),
        options: [
          { value: 'mortgage_inspection_report', label: 'Mortgage Inspection Report' },
          { value: 'pin_stake_boundary_survey', label: 'Pin Stake / Boundary Survey' },
          { value: 'none_unless_required', label: 'None unless required by title or law' },
        ],
      },
      {
        id: 'survey-payer', type: 'single_choice', label: 'Survey/report expense paid by',
        fieldPath: 'title.surveyExpensePayer',
        visibleWhen: { match: 'all', conditions: [{ fieldPath: 'title.surveySelection', operator: 'not_equals', value: 'none_unless_required' }] },
        validation: required('Select who will pay the survey or report expense.'),
        options: [
          { value: 'buyer', label: 'Buyer' },
          { value: 'seller', label: 'Seller' },
        ],
      },
      {
        id: 'title-cure-days', type: 'number', label: 'Possible closing delay to cure title issues',
        fieldPath: 'timePeriods.titleCureDelayDays', suffix: 'days',
        validation: { required: true, minimum: 1, maximum: 180, message: 'Enter a title-cure period from 1 through 180 days.' },
      },
    ],
  },
  {
    id: 'service-agreement',
    title: 'Residential service agreement',
    shortTitle: 'Service agreement',
    questions: [
      {
        id: 'service-selection', type: 'single_choice', label: 'Residential service agreement selection',
        fieldPath: 'serviceAgreement.selection', validation: required('Select the residential service-agreement option.'),
        options: [
          { value: 'none', label: 'No residential service agreement' },
          { value: 'seller_existing_transfer', label: 'Seller’s existing agreement transfers with one year of coverage' },
          { value: 'buyer_selected', label: 'Buyer will select a residential service agreement' },
        ],
      },
      {
        id: 'service-cost', type: 'currency', label: 'Approximate agreement cost',
        fieldPath: 'serviceAgreement.approximateCostInCents',
        visibleWhen: { match: 'all', conditions: [{ fieldPath: 'serviceAgreement.selection', operator: 'equals', value: 'buyer_selected' }] },
        validation: { required: true, minimum: 1, message: 'Enter an approximate service-agreement cost greater than $0.00.' },
      },
      {
        id: 'seller-service-contribution', type: 'currency', label: 'Seller contribution',
        fieldPath: 'serviceAgreement.sellerContributionInCents',
        visibleWhen: { match: 'all', conditions: [{ fieldPath: 'serviceAgreement.selection', operator: 'equals', value: 'buyer_selected' }] },
        validation: { required: true, minimum: 0, message: 'Enter the seller contribution, including $0.00 if none.' },
      },
    ],
  },
  {
    id: 'additional-provisions',
    title: 'Additional provisions',
    shortTitle: 'Provisions',
    questions: [
      {
        id: 'additional-provisions-included', type: 'yes_no', label: 'Are party- or attorney-provided additional provisions included?',
        fieldPath: 'additionalProvisions.included', validation: required('Choose Yes or No.'),
      },
      {
        id: 'additional-provisions-text', type: 'textarea', label: 'Party- or attorney-provided additional provisions',
        fieldPath: 'additionalProvisions.partyProvidedText',
        description: 'NavStreet does not draft or recommend legal provisions. Enter only language supplied by a party or attorney.',
        visibleWhen: { match: 'all', conditions: [{ fieldPath: 'additionalProvisions.included', operator: 'is_true' }] },
        validation: required('Enter the party- or attorney-provided provisions.'),
      },
    ],
  },
  {
    id: 'delivery-certification',
    title: 'Delivery and certification',
    shortTitle: 'Certification',
    questions: [
      {
        id: 'buyer-affidavit', type: 'acknowledgement',
        label: 'Buyer confirms eligibility to execute Oklahoma’s required Affidavit of Land or Mineral Ownership under 60 O.S. Sections 121-122.',
        fieldPath: 'buyerAffidavitComplianceConfirmed',
        validation: required('Buyer affidavit-compliance confirmation is required.'),
      },
      {
        id: 'offer-expiration', type: 'date_time', label: 'Offer expiration date and time',
        fieldPath: 'delivery.expiresAt', validation: required('The offer expiration date and time is required.'),
      },
      {
        id: 'electronic-delivery', type: 'acknowledgement',
        label: 'Authorize electronic delivery of this offer and related documents through NavStreet.',
        fieldPath: 'delivery.electronicDeliveryAuthorized',
        validation: required('Electronic-delivery authorization is required.'),
      },
    ],
  },
];
