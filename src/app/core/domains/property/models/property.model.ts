import {
  PropertyStatus,
  PropertyType
} from './property.types';

import { Address } from './address.model';
import { Construction } from './construction.model';
import { Dimensions } from './dimensions.model';
import { Features } from './features.model';
import { Hoa } from './hoa.model';
import { Location } from './location.model';
import { Media } from './media.model';
import { Parcel } from './parcel.model';
import { Parking } from './parking.model';
import { Rooms } from './rooms.model';
import { SchoolInformation } from './school-information.model';
import { Systems } from './systems.model';

export interface Property {
  address: Address;
  construction: Construction;
  createdAt: Date;
  dimensions: Dimensions;
  features: Features;
  hoa: Hoa;
  id?: string;
  location?: Location;
  media: Media;
  ownerUserId: string;
  parcel: Parcel;
  parking: Parking;
  propertyType: PropertyType;
  rooms: Rooms;
  schools: SchoolInformation;
  status: PropertyStatus;
  systems: Systems;
  updatedAt: Date;
}