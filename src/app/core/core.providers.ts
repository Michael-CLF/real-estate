import { Provider } from '@angular/core';

import {
  ListingRepository
} from './domains/listings/repositories/listing.repository';

import {
  FirebaseListingRepository
} from './infrastructure/firebase/listings/firebase-listing.repository';

export const CORE_PROVIDERS: Provider[] = [
  {
    provide: ListingRepository,
    useExisting: FirebaseListingRepository
  }
];