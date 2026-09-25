export type DisclosureDocumentType =
  | 'lead-based-paint'
  | 'residential-property-owners-association'
  | 'mineral-oil-gas-rights'
  | 'texas-seller-disclosure-notice'
  | 'texas-residential-leases'
  | 'texas-fixture-leases'
  | 'texas-natural-resource-leases'
  | 'oklahoma-property-condition-disclosure'
  | 'oklahoma-property-condition-disclaimer'
  | 'oklahoma-property-condition-exemption'
  | 'utah-seller-property-condition'
  | 'utah-hoa-governing-documents'
  | 'utah-methamphetamine-contamination';

export interface StateDisclosureRequirement {
  readonly description: string;
  readonly documentType:
    DisclosureDocumentType;
  readonly formCode: string;
  readonly officialFormUrl?: string;
  readonly required: boolean;
  readonly shortTitle: string;
  readonly sortOrder: number;
  readonly title: string;
}
