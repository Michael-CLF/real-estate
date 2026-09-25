export const OREC_RESIDENTIAL_SALE_TEMPLATE = {
  contractType: 'residential_sale_2026',
  formId: 'OREC-RESIDENTIAL-SALE-2026',
  formName: 'Oklahoma Uniform Contract of Sale of Real Estate - Residential Sale',
  effectiveDate: '2026-01-01',
  templateVersion: '2026-01-01',
  pageCount: 8,
  outputPageCount: 9,
  sha256: '97ba5efd1dfd9ee924c38abb959e06bf00802d85f67f0f9945c8ee4faa467272',
  assetRelativePath: 'assets/offers/oklahoma/contracts/residential-sale/2026-residential-sale.pdf',
  propertyIdentifierFields: [
    'Text Field 31.Page 1', 'Text Field 31.Page 2', 'Text Field 32.Page 3',
    'Text Field 32.Page 4', 'Text Field 32.Page 5', 'Text Field 32.Page 6',
    'Text Field 32.Page 7', 'Text Field 32.Page 8',
  ],
  contractDocumentCheckboxes: {
    conventional_loan: 'Check Box 66', fha_loan: 'Check Box 67', va_loan: 'Check Box 68',
    usda_loan: 'Check Box 69', native_american_loan: 'Check Box 70', assumption: 'Check Box 71',
    seller_financing: 'Check Box 72', proof_of_funds: 'Check Box 73', single_family_hoa: 'Check Box 74',
    condo_townhouse_association: 'Check Box 75', supplement: 'Check Box 76',
    buyer_property_under_contract: 'Check Box 77', buyer_property_not_under_contract: 'Check Box 78',
    cooperative_compensation: 'Check Box 79',
  },
} as const;
