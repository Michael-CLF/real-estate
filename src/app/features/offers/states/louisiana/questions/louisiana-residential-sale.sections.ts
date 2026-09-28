import type { OfferSectionDefinition } from '../../../engine/models/offer-section-definition';

const required = (message: string) => ({ required: true, message });
const yn = (fieldPath: string, label: string, message: string) =>
  ({ id: fieldPath, fieldPath, label, type: 'yes_no' as const, validation: required(message) });
const visible = (fieldPath: string, value: string) =>
  ({ match: 'all' as const, conditions: [{ fieldPath, operator: 'equals' as const, value }] });

/** Questions correspond to choices and blanks in the LREC agreement, revision 01/2026. */
export const LOUISIANA_RESIDENTIAL_SALE_SECTIONS: readonly OfferSectionDefinition[] = [
  { id: 'parties', title: 'Buyers and sellers', description: 'Review the parties to this Louisiana offer.', questions: [] },
  {
    id: 'property', questionLayout: 'cards', title: 'Property and mineral rights', questions: [
      { id: 'legal', type: 'textarea', label: 'Seller-provided legal description', fieldPath: 'legalDescription', readOnly: true, validation: required('The seller must enter the legal description in the listing.') },
      {
        id: 'grounds',
        type: 'text',
        label: 'Land and grounds from the seller listing',
        fieldPath: 'propertyItems.groundsDescription',
        readOnly: true,
        helpText: 'Provided by the seller. If no verified size and unit are available, the contract uses the description in record title.',
      },
      { id: 'movable', type: 'textarea', label: 'Movable items the seller will leave with the property', fieldPath: 'propertyItems.included', helpText: 'The official agreement lists many installed items by default. Identify additional movable items here.' },
      { id: 'excluded', type: 'textarea', label: 'Items specifically excluded from the sale', fieldPath: 'propertyItems.excluded' },
      yn('propertyItems.mineralRightsReserved', 'Will the seller reserve any mineral rights they own?', 'Choose whether mineral rights are reserved.'),
      { id: 'minerals-percent', type: 'number', label: 'Percentage of seller-owned mineral rights reserved', fieldPath: 'propertyItems.mineralRightsPercent', visibleWhen: { match: 'all', conditions: [{ fieldPath: 'propertyItems.mineralRightsReserved', operator: 'is_true' }] }, validation: { required: true, minimum: 1, maximum: 100, message: 'Enter a percentage between 1 and 100.' } },
    ]
  },
  {
    id: 'price', questionLayout: 'cards', title: 'Sale price, deposit, and financing', questions: [
      { id: 'sale-price', type: 'currency', label: 'Sale price', fieldPath: 'purchase.purchasePriceInCents', validation: { required: true, minimum: 1, message: 'Enter a sale price above $0.' } },
      yn('purchase.hasEarnestMoney', 'Will the buyer provide a deposit?', 'Choose whether a deposit is offered.'),
      { id: 'deposit', type: 'currency', label: 'Buyer deposit (due within 72 hours of acceptance)', fieldPath: 'purchase.earnestMoneyInCents', visibleWhen: { match: 'all', conditions: [{ fieldPath: 'purchase.hasEarnestMoney', operator: 'is_true' }] }, validation: { required: true, minimum: 1, message: 'Enter the buyer deposit.' } },
      { id: 'deposit-method', type: 'single_choice', label: 'Deposit payment method', fieldPath: 'purchase.depositMethod', visibleWhen: { match: 'all', conditions: [{ fieldPath: 'purchase.hasEarnestMoney', operator: 'is_true' }] }, validation: required('Choose how the buyer will pay the deposit.'), options: [{ value: 'check', label: 'Check' }, { value: 'certified_funds', label: 'Certified funds' }, { value: 'electronic_transfer', label: 'Electronic transfer' }] },
      { id: 'deposit-holder', type: 'text', label: 'Person or company that will hold the deposit', fieldPath: 'purchase.earnestMoneyHolder', visibleWhen: { match: 'all', conditions: [{ fieldPath: 'purchase.hasEarnestMoney', operator: 'is_true' }] }, validation: required('Name the person or company that will hold the buyer deposit.') },
      { id: 'funding', type: 'single_choice', label: 'How will the buyer pay?', fieldPath: 'purchase.financingType', validation: required('Choose cash or financed sale.'), options: [{ value: 'cash', label: 'All cash' }, { value: 'financed', label: 'Financed sale' }] },
      { id: 'cash-proof-days', type: 'number', label: 'Calendar days after acceptance to provide proof of cash', fieldPath: 'purchase.cashProofDays', visibleWhen: visible('purchase.financingType', 'cash'), validation: { required: true, minimum: 1, maximum: 30, message: 'Enter 1 to 30 days.' } },
      { id: 'loan-amount', type: 'currency', label: 'Proposed loan amount', fieldPath: 'purchase.loanAmountInCents', visibleWhen: visible('purchase.financingType', 'financed'), validation: { required: true, minimum: 1, message: 'Enter the proposed loan amount.' } },
      { id: 'interest', type: 'number', label: 'Maximum initial annual interest rate (%)', fieldPath: 'purchase.maxInterestRatePercent', visibleWhen: visible('purchase.financingType', 'financed'), validation: { required: true, minimum: 0.01, maximum: 30, message: 'Enter a maximum rate above 0% and no more than 30%.' } },
      { id: 'loan-years', type: 'number', label: 'Loan amortization period in years (minimum)', fieldPath: 'purchase.loanTermYears', visibleWhen: visible('purchase.financingType', 'financed'), validation: { required: true, minimum: 1, maximum: 40, message: 'Enter 1 to 40 years.' } },
      { id: 'financing-source', type: 'single_choice', label: 'Mortgage or funding program', fieldPath: 'purchase.financingSource', visibleWhen: visible('purchase.financingType', 'financed'), validation: required('Choose the mortgage or funding program.'), options: [{ value: 'conventional', label: 'Conventional' }, { value: 'fha', label: 'FHA insured' }, { value: 'va', label: 'VA guaranteed' }, { value: 'rural_development', label: 'Rural Development' }, { value: 'owner', label: 'Owner financing' }, { value: 'bond', label: 'Bond financing' }, { value: 'other', label: 'Other' }] },
      { id: 'other-financing', type: 'textarea', label: 'Other financing conditions', fieldPath: 'purchase.otherFinancingConditions', visibleWhen: visible('purchase.financingSource', 'other'), validation: required('Describe the other funding arrangement.') },
      { id: 'loan-application', type: 'number', label: 'Calendar days after acceptance to apply and authorize lender to proceed', fieldPath: 'purchase.loanApplicationDays', visibleWhen: visible('purchase.financingType', 'financed'), validation: { required: true, minimum: 1, maximum: 30, message: 'Enter 1 to 30 days.' } },
      { id: 'seller-concessions', type: 'currency', label: 'Seller contribution toward buyer costs (optional addendum)', fieldPath: 'purchase.sellerConcessionsInCents' },
    ]
  },
  {
    id: 'contingencies', questionLayout: 'cards', title: 'Conditions and inspection', questions: [
      yn('conditions.saleOfBuyersProperty', 'Is the sale contingent on the buyer selling another property?', 'Choose whether another property must sell.'),
      { id: 'other-sale', type: 'textarea', label: 'Other property, deadline, and contingency details', fieldPath: 'conditions.saleOfBuyersPropertyTerms', visibleWhen: { match: 'all', conditions: [{ fieldPath: 'conditions.saleOfBuyersProperty', operator: 'is_true' }] }, validation: required('Describe the other-property contingency or attach its addendum.') },
      { id: 'inspection', type: 'number', label: 'Due diligence and inspection period in calendar days after acceptance', fieldPath: 'deadlines.inspectionPeriodDays', validation: { required: true, minimum: 1, maximum: 90, message: 'Enter 1 to 90 calendar days.' } },
      { id: 'water', type: 'number', label: 'Private water systems servicing the main home (0 if none)', fieldPath: 'conditions.privateWaterSystems', validation: { required: true, minimum: 0, maximum: 20, message: 'Enter 0 to 20 private water systems.' } },
      { id: 'septic', type: 'number', label: 'Private septic or treatment systems servicing the main home (0 if none)', fieldPath: 'conditions.privateSepticSystems', validation: { required: true, minimum: 0, maximum: 20, message: 'Enter 0 to 20 private septic systems.' } },
      yn('conditions.appraisal', 'Is this sale conditioned on an appraisal at least equal to the sale price?', 'Select the appraisal condition.'),
      { id: 'appraisal-copy-days', type: 'number', label: 'Days after receipt of a low appraisal for buyer to give seller the appraisal and request', fieldPath: 'deadlines.appraisalCopyDays', visibleWhen: { match: 'all', conditions: [{ fieldPath: 'conditions.appraisal', operator: 'is_true' }] }, validation: { required: true, minimum: 1, maximum: 30, message: 'Enter 1 to 30 days.' } },
      { id: 'appraisal-response-days', type: 'number', label: 'Days after seller receives a low appraisal for buyer to elect to pay or void', fieldPath: 'deadlines.appraisalResponseDays', visibleWhen: { match: 'all', conditions: [{ fieldPath: 'conditions.appraisal', operator: 'is_true' }] }, validation: { required: true, minimum: 1, maximum: 30, message: 'Enter 1 to 30 days.' } },
      { id: 'warranties', type: 'single_choice', label: 'Warranty election for the sale', fieldPath: 'conditions.warranty', validation: required('Choose a warranty election. Review the official form language before choosing.'), options: [{ value: 'with_warranties', label: 'Sale with seller warranties' }, { value: 'as_is', label: 'Sale as is, with waiver of redhibition' }, { value: 'new_home_warranty', label: 'New construction subject to New Home Warranty Act' }] },
      { id: 'home-warranty', type: 'single_choice', label: 'Will a home service warranty be bought at closing?', fieldPath: 'conditions.homeServiceWarranty', validation: required('Choose a home service warranty option.'), options: [{ value: 'will', label: 'Yes' }, { value: 'will_not', label: 'No' }] },
      { id: 'home-warranty-cost', type: 'currency', label: 'Home warranty maximum cost', fieldPath: 'conditions.homeServiceWarrantyCostInCents', visibleWhen: visible('conditions.homeServiceWarranty', 'will'), validation: { required: true, minimum: 1, message: 'Enter the maximum warranty cost.' } },
      { id: 'home-warranty-payer', type: 'single_choice', label: 'Who pays for the home warranty?', fieldPath: 'conditions.homeServiceWarrantyPayer', visibleWhen: visible('conditions.homeServiceWarranty', 'will'), validation: required('Choose who pays for the home warranty.'), options: [{ value: 'buyer', label: 'Buyer' }, { value: 'seller', label: 'Seller' }] },
      { id: 'home-warranty-orderer', type: 'text', label: 'Who orders the home warranty?', fieldPath: 'conditions.homeServiceWarrantyOrderedBy', visibleWhen: visible('conditions.homeServiceWarranty', 'will'), validation: required('Name who will order the home warranty.') },
    ]
  },
  {
    id: 'closing', questionLayout: 'cards', title: 'Act of sale and title', questions: [
      { id: 'act-of-sale', type: 'date', label: 'Act of Sale date', fieldPath: 'deadlines.settlementDate', validation: required('Enter the date for the Act of Sale.') },
      { id: 'title-cure', type: 'number', label: 'Maximum calendar days to extend the Act of Sale for title curative work', fieldPath: 'deadlines.titleCureDays', validation: { required: true, minimum: 1, maximum: 180, message: 'Enter 1 to 180 days.' } },
      { id: 'broker-comp', type: 'currency', label: 'Seller contribution to buyer broker compensation (optional; $0 if blank)', fieldPath: 'purchase.buyerBrokerCompensationInCents' },
      { id: 'possession', type: 'information', label: 'Unless separately agreed in writing, keys and possession pass at the Act of Sale. The buyer chooses the settlement agent or notary.' },
    ]
  },
  {
    id: 'disclosures', questionLayout: 'cards', title: 'Seller documents and buyer receipt', questions: [
      { id: 'seller-form', type: 'single_choice', label: 'Seller-signed Louisiana Property Disclosure Document', fieldPath: 'disclosures.propertyDisclosureStatus', validation: required('Select whether you received the signed Louisiana disclosure.'), options: [{ value: 'received', label: 'I opened and received the signed seller disclosure before this offer' }, { value: 'pending', label: 'I have not received it yet' }], helpText: 'You may save your draft while this is pending. The offer cannot be submitted until the signed disclosure has been uploaded and received.' },
      {
        id: 'lead-form',
        type: 'single_choice',
        label: 'Federal lead-based paint disclosure packet',
        fieldPath: 'disclosures.leadPaintStatus',
        validation: required('Select the applicable lead disclosure status.'),
        options: [
          {
            value: 'received',
            label: 'I received the signed seller disclosure, available records, and EPA pamphlet',
          },
          {
            value: 'pending',
            label: 'I have not yet received the lead disclosure packet',
          },
          {
            value: 'built_1978_or_later',
            label: 'The listing shows the home was built in 1978 or later',
          },
        ],
        helpText:
          'You may send an offer before receiving the lead packet. The seller cannot accept that offer. After the packet is uploaded, review it and make a new offer.',
      },

      { id: 'lead-inspection', type: 'single_choice', label: 'Buyer lead inspection opportunity', fieldPath: 'disclosures.leadInspectionSelection', visibleWhen: visible('disclosures.leadPaintStatus', 'received'), validation: required('Choose the lead inspection option.'), options: [{ value: 'ten_days', label: '10-day opportunity' }, { value: 'waived', label: 'Buyer waives the opportunity' }, { value: 'other_period', label: 'Another period agreed in writing' }] },
      { id: 'lead-days', type: 'number', label: 'Agreed lead inspection days', fieldPath: 'disclosures.leadInspectionDays', visibleWhen: visible('disclosures.leadInspectionSelection', 'other_period'), validation: { required: true, minimum: 1, maximum: 60, message: 'Enter 1 to 60 days.' } },
    ]
  },
  {
    id: 'additional', questionLayout: 'cards', title: 'Other agreed terms', questions: [
      { id: 'additional-terms', type: 'textarea', label: 'Additional terms (optional)', fieldPath: 'additionalTerms', helpText: 'Additional terms will appear on a separate NavStreet addendum; they do not change the printed LREC form.' },
    ]
  },
  {
    id: 'delivery', questionLayout: 'cards', title: 'Review and deliver the offer', questions: [
      { id: 'expires', type: 'date_time', label: 'Offer expiration date and local time', fieldPath: 'delivery.expiresAt', validation: required('Set a future offer expiration date and time.') },
      { id: 'electronic', type: 'acknowledgement', label: 'I authorize electronic delivery and electronic signatures for this offer.', fieldPath: 'delivery.electronicDeliveryAuthorized', validation: required('Electronic delivery consent is required.') },
    ]
  },
];