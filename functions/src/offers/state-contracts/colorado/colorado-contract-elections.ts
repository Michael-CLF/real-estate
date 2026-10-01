export interface ColoradoPropertyFacts {
  landArea?: string;
  includedItems: string;
  excludedItems: string;
  leasedItems: string;
  encumberedItems: string;
  solarPowerPlan: string;
  parkingStorage: string;
  waterSource: string;
  deededWaterRights: string;
  otherWaterRights: string;
  wellPermit: string;
  waterStock: string;
  mineralRights: string;
  offRecordMatters: string;
  thirdPartyRights: string;
  leases: string;
  metroDistrict: 'unselected' | 'not_applicable' | 'covered' | 'unknown';
  metroDistrictWebsite: string;
  metroDistrictDisclosure: string;
}

export interface ColoradoContractElections {
  vesting: 'unselected' | 'joint_tenants' | 'tenants_in_common' | 'other';
  vestingOther: string;
  separatePersonalPropertyAgreement: boolean | null;
  personalPropertyAgreementDocument: string;
  assumeLeasedItems: boolean | null;
  assumeEncumberedItems: boolean | null;
  assumeSolarPlan: boolean | null;
  waterRightsExamination: boolean | null;
  mineralRightsExamination: boolean | null;
  principalResidence: boolean | null;
  otherLoanDescription: string;
  prohibitedFeeCapInCents: number;
  appraisalPayer: 'unselected' | 'buyer' | 'seller';
  insuranceReview: boolean | null;
  dueDiligenceReview: boolean | null;
  dueDiligenceOther: string;
  titleEvidence: 'unselected' | 'commitment' | 'abstract';
  extendedCoverage: boolean | null;
  extendedCoveragePayer: 'unselected' | 'buyer' | 'seller' | 'split' | 'other';
  extendedCoverageOther: string;
  taxCertificatePayer: 'unselected' | 'buyer' | 'seller';
  surveyOrderer: 'unselected' | 'buyer' | 'seller';
  surveyDescription: string;
  surveyOtherRecipients: string;
  closingCompany: string;
  closingInstructions: boolean | null;
  closingInstructionsDocument: string;
  taxProration: 'unselected' | 'previous_year' | 'latest_assessment' | 'other';
  taxProrationOther: string;
  associationRecordFeePayer: 'unselected' | 'buyer' | 'seller' | 'split';
  associationReservePayer: 'unselected' | 'buyer' | 'seller' | 'split';
  associationOtherFeePayer: 'unselected' | 'buyer' | 'seller' | 'split';
  transferTaxPayer: 'unselected' | 'buyer' | 'seller' | 'split';
  salesUseTaxPayer: 'unselected' | 'buyer' | 'seller' | 'split';
  privateTransferFeePayer: 'unselected' | 'buyer' | 'seller' | 'split';
  waterTransferFeePayer: 'unselected' | 'buyer' | 'seller' | 'split';
  utilityTransferFeePayer: 'unselected' | 'buyer' | 'seller' | 'split';
  rentProration: 'unselected' | 'received' | 'accrued';
  otherProrations: string;
  postClosingOccupancyDocument: string;
  buyerDefaultRemedy: 'unselected' | 'liquidated_damages' | 'specific_performance';
  incorporatedAttachments: string;
}

export const COLORADO_FACT_DEFAULTS: ColoradoPropertyFacts = {
  includedItems: '',
  excludedItems: '',
  leasedItems: '',
  encumberedItems: '',
  solarPowerPlan: '',
  parkingStorage: '',
  waterSource: '',
  deededWaterRights: '',
  otherWaterRights: '',
  wellPermit: '',
  waterStock: '',
  mineralRights: '',
  offRecordMatters: '',
  thirdPartyRights: '',
  leases: '',
  metroDistrict: 'unselected',
  metroDistrictWebsite: '',
  metroDistrictDisclosure: '',
};

export const COLORADO_ELECTION_DEFAULTS: ColoradoContractElections = {
  vesting: 'unselected',
  vestingOther: '',
  separatePersonalPropertyAgreement: null,
  personalPropertyAgreementDocument: '',
  assumeLeasedItems: null,
  assumeEncumberedItems: null,
  assumeSolarPlan: null,
  waterRightsExamination: null,
  mineralRightsExamination: null,
  principalResidence: null,
  otherLoanDescription: '',
  prohibitedFeeCapInCents: 0,
  appraisalPayer: 'unselected',
  insuranceReview: null,
  dueDiligenceReview: null,
  dueDiligenceOther: '',
  titleEvidence: 'unselected',
  extendedCoverage: null,
  extendedCoveragePayer: 'unselected',
  extendedCoverageOther: '',
  taxCertificatePayer: 'unselected',
  surveyOrderer: 'unselected',
  surveyDescription: '',
  surveyOtherRecipients: '',
  closingCompany: '',
  closingInstructions: null,
  closingInstructionsDocument: '',
  taxProration: 'unselected',
  taxProrationOther: '',
  associationRecordFeePayer: 'unselected',
  associationReservePayer: 'unselected',
  associationOtherFeePayer: 'unselected',
  transferTaxPayer: 'unselected',
  salesUseTaxPayer: 'unselected',
  privateTransferFeePayer: 'unselected',
  waterTransferFeePayer: 'unselected',
  utilityTransferFeePayer: 'unselected',
  rentProration: 'unselected',
  otherProrations: '',
  postClosingOccupancyDocument: '',
  buyerDefaultRemedy: 'unselected',
  incorporatedAttachments: '',
};