export type DisclosureDocumentType =
  | 'michigan-seller-disclosure'
  | 'michigan-statutory-packet'
  | 'michigan-association-documents'
  | 'minnesota-seller-disclosure'
  | 'minnesota-statutory-packet'
  | 'minnesota-association-documents'
  | 'south-carolina-property-condition'
  | 'south-carolina-association-documents'
  | 'south-carolina-coastal-disclosure'
  | 'south-carolina-vacation-rentals'

  | 'california-transfer-disclosure'
  | 'california-natural-hazard-disclosure'
  | 'california-fire-hardening'
  | 'california-defensible-space'
  | 'california-recent-renovations'
  | 'california-assisted-water-tank'
  | 'california-association-documents'
  | 'california-local-disclosures'
  | 'california-safety-compliance'
  | 'california-earthquake-environmental-guides'
  | 'lead-based-paint'
  | 'residential-property-owners-association'
  | 'mineral-oil-gas-rights'
  | 'colorado-property-disclosure'
  | 'colorado-association-documents'
  | 'colorado-radon-brochure'
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
  | 'florida-hoa-disclosure-summary'
  | 'louisiana-property-disclosure'
  | 'louisiana-vacant-residential-property-disclosure';

export interface StateDisclosureRequirement {
  readonly description: string;
  readonly documentType:
  DisclosureDocumentType;
  readonly formCode: string;
  /** A blank PDF that the seller can save, complete, and upload. */
  readonly formDownloadUrl?: string;
  readonly formDownloadLabel?: string;
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