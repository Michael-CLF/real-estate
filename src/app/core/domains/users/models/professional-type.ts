export type ProfessionalCategory =
  | 'financing'
  | 'legal'
  | 'title_and_closing'
  | 'inspections'
  | 'property_and_valuation'
  | 'home_preparation'
  | 'insurance_and_protection'
  | 'moving_and_storage';

export type ProfessionalType =
  | 'bank'
  | 'credit_union'
  | 'mortgage_lender'
  | 'mortgage_broker'
  | 'construction_lender'
  | 'real_estate_attorney'
  | 'closing_attorney'
  | 'title_company'
  | 'escrow_company'
  | 'settlement_company'
  | 'mobile_notary'
  | 'qualified_intermediary'
  | 'home_inspector'
  | 'pest_inspector'
  | 'environmental_inspector'
  | 'structural_engineer'
  | 'independent_appraiser'
  | 'land_surveyor'
  | 'property_tax_consultant'
  | 'real_estate_photographer'
  | 'floor_plan_service'
  | 'home_stager'
  | 'general_contractor'
  | 'painter'
  | 'handyman'
  | 'cleaning_company'
  | 'landscaper'
  | 'junk_removal_company'
  | 'locksmith'
  | 'insurance_agency'
  | 'flood_insurance_specialist'
  | 'home_warranty_company'
  | 'moving_company'
  | 'packing_service'
  | 'storage_facility';

export const PROFESSIONAL_CATEGORY_LABELS:
  Readonly<Record<ProfessionalCategory, string>> = {
    financing: 'Financing',
    legal: 'Legal',
    title_and_closing: 'Title and closing',
    inspections: 'Inspections',
    property_and_valuation:
      'Property and valuation',
    home_preparation: 'Home preparation',
    insurance_and_protection:
      'Insurance and protection',
    moving_and_storage: 'Moving and storage'
  };

export const PROFESSIONAL_TYPE_LABELS:
  Readonly<Record<ProfessionalType, string>> = {
    bank: 'Bank',
    credit_union: 'Credit union',
    mortgage_lender: 'Mortgage lender',
    mortgage_broker: 'Mortgage broker',
    construction_lender:
      'Construction and renovation lender',

    real_estate_attorney:
      'Real estate attorney',
    closing_attorney: 'Closing attorney',

    title_company: 'Title company',
    escrow_company: 'Escrow company',
    settlement_company:
      'Settlement company',
    mobile_notary: 'Mobile notary',
    qualified_intermediary:
      '1031 exchange intermediary',

    home_inspector: 'Home inspector',
    pest_inspector:
      'Pest and termite inspector',
    environmental_inspector:
      'Environmental inspector',
    structural_engineer:
      'Structural engineer',

    independent_appraiser:
      'Independent appraiser',
    land_surveyor: 'Land surveyor',
    property_tax_consultant:
      'Property tax consultant',

    real_estate_photographer:
      'Real estate photographer',
    floor_plan_service:
      'Floor-plan and measurement service',
    home_stager: 'Home stager',
    general_contractor:
      'General contractor',
    painter: 'Painter',
    handyman: 'Handyman',
    cleaning_company: 'Cleaning company',
    landscaper: 'Landscaper',
    junk_removal_company:
      'Junk-removal company',
    locksmith: 'Locksmith',

    insurance_agency:
      'Insurance agency',
    flood_insurance_specialist:
      'Flood insurance specialist',
    home_warranty_company:
      'Home-warranty company',

    moving_company: 'Moving company',
    packing_service: 'Packing service',
    storage_facility: 'Storage facility'
  };