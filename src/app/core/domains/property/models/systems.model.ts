import {
  CoolingType,
  HeatingType,
  SewerType,
  WaterSource
} from './property.types';

export interface Systems {
  cooling: CoolingType[];
  electricProvider?: string;
  gasProvider?: string;
  heating: HeatingType[];
  internetProviders?: string[];
  sewerType: SewerType;
  waterSource: WaterSource;
}