export type PropertyType =
  | 'single_family'
  | 'condominium'
  | 'townhome'
  | 'multifamily'
  | 'manufactured'
  | 'land'
  | 'farm'
  | 'other';

export interface PropertyTypeOption {
  label: string;
  value: PropertyType;
}

export const PROPERTY_TYPE_OPTIONS: readonly PropertyTypeOption[] = [
  {
    label: 'Single-Family',
    value: 'single_family'
  },
  {
    label: 'Condominium',
    value: 'condominium'
  },
  {
    label: 'Townhome',
    value: 'townhome'
  },
  {
    label: 'Multifamily',
    value: 'multifamily'
  },
  {
    label: 'Manufactured',
    value: 'manufactured'
  },
  {
    label: 'Land',
    value: 'land'
  },
  {
    label: 'Farm',
    value: 'farm'
  },
  {
    label: 'Other',
    value: 'other'
  }
] as const;