import { ParkingType } from './property.types';

export interface Parking {
  coveredSpaces?: number;
  garageSpaces: number;
  rvParking?: boolean;
  totalSpaces: number;
  type: ParkingType;
}