import { Observable } from 'rxjs';

import {
  ShowingAvailability,
  ShowingAvailabilityUpdate,
  ShowingReservedTime
} from '../models/showing-availability.model';

import {
  CreateShowingRequestInput,
  ProposeAlternateShowingTimeInput,
  RespondToShowingRequestInput,
  ShowingRequest
} from '../models/showing-request.model';

export type ShowingRequestChanges = Partial<
  Omit<
    ShowingRequest,
    | 'showingRequestUid'
    | 'listingUid'
    | 'sellerUid'
    | 'buyerUid'
    | 'propertyAddress'
    | 'propertyCity'
    | 'propertyState'
    | 'propertyZipCode'
    | 'primaryPhotoUrl'
    | 'buyerContact'
    | 'requestedTime'
    | 'createdAt'
  >
>;

export abstract class ShowingRepository {
  /*
   * SHOWING AVAILABILITY
   *
   * These methods operate on:
   * showingAvailability/{listingUid}
   */

  abstract createAvailability(
    availability: ShowingAvailability
  ): Promise<void>;

  abstract updateAvailability(
    listingUid: string,
    sellerUid: string,
    changes: ShowingAvailabilityUpdate
  ): Promise<void>;

  abstract getAvailabilityByListingUid(
    listingUid: string
  ): Observable<ShowingAvailability | null>;

  abstract getReservedTimesForDate(
    listingUid: string,
    date: string
  ): Observable<ShowingReservedTime[]>;

  abstract createShowingRequestIfAvailable(
    request: CreateShowingRequestInput
  ): Promise<string>;

  abstract confirmShowingRequestIfAvailable(
    input: RespondToShowingRequestInput
  ): Promise<void>;

  abstract proposeAlternateTimeIfAvailable(
    input: ProposeAlternateShowingTimeInput
  ): Promise<void>;

  abstract getShowingRequestByUid(
    showingRequestUid: string
  ): Observable<ShowingRequest | null>;

  abstract getShowingRequestsBySellerUid(
    sellerUid: string
  ): Observable<ShowingRequest[]>;

  abstract getShowingRequestsByBuyerUid(
    buyerUid: string
  ): Observable<ShowingRequest[]>;

  abstract getShowingRequestsByListingUid(
    listingUid: string
  ): Observable<ShowingRequest[]>;

  abstract updateShowingRequest(
    showingRequestUid: string,
    changes: ShowingRequestChanges
  ): Promise<void>;
}