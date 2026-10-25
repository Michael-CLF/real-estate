// Generated from state-contracts/colorado/offer-policy-mappings.json. Do not edit.
import type { HoaApplicabilityPolicy } from '../../hoa-applicability-policy';
import type { FederalLeadTermPolicy } from '../../federal-lead-policy';

export const HOA_POLICY = {
  "sellerFactPath": "disclosures.sellerReportsHoa",
  "documentStatusPath": "disclosures.associationStatus",
  "documentTypes": ["colorado-association-documents"],
} as const satisfies HoaApplicabilityPolicy;

export const FEDERAL_LEAD_POLICY = {
  "values": {
    "disclosures.leadPaintStatus": "not_applicable",
    "disclosures.leadInspectionChoice": "unselected",
    "disclosures.leadInspectionDays": 10,
    "documentVersions.lead-based-paint": undefined,
  },
  "hiddenFields": ["disclosures.leadPaintStatus", "disclosures.leadInspectionChoice", "disclosures.leadInspectionDays", "deadlines.leadDisclosure", "deadlines.leadTermination"],
} as const satisfies FederalLeadTermPolicy;
