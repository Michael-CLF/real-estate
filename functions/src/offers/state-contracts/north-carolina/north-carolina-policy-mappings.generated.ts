// Generated from state-contracts/north-carolina/offer-policy-mappings.json. Do not edit.
import type { HoaApplicabilityPolicy } from '../hoa-applicability-policy';
import type { FederalLeadTermPolicy } from '../federal-lead-policy';

export const HOA_POLICY = {
  "sellerFactPath": "sellerStatements.ownersAssociationApplies",
  "documentTypes": [],
  "auditedNoReceiptQuestion": true,
} as const satisfies HoaApplicabilityPolicy;

export const FEDERAL_LEAD_POLICY = {
  "listingStatementRequired": true,
  "values": {
    "sellerStatements.leadBasedPaintApplies": false,
    "sellerStatements.leadBasedPaintDisclosureDocumentUid": undefined,
  },
  "hiddenFields": [],
} as const satisfies FederalLeadTermPolicy;
