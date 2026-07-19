export type CoolingType =
  | 'central'
  | 'ductless'
  | 'evaporative'
  | 'heat_pump'
  | 'none'
  | 'other'
  | 'window_units';

export type HeatingType =
  | 'baseboard'
  | 'central'
  | 'forced_air'
  | 'geothermal'
  | 'heat_pump'
  | 'none'
  | 'other'
  | 'radiant';

export type HoaFeeFrequency =
  | 'annual'
  | 'monthly'
  | 'quarterly'
  | 'semiannual';

export type ParkingType =
  | 'attached_garage'
  | 'carport'
  | 'detached_garage'
  | 'driveway'
  | 'none'
  | 'other'
  | 'street';

export type PropertyStatus =
  | 'active'
  | 'archived'
  | 'draft'
  | 'inactive'
  | 'sold'
  | 'under_contract';

export type PropertyType =
  | 'commercial'
  | 'condominium'
  | 'farm'
  | 'land'
  | 'manufactured_home'
  | 'mobile_home'
  | 'multi_family'
  | 'other'
  | 'single_family'
  | 'townhouse';

export type SewerType =
  | 'none'
  | 'private'
  | 'public'
  | 'septic'
  | 'unknown';

export type WaterSource =
  | 'community'
  | 'none'
  | 'private'
  | 'public'
  | 'unknown'
  | 'well';