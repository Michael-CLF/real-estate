// Generated from state-contracts/missouri/offer-policy-mappings.json. Do not edit.
import type { HoaApplicabilityPolicy } from '../hoa-applicability-policy';
import type { FederalLeadTermPolicy } from '../federal-lead-policy';

export const HOA_POLICY = {
  "sellerFactPath": "disclosures.sellerReportsHoa",
  "documentStatusPath": "disclosures.hoaDocumentsStatus",
  "documentTypes": ["missouri-association-documents"],
} as const satisfies HoaApplicabilityPolicy;

export const FEDERAL_LEAD_POLICY = {
  "values": {
    "disclosures.leadPaintStatus": "built_1978_or_later",
    "disclosures.leadInspectionSelection": "unselected",
    "disclosures.leadInspectionDays": 10,
    "documentVersions.lead-based-paint": undefined,
  },
  "nonHousingValues": {
    "disclosures.leadPaintStatus": "not_applicable",
  },
  "hiddenFields": ["disclosures.leadPaintStatus", "disclosures.leadInspectionSelection", "disclosures.leadInspectionDays"],
} as const satisfies FederalLeadTermPolicy;
