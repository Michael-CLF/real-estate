import type { OfferSectionDefinition } from '../../../engine/models/offer-section-definition';

const required = (message: string) => ({ required: true, message });
const yn = (path: string, label: string, message: string) => ({ id: path, type: 'yes_no' as const, label, fieldPath: path, validation: required(message) });

/** NavStreet-authored resale agreement. The statutory seller report is a separate document. */
export const WISCONSIN_RESIDENTIAL_SALE_SECTIONS: readonly OfferSectionDefinition[] = [
  { id: 'parties', title: 'Buyers and sellers', description: 'Review the parties copied from the listing and account.', questions: [] },
  { id: 'property', title: 'Property and included items', questions: [
    { id: 'legal-description', type: 'textarea', label: 'Legal description', fieldPath: 'legalDescription', validation: required('Enter the recorded legal description.') },
    { id: 'included', type: 'textarea', label: 'Additional items included', fieldPath: 'propertyItems.included', placeholder: 'Appliances or other items included by agreement' },
    { id: 'excluded', type: 'textarea', label: 'Items excluded', fieldPath: 'propertyItems.excluded' },
    yn('propertyItems.fixturesIncluded', 'Are installed fixtures included?', 'Select whether installed fixtures are included.'),
    { id: 'leased-items', type: 'textarea', label: 'Leased equipment and transfer arrangements', fieldPath: 'propertyItems.leasedItemsDescription', helpText: 'Identify leased appliances, tanks, solar equipment or other items and whether buyer will assume a lease.' },
  ] },
  { id: 'purchase', title: 'Price, deposit, and financing', questions: [
    { id: 'price', type: 'currency', label: 'Purchase price', fieldPath: 'purchase.purchasePriceInCents', validation: { required: true, minimum: 1, message: 'Enter a purchase price above $0.' } },
    { id: 'deposit', type: 'currency', label: 'Earnest money deposit', fieldPath: 'purchase.earnestMoneyInCents', validation: { required: true, minimum: 1, message: 'Enter an earnest money deposit above $0.' } },
    { id: 'holder', type: 'text', label: 'Independent escrow or title holder', fieldPath: 'purchase.earnestMoneyHolder', validation: required('Identify the party that will hold earnest money.') },
    { id: 'due-days', type: 'number', label: 'Calendar days after acceptance to deliver earnest money', fieldPath: 'purchase.earnestMoneyDueDays', validation: { required: true, minimum: 1, maximum: 30, message: 'Enter 1 to 30 days.' } },
    { id: 'funding', type: 'single_choice', label: 'How will the purchase be funded?', fieldPath: 'purchase.financingType', validation: required('Select cash or a loan type.'), options: [
      { value: 'cash', label: 'Cash' }, { value: 'conventional', label: 'Conventional loan' }, { value: 'fha', label: 'FHA loan' }, { value: 'va', label: 'VA loan' }, { value: 'usda', label: 'USDA loan' },
    ] },
    { id: 'loan', type: 'currency', label: 'Expected loan amount', fieldPath: 'purchase.loanAmountInCents', visibleWhen: { match: 'all', conditions: [{ fieldPath: 'purchase.financingType', operator: 'not_equals', value: 'cash' }] } },
    { id: 'concessions', type: 'currency', label: 'Seller concessions', fieldPath: 'purchase.sellerConcessionsInCents' },
    { id: 'extra-deposit', type: 'currency', label: 'Additional earnest money, if agreed', fieldPath: 'purchase.additionalEarnestMoneyInCents', visibleWhen: { match: 'all', conditions: [{ fieldPath: 'conditions.additionalEarnestMoney', operator: 'is_true' }] } },
  ] },
  { id: 'conditions', title: 'Purchase conditions', description: 'Select each condition explicitly; an unchecked condition changes your rights.', questions: [
    yn('conditions.dueDiligence', 'Conditioned on due diligence?', 'Select the due diligence condition.'),
    yn('conditions.appraisal', 'Conditioned on appraisal?', 'Select the appraisal condition.'),
    yn('conditions.financing', 'Conditioned on financing?', 'Select the financing condition.'),
    yn('conditions.saleOfBuyersProperty', 'Conditioned on the sale of another property?', 'Select the sale condition.'),
    yn('conditions.additionalEarnestMoney', 'Will an additional earnest money deposit be due?', 'Select an additional-deposit option.'),
  ] },
  { id: 'deadlines', title: 'Contract deadlines', description: 'Unless the parties agree otherwise, stated dates end at 5:00 p.m. Central Time. The complete statutory condition report must already have been delivered.', questions: [
    { id: 'seller-date', type: 'date', label: 'Deadline for any additional seller documents', fieldPath: 'deadlines.sellerDisclosureDate', validation: required('Set the additional-document deadline.') },
    { id: 'inspection-date', type: 'date', label: 'Due diligence deadline', fieldPath: 'deadlines.dueDiligenceDate', visibleWhen: { match: 'all', conditions: [{ fieldPath: 'conditions.dueDiligence', operator: 'is_true' }] }, validation: required('Set the due diligence deadline.') },
    { id: 'financing-date', type: 'date', label: 'Financing and appraisal deadline', fieldPath: 'deadlines.financingAppraisalDate', visibleWhen: { match: 'any', conditions: [{ fieldPath: 'conditions.financing', operator: 'is_true' }, { fieldPath: 'conditions.appraisal', operator: 'is_true' }] }, validation: required('Set the financing and appraisal deadline.') },
    { id: 'settlement-date', type: 'date', label: 'Settlement deadline', fieldPath: 'deadlines.settlementDate', validation: required('Set the settlement deadline.') },
  ] },
  { id: 'settlement', title: 'Possession and charges', questions: [
    { id: 'possession', type: 'single_choice', label: 'When does the buyer take possession?', fieldPath: 'settlement.possession', validation: required('Choose when possession transfers.'), options: [
      { value: 'at_recording', label: 'At recording' }, { value: 'hours_after', label: 'Specified hours after recording' }, { value: 'days_after', label: 'Specified days after recording' },
    ] },
    { id: 'delay', type: 'number', label: 'Hours or days after recording', fieldPath: 'settlement.possessionDelay', visibleWhen: { match: 'all', conditions: [{ fieldPath: 'settlement.possession', operator: 'not_equals', value: 'at_recording' }] } },
    { id: 'assessment-payer', type: 'single_choice', label: 'Who pays pre-settlement special assessments?', fieldPath: 'settlement.specialAssessmentPayer', validation: required('Select who pays special assessments.'), options: [
      { value: 'buyer', label: 'Buyer' }, { value: 'seller', label: 'Seller' }, { value: 'split', label: 'Split equally' },
    ] },
    { id: 'hoa-payer', type: 'single_choice', label: 'Who pays association transfer fees, if any?', fieldPath: 'settlement.hoaTransferFeePayer', validation: required('Select who pays association transfer fees.'), options: [
      { value: 'buyer', label: 'Buyer' }, { value: 'seller', label: 'Seller' }, { value: 'split', label: 'Split equally' },
    ] },
  ] },
  { id: 'disclosures', title: 'Seller disclosures', questions: [
    { id: 'seller-lease-statement', type: 'yes_no', label: 'Seller states that existing leases affect the property', fieldPath: 'disclosures.sellerReportsExistingLeases', readOnly: true, validation: required('The seller must answer the leases question on the listing.') },
    { id: 'condition-status', type: 'single_choice', label: 'Wisconsin real estate condition report', fieldPath: 'disclosures.propertyConditionStatus', validation: required('Confirm receipt of the complete signed condition report.'), options: [
      { value: 'received', label: 'I received and reviewed the seller-signed report' },
    ] },
    { id: 'lead-status', type: 'single_choice', label: 'Lead-based paint packet', fieldPath: 'disclosures.leadPaintStatus', validation: required('Select the lead paint disclosure status.'), options: [
      { value: 'received', label: 'Signed packet, available reports and EPA pamphlet received' }, { value: 'built_1978_or_later', label: 'Built after 1977' }, { value: 'exempt', label: 'Other federal exemption applies' },
    ] },
    { id: 'lead-inspection', type: 'single_choice', label: 'Buyer’s lead paint inspection opportunity', fieldPath: 'disclosures.leadInspectionSelection', visibleWhen: { match: 'all', conditions: [{ fieldPath: 'disclosures.leadPaintStatus', operator: 'equals', value: 'received' }] }, validation: required('Select the buyer’s lead inspection option.'), options: [
      { value: 'ten_days', label: '10 days for a lead inspection or risk assessment' }, { value: 'waived', label: 'Buyer waives the inspection opportunity' }, { value: 'other_period', label: 'Different period agreed in writing' },
    ] },
    { id: 'lead-inspection-days', type: 'number', label: 'Agreed lead inspection days', fieldPath: 'disclosures.leadInspectionDays', visibleWhen: { match: 'all', conditions: [{ fieldPath: 'disclosures.leadInspectionSelection', operator: 'equals', value: 'other_period' }] }, validation: { required: true, minimum: 1, maximum: 60, message: 'Enter 1 to 60 agreed days.' } },
    { id: 'hoa-status', type: 'single_choice', label: 'Association documents (if applicable)', fieldPath: 'disclosures.hoaDocumentsStatus', validation: required('Select the association document status.'), options: [
      { value: 'received', label: 'Received' }, { value: 'pending', label: 'To be provided before closing' }, { value: 'not_applicable', label: 'No association' },
    ] },
    { id: 'lease-acknowledgement', type: 'acknowledgement', label: 'I have reviewed the seller’s statement about existing leases and the separate condition report.', fieldPath: 'disclosures.leaseStatementAcknowledged', validation: required('Review and acknowledge the seller statement and condition report.') },
  ] },
  { id: 'additional', title: 'Additional terms', questions: [
    { id: 'additional-terms', type: 'textarea', label: 'Party-provided additional terms', fieldPath: 'additionalTerms', helpText: 'Ask a Wisconsin attorney to review any new legal language.' },
  ] },
  { id: 'delivery', title: 'Offer delivery and review', questions: [
    { id: 'expiration', type: 'date_time', label: 'Offer expires', fieldPath: 'delivery.expiresAt', validation: required('Set a future expiration date and time.') },
    { id: 'electronic', type: 'acknowledgement', label: 'I agree to electronic delivery and signatures for this offer.', fieldPath: 'delivery.electronicDeliveryAuthorized', validation: required('Electronic delivery consent is required.') },
  ] },
];
