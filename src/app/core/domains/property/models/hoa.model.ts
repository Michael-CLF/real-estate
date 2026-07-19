import { HoaFeeFrequency } from './property.types';

export interface Hoa {
  amenities?: string[];
  contactEmail?: string;
  contactPhone?: string;
  feeAmount?: number;
  feeFrequency?: HoaFeeFrequency;
  hasHoa: boolean;
  name?: string;
  websiteUrl?: string;
}