export type DisclosureDocumentType =
  | 'montana-seller-disclosure'
  | 'montana-statutory-packet'
  | 'montana-association-documents'
  | 'iowa-seller-disclosure'
  | 'iowa-statutory-packet'
  | 'iowa-association-documents'
  | 'washington-seller-disclosure'
  | 'washington-statutory-packet'
  | 'washington-association-documents'
  | 'delaware-seller-disclosure'
  | 'delaware-statutory-packet'
  | 'delaware-association-documents'
  | 'ohio-seller-disclosure'
  | 'ohio-statutory-packet'
  | 'ohio-association-documents'
  | 'kansas-seller-disclosure'
  | 'kansas-statutory-packet'
  | 'kansas-association-documents'
  | 'indiana-seller-disclosure'
  | 'indiana-statutory-packet'
  | 'indiana-association-documents'
  | 'alabama-seller-disclosure'
  | 'alabama-statutory-packet'
  | 'alabama-association-documents'
  | 'new-hampshire-seller-disclosure'
  | 'new-hampshire-statutory-packet'
  | 'new-hampshire-association-documents'
  | 'nebraska-seller-disclosure'
  | 'nebraska-statutory-packet'
  | 'nebraska-association-documents'
  | 'missouri-seller-disclosure'
  | 'missouri-statutory-packet'
  | 'missouri-association-documents'
  | 'oregon-seller-disclosure'
  | 'oregon-statutory-packet'
  | 'oregon-association-documents'
  | 'idaho-seller-disclosure'
  | 'idaho-statutory-packet'
  | 'idaho-association-documents'
  | 'arizona-seller-disclosure'
  | 'arizona-statutory-packet'
  | 'arizona-association-documents'
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
  readonly requiredBeforeAcceptance?: boolean;
  readonly shortTitle: string;
  readonly sortOrder: number;
  readonly title: string;
}