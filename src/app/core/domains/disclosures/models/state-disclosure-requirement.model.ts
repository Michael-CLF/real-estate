export type DisclosureDocumentType =
  | 'maine-seller-disclosure'
  | 'maine-statutory-packet'
  | 'maine-association-documents'
  | 'georgia-seller-disclosure'
  | 'georgia-statutory-packet'
  | 'georgia-association-documents'
  | 'nevada-seller-disclosure'
  | 'nevada-statutory-packet'
  | 'nevada-association-documents'
  | 'north-dakota-seller-disclosure'
  | 'north-dakota-statutory-packet'
  | 'north-dakota-association-documents'
  | 'pennsylvania-seller-disclosure'
  | 'pennsylvania-statutory-packet'
  | 'pennsylvania-association-documents'
  | 'mississippi-seller-disclosure'
  | 'mississippi-statutory-packet'
  | 'mississippi-association-documents'
  | 'arkansas-seller-disclosure'
  | 'arkansas-statutory-packet'
  | 'arkansas-association-documents'
  | 'illinois-seller-disclosure'
  | 'illinois-statutory-packet'
  | 'illinois-association-documents'

  | 'wyoming-seller-disclosure'
  | 'wyoming-statutory-packet'
  | 'wyoming-association-documents'
  | 'south-dakota-seller-disclosure'
  | 'south-dakota-statutory-packet'
  | 'south-dakota-association-documents'
  | 'new-mexico-seller-disclosure'
  | 'new-mexico-statutory-packet'
  | 'new-mexico-association-documents'
  | 'maryland-seller-disclosure'
  | 'maryland-statutory-packet'
  | 'maryland-association-documents'
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
  | 'missouri-condominium-resale-certificate'
  | 'missouri-tenant-records'
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
  readonly appliesToListing?: (listing:{propertyType:string;sellerStatements?:{contractFacts?:{isCondominium?:boolean|null};leasesExist?:boolean}}) => boolean;
  /** Explicit platform upload timing; does not redefine the statutory deadline. */
  readonly requiredBeforeOffers?: boolean;
  readonly requiredBeforeClosing?: boolean;
  readonly requiredBeforeClosingLabel?: string;
  readonly required: boolean;
  readonly requiredBeforeAcceptance?: boolean;
  readonly requiredBeforeAcceptanceLabel?: string;
  readonly shortTitle: string;
  readonly sortOrder: number;
  readonly title: string;
}
