// Generated from state-contracts/california/offer-policy-mappings.json. Do not edit.
import type { HoaApplicabilityPolicy } from '../hoa-applicability-policy';
import type { FederalLeadTermPolicy } from '../federal-lead-policy';

export const HOA_POLICY = {
  "sellerFactPath": "disclosures.sellerReportsHoa",
  "documentStatusPath": "disclosures.hoaDocumentsStatus",
  "documentTypes": ["california-association-documents"],
} as const satisfies HoaApplicabilityPolicy;

export const FEDERAL_LEAD_POLICY = {
  "values": {
    "disclosures.leadPaintStatus": "built_1978_or_later",
    "disclosures.leadInspectionSelection": "unselected",
    "disclosures.leadInspectionDays": 10,
    "disclosures.leadExemptionBasis": "",
    "documentVersions.lead-based-paint": undefined,
  },
  "hiddenFields": ["disclosures.leadPaintStatus", "disclosures.leadInspectionSelection", "disclosures.leadInspectionDays", "disclosures.leadExemptionBasis"],
} as const satisfies FederalLeadTermPolicy;
