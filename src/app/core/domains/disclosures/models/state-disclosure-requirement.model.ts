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
  | 'utah-methamphetamine-contamination'
  | 'wisconsin-real-estate-condition-report'
  | 'wisconsin-association-documents'
  | 'florida-flood-disclosure'
  | 'florida-seller-property-disclosure'
  | 'florida-hoa-disclosure-summary';

export interface StateDisclosureRequirement {
  readonly description: string;
  readonly documentType:
    DisclosureDocumentType;
  readonly formCode: string;
  /** A blank PDF that the seller can save, complete, and upload. */
  readonly formDownloadUrl?: string;
  readonly additionalDownloads?: readonly { readonly label: string; readonly url: string }[];
  /** Official source for the form or the governing instructions. */
  readonly officialFormUrl?: string;
  /** Where to obtain a property-specific document without a blank form. */
  readonly sourceInstructions?: string;
  readonly required: boolean;
  readonly shortTitle: string;
  readonly sortOrder: number;
  readonly title: string;
}
