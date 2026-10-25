// Generated from state-contracts/oklahoma/offer-policy-mappings.json. Do not edit.
import type { HoaApplicabilityPolicy } from '../hoa-applicability-policy';
import type { FederalLeadTermPolicy } from '../federal-lead-policy';

export const HOA_POLICY = {
  "documentTypes": [],
  "auditedNoReceiptQuestion": true,
} as const satisfies HoaApplicabilityPolicy;

export const FEDERAL_LEAD_POLICY = {
  "values": {
    "disclosures.leadBasedPaintStatus": "built_1978_or_later",
  },
  "nonHousingValues": {
    "disclosures.leadBasedPaintStatus": "not_residential",
  },
  "hiddenFields": ["disclosures.leadBasedPaintStatus"],
} as const satisfies FederalLeadTermPolicy;
