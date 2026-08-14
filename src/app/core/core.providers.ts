import { Provider } from '@angular/core';

import {
  ListingRepository
} from './domains/listings/repositories/listing.repository';

import {
  FirebaseListingRepository
} from './infrastructure/firebase/listings/firebase-listing.repository';

import {
  ShowingRepository
} from './domains/showings/repositories/showing.repository';

import {
  FirebaseShowingRepository
} from './infrastructure/firebase/showings/firebase-showing.repository';

export const CORE_PROVIDERS: Provider[] = [
  {
    provide: ListingRepository,
    useExisting: FirebaseListingRepository
  },
  {
  provide: ShowingRepository,
  useExisting: FirebaseShowingRepository
}
];