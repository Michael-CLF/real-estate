export type DisclosureDocumentType =
  | 'residential-property-owners-association'
  | 'mineral-oil-gas-rights';

export interface StateDisclosureRequirement {
  readonly description: string;
  readonly documentType: DisclosureDocumentType;
  readonly formCode: string;
  readonly officialFormUrl: string;
  readonly required: boolean;
  readonly shortTitle: string;
  readonly sortOrder: number;
  readonly title: string;
}