// Generated from state-contracts/texas/offer-policy-mappings.json. Do not edit.
import type { HoaApplicabilityPolicy } from '../hoa-applicability-policy';
import type { FederalLeadTermPolicy } from '../federal-lead-policy';

export const HOA_POLICY = {
  "sellerFactPath": "propertyAssociation.mandatoryMembership",
  "documentTypes": [],
  "evidencePaths": ["propertyAssociation.associationAddendumDocumentUid"],
} as const satisfies HoaApplicabilityPolicy;

export const FEDERAL_LEAD_POLICY = {
  "listingStatementRequired": true,
  "values": {
    "disclosures.leadBasedPaintApplies": false,
    "disclosures.leadBasedPaintAddendumDocumentUid": undefined,
  },
  "hiddenFields": ["disclosures.leadBasedPaintApplies"],
  "addendum": {
    "path": "addenda",
    "idKey": "formId",
    "id": "lead-based-paint",
    "selectedKey": "included",
  },
} as const satisfies FederalLeadTermPolicy;
