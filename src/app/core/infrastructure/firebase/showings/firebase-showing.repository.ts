import {
  Injectable
} from '@angular/core';

import {
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  QuerySnapshot,
  Timestamp,
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';

import {
  httpsCallable
} from 'firebase/functions';

import {
  Observable
} from 'rxjs';

import {
  firestore,
  functions
} from '../firebase';

import {
  ShowingAvailability,
  ShowingAvailabilityUpdate,
  ShowingReservedTime
} from '../../../domains/showings/models/showing-availability.model';

import {
  CreateShowingRequestInput,
  ProposeAlternateShowingTimeInput,
  RespondToAlternateShowingTimeInput,
  RespondToShowingRequestInput,
  ShowingRequest,
  ShowingRequestStatus,
  ShowingRequestedTime,
  ShowingStatusHistoryEntry
} from '../../../domains/showings/models/showing-request.model';

import {
  ShowingRepository,
  ShowingRequestChanges
} from '../../../domains/showings/repositories/showing.repository';

interface CreateShowingRequestFunctionData {
  listingUid: string;

  buyerContact:
  CreateShowingRequestInput['buyerContact'];

  requestedTime:
  CreateShowingRequestInput['requestedTime'];

  buyerMessage: string;
}

interface CreateShowingRequestFunctionResponse {
  success: true;
  showingRequestUid: string;
  status: 'pending';
}

type ShowingRequestResponseAction =
  | 'confirm'
  | 'decline'
  | 'propose_alternate'
  | 'accept_alternate'
  | 'decline_alternate';

interface RespondToShowingRequestFunctionData {
  showingRequestUid: string;
  action: ShowingRequestResponseAction;
  responseMessage: string;

  alternateTime?: {
    date: string;
    startTime: string;
    endTime: string;
    timeZone: string;
    message?: string;
  };
}

interface RespondToShowingRequestFunctionResponse {
  success: true;
  showingRequestUid: string;
  listingUid: string;
  status: ShowingRequestStatus;
}

interface ShowingScheduleReservation {
  showingRequestUid: string;
  startTime: string;
  endTime: string;
  status: ShowingRequestStatus;
}

interface ShowingScheduleDate {
  listingUid: string;
  date: string;
  reservations: ShowingScheduleReservation[];
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseShowingRepository
  extends ShowingRepository {

  private readonly availabilityCollectionName =
    'showingAvailability';

  private readonly requestCollectionName =
    'showingRequests';

  private readonly scheduleCollectionName =
    'showingSchedules';

  private readonly createShowingRequestFunction =
    httpsCallable<
      CreateShowingRequestFunctionData,
      CreateShowingRequestFunctionResponse
    >(
      functions,
      'createShowingRequest'
    );

  private readonly respondToShowingRequestFunction =
    httpsCallable<
      RespondToShowingRequestFunctionData,
      RespondToShowingRequestFunctionResponse
    >(
      functions,
      'respondToShowingRequest'
    );

  /*
   * SHOWING AVAILABILITY
   */

  override async createAvailability(
    availability: ShowingAvailability
  ): Promise<void> {
    const availabilityReference = doc(
      firestore,
      this.availabilityCollectionName,
      availability.listingUid
    );

    await setDoc(
      availabilityReference,
      {
        listingUid:
          availability.listingUid,

        sellerUid:
          availability.sellerUid,

        acceptingRequests:
          availability.acceptingRequests,

        timeZone:
          availability.timeZone,

        appointmentDurationMinutes:
          availability.appointmentDurationMinutes,

        bufferMinutes:
          availability.bufferMinutes,

        minimumNoticeHours:
          availability.minimumNoticeHours,

        bookingWindowDays:
          availability.bookingWindowDays,

        weeklyAvailability:
          availability.weeklyAvailability,

        exceptions:
          availability.exceptions,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    );
  }

  override async updateAvailability(
    listingUid: string,
    sellerUid: string,
    changes: ShowingAvailabilityUpdate
  ): Promise<void> {
    const availabilityReference = doc(
      firestore,
      this.availabilityCollectionName,
      listingUid
    );

    await runTransaction(
      firestore,
      async transaction => {
        const snapshot =
          await transaction.get(
            availabilityReference
          );

        if (!snapshot.exists()) {
          throw new Error(
            'Showing availability could not be found.'
          );
        }

        const existingSellerUid =
          snapshot.data()['sellerUid'];

        if (existingSellerUid !== sellerUid) {
          throw new Error(
            'Only the listing seller may update showing availability.'
          );
        }

        transaction.update(
          availabilityReference,
          {
            ...changes,
            updatedAt: serverTimestamp()
          }
        );
      }
    );
  }

  override getAvailabilityByListingUid(
    listingUid: string
  ): Observable<ShowingAvailability | null> {
    const availabilityReference = doc(
      firestore,
      this.availabilityCollectionName,
      listingUid
    );

    return new Observable(
      subscriber => {
        const unsubscribe = onSnapshot(
          availabilityReference,

          snapshot => {
            subscriber.next(
              snapshot.exists()
                ? this.mapAvailabilitySnapshot(
                  snapshot
                )
                : null
            );
          },

          error => {
            subscriber.error(error);
          }
        );

        return unsubscribe;
      }
    );
  }

  override getReservedTimesForDate(
    listingUid: string,
    date: string
  ): Observable<ShowingReservedTime[]> {
    const scheduleReference =
      this.getScheduleDateReference(
        listingUid,
        date
      );

    return new Observable(
      subscriber => {
        const unsubscribe = onSnapshot(
          scheduleReference,

          snapshot => {
            if (!snapshot.exists()) {
              subscriber.next([]);
              return;
            }

            const schedule =
              this.readScheduleDate(
                snapshot,
                listingUid,
                date
              );

            const reservedTimes =
              schedule.reservations
                .filter(reservation =>
                  this.isBlockingStatus(
                    reservation.status
                  )
                )
                .map(
                  reservation => ({
                    showingRequestUid:
                      reservation
                        .showingRequestUid,

                    date,

                    startTime:
                      reservation.startTime,

                    endTime:
                      reservation.endTime
                  })
                );

            subscriber.next(
              reservedTimes
            );
          },

          error => {
            subscriber.error(error);
          }
        );

        return unsubscribe;
      }
    );
  }

  /*
   * SHOWING REQUEST CREATION
   */

  override async createShowingRequestIfAvailable(
    input: CreateShowingRequestInput
  ): Promise<string> {
    const result =
      await this.createShowingRequestFunction({
        listingUid:
          input.listingUid,

        buyerContact:
          input.buyerContact,

        requestedTime:
          input.requestedTime,

        buyerMessage:
          input.buyerMessage
      });

    if (
      !result.data.success ||
      !result.data.showingRequestUid
    ) {
      throw new Error(
        'The showing request could not be created.'
      );
    }

    return result.data.showingRequestUid;

  }
  /*
   * SELLER CONFIRMATION
   */

  override async confirmShowingRequestIfAvailable(
    input: RespondToShowingRequestInput
  ): Promise<void> {
    const result =
      await this.respondToShowingRequestFunction({
        showingRequestUid:
          input.showingRequestUid,

        action:
          'confirm',

        responseMessage:
          input.responseMessage.trim()
      });

    if (
      !result.data.success ||
      result.data.status !== 'confirmed'
    ) {
      throw new Error(
        'The showing request could not be confirmed.'
      );
    }
  }

  /*
   * SELLER ALTERNATE TIME
   */

  override async proposeAlternateTimeIfAvailable(
    input: ProposeAlternateShowingTimeInput
  ): Promise<void> {
    const responseMessage =
      input.alternateTime.message.trim();

    const result =
      await this.respondToShowingRequestFunction({
        showingRequestUid:
          input.showingRequestUid,

        action:
          'propose_alternate',

        responseMessage,

        alternateTime: {
          date:
            input.alternateTime.date,

          startTime:
            input.alternateTime.startTime,

          endTime:
            input.alternateTime.endTime,

          timeZone:
            input.alternateTime.timeZone,

          message:
            responseMessage
        }
      });

    if (
      !result.data.success ||
      result.data.status !==
      'alternate_proposed'
    ) {
      throw new Error(
        'The alternate showing time could not be proposed.'
      );
    }
  }

  override async acceptAlternateShowingTimeIfAvailable(
  input: RespondToAlternateShowingTimeInput
): Promise<void> {
  const result =
    await this.respondToShowingRequestFunction({
      showingRequestUid:
        input.showingRequestUid,

      action:
        'accept_alternate',

      responseMessage:
        input.responseMessage.trim()
    });

  if (
    !result.data.success ||
    result.data.status !== 'confirmed'
  ) {
    throw new Error(
      'The alternate showing time could not be accepted.'
    );
  }
}

override async declineAlternateShowingTime(
  input: RespondToAlternateShowingTimeInput
): Promise<void> {
  const result =
    await this.respondToShowingRequestFunction({
      showingRequestUid:
        input.showingRequestUid,

      action:
        'decline_alternate',

      responseMessage:
        input.responseMessage.trim()
    });

  if (
    !result.data.success ||
    result.data.status !== 'cancelled'
  ) {
    throw new Error(
      'The alternate showing time could not be declined.'
    );
  }
}

  /*
   * SHOWING REQUEST READS
   */

  override getShowingRequestByUid(
    showingRequestUid: string
  ): Observable<ShowingRequest | null> {
    const requestReference = doc(
      firestore,
      this.requestCollectionName,
      showingRequestUid
    );

    return new Observable(
      subscriber => {
        const unsubscribe = onSnapshot(
          requestReference,

          snapshot => {
            subscriber.next(
              snapshot.exists()
                ? this.mapShowingRequestSnapshot(
                  snapshot
                )
                : null
            );
          },

          error => {
            subscriber.error(error);
          }
        );

        return unsubscribe;
      }
    );
  }

  override getShowingRequestsBySellerUid(
    sellerUid: string
  ): Observable<ShowingRequest[]> {
    return this.getShowingRequestsByField(
      'sellerUid',
      sellerUid
    );
  }

  override getShowingRequestsByBuyerUid(
    buyerUid: string
  ): Observable<ShowingRequest[]> {
    return this.getShowingRequestsByField(
      'buyerUid',
      buyerUid
    );
  }

  override getShowingRequestsByListingUid(
    listingUid: string
  ): Observable<ShowingRequest[]> {
    return this.getShowingRequestsByField(
      'listingUid',
      listingUid
    );
  }

  /*
   * GENERAL REQUEST UPDATES
   */

  override async updateShowingRequest(
    showingRequestUid: string,
    changes: ShowingRequestChanges
  ): Promise<void> {
    if (changes.status === 'declined') {
      const responseMessage =
        typeof changes.sellerResponseMessage ===
          'string'
          ? changes.sellerResponseMessage.trim()
          : '';

      const result =
        await this.respondToShowingRequestFunction({
          showingRequestUid,
          action: 'decline',
          responseMessage
        });

      if (
        !result.data.success ||
        result.data.status !== 'declined'
      ) {
        throw new Error(
          'The showing request could not be declined.'
        );
      }

      return;
    }
    const requestReference = doc(
      firestore,
      this.requestCollectionName,
      showingRequestUid
    );

    const status = changes.status;

    const releasesReservation =
      status === 'cancelled' ||
      status === 'completed';

    if (!releasesReservation) {
      await updateDoc(
        requestReference,
        {
          ...changes,
          updatedAt: serverTimestamp()
        }
      );

      return;
    }

    await runTransaction(
      firestore,
      async transaction => {
        const requestSnapshot =
          await transaction.get(
            requestReference
          );

        const request =
          this.requireShowingRequest(
            requestSnapshot
          );

        const dates = new Set<string>([
          request.requestedTime.date
        ]);

        if (request.alternateTime) {
          dates.add(
            request.alternateTime.date
          );
        }

        const scheduleReferences =
          Array.from(dates).map(
            date => ({
              date,

              reference:
                this.getScheduleDateReference(
                  request.listingUid,
                  date
                )
            })
          );

        /*
         * Firestore transactions require all reads
         * to occur before any writes.
         */
        const scheduleSnapshots =
          await Promise.all(
            scheduleReferences.map(
              item =>
                transaction.get(
                  item.reference
                )
            )
          );

        transaction.update(
          requestReference,
          {
            ...changes,
            updatedAt: serverTimestamp()
          }
        );

        scheduleReferences.forEach(
          (item, index) => {
            const schedule =
              this.readScheduleDate(
                scheduleSnapshots[index],
                request.listingUid,
                item.date
              );

            const reservations =
              schedule.reservations.filter(
                reservation =>
                  reservation
                    .showingRequestUid !==
                  showingRequestUid
              );

            transaction.set(
              item.reference,
              {
                listingUid:
                  request.listingUid,

                date:
                  item.date,

                reservations,

                updatedAt:
                  serverTimestamp()
              },
              {
                merge: true
              }
            );
          }
        );
      }
    );
  }

  /*
   * QUERY HELPERS
   */

  private getShowingRequestsByField(
    fieldName:
      | 'sellerUid'
      | 'buyerUid'
      | 'listingUid',
    fieldValue: string
  ): Observable<ShowingRequest[]> {
    const requestsQuery = query(
      collection(
        firestore,
        this.requestCollectionName
      ),
      where(
        fieldName,
        '==',
        fieldValue
      )
    );

    return new Observable(
      subscriber => {
        const unsubscribe = onSnapshot(
          requestsQuery,

          snapshot => {
            const requests =
              this.mapShowingRequestQuery(
                snapshot
              );

            subscriber.next(
              requests.sort(
                (
                  firstRequest,
                  secondRequest
                ) =>
                  this.getTime(
                    secondRequest.createdAt
                  ) -
                  this.getTime(
                    firstRequest.createdAt
                  )
              )
            );
          },

          error => {
            subscriber.error(error);
          }
        );

        return unsubscribe;
      }
    );
  }

  /*
   * SCHEDULE CONFLICT HELPERS
   */

  private getScheduleDateReference(
    listingUid: string,
    date: string
  ): DocumentReference<DocumentData> {
    return doc(
      firestore,
      this.scheduleCollectionName,
      listingUid,
      'dates',
      date
    );
  }

  private readScheduleDate(
    snapshot:
      DocumentSnapshot<DocumentData>,
    listingUid: string,
    date: string
  ): ShowingScheduleDate {
    if (!snapshot.exists()) {
      return {
        listingUid,
        date,
        reservations: []
      };
    }

    const data = snapshot.data();

    return {
      listingUid:
        data['listingUid'] ??
        listingUid,

      date:
        data['date'] ??
        date,

      reservations:
        Array.isArray(
          data['reservations']
        )
          ? data['reservations']
          : []
    };
  }

  private assertNoConflict(
    requestedTime: ShowingRequestedTime,
    reservations:
      ShowingScheduleReservation[],
    excludedShowingRequestUid:
      string | null = null
  ): void {
    const requestedStart =
      this.timeToMinutes(
        requestedTime.startTime
      );

    const requestedEnd =
      this.timeToMinutes(
        requestedTime.endTime
      );

    const conflict =
      reservations.some(
        reservation => {
          if (
            excludedShowingRequestUid &&
            reservation
              .showingRequestUid ===
            excludedShowingRequestUid
          ) {
            return false;
          }

          if (
            !this.isBlockingStatus(
              reservation.status
            )
          ) {
            return false;
          }

          const existingStart =
            this.timeToMinutes(
              reservation.startTime
            );

          const existingEnd =
            this.timeToMinutes(
              reservation.endTime
            );

          return (
            requestedStart < existingEnd &&
            requestedEnd > existingStart
          );
        }
      );

    if (conflict) {
      throw new Error(
        'That showing time is no longer available. Please select another time.'
      );
    }
  }

  private isBlockingStatus(
    status: ShowingRequestStatus
  ): boolean {
    return (
      status === 'pending' ||
      status === 'confirmed' ||
      status ===
      'alternate_proposed'
    );
  }

  private upsertReservation(
    reservations:
      ShowingScheduleReservation[],
    reservation:
      ShowingScheduleReservation
  ): ShowingScheduleReservation[] {
    return [
      ...reservations.filter(
        existingReservation =>
          existingReservation
            .showingRequestUid !==
          reservation.showingRequestUid
      ),

      reservation
    ];
  }

  private timeToMinutes(
    time: string
  ): number {
    const [hours, minutes] =
      time.split(':').map(Number);

    return hours * 60 + minutes;
  }

  /*
   * FIRESTORE MAPPING
   */

  private mapAvailabilitySnapshot(
    snapshot:
      DocumentSnapshot<DocumentData>
  ): ShowingAvailability {
    const data = snapshot.data();

    if (!data) {
      throw new Error(
        `Showing availability ${snapshot.id} contains no data.`
      );
    }

    return {
      listingUid:
        data['listingUid'] ??
        snapshot.id,

      sellerUid:
        data['sellerUid'],

      acceptingRequests:
        data['acceptingRequests'],

      timeZone:
        data['timeZone'],

      appointmentDurationMinutes:
        data[
        'appointmentDurationMinutes'
        ],

      bufferMinutes:
        data['bufferMinutes'],

      minimumNoticeHours:
        data['minimumNoticeHours'],

      bookingWindowDays:
        data['bookingWindowDays'],

      weeklyAvailability:
        data['weeklyAvailability'] ?? [],

      exceptions:
        data['exceptions'] ?? [],

      createdAt:
        this.toOptionalDate(
          data['createdAt']
        ),

      updatedAt:
        this.toOptionalDate(
          data['updatedAt']
        )
    };
  }

  private mapShowingRequestQuery(
    snapshot:
      QuerySnapshot<DocumentData>
  ): ShowingRequest[] {
    return snapshot.docs.map(
      requestSnapshot =>
        this.mapShowingRequestSnapshot(
          requestSnapshot
        )
    );
  }

  private mapShowingRequestSnapshot(
    snapshot:
      DocumentSnapshot<DocumentData>
  ): ShowingRequest {
    const data = snapshot.data();

    if (!data) {
      throw new Error(
        `Showing request ${snapshot.id} contains no data.`
      );
    }

    const statusHistory =
      Array.isArray(data['statusHistory'])
        ? data['statusHistory'].map(
          (
            entry: Record<
              string,
              unknown
            >
          ) => ({
            ...entry,

            changedAt:
              this.toOptionalDate(
                entry['changedAt']
              )
          })
        )
        : [];

    const alternateTime =
      data['alternateTime']
        ? {
          ...data['alternateTime'],

          proposedAt:
            this.toOptionalDate(
              data[
              'alternateTime'
              ]['proposedAt']
            )
        }
        : null;

    return {
      ...data,

      showingRequestUid:
        data['showingRequestUid'] ??
        snapshot.id,

      alternateTime,

      statusHistory,

      createdAt:
        this.toOptionalDate(
          data['createdAt']
        ),

      updatedAt:
        this.toOptionalDate(
          data['updatedAt']
        ),

      confirmedAt:
        this.toOptionalDate(
          data['confirmedAt']
        ),

      declinedAt:
        this.toOptionalDate(
          data['declinedAt']
        ),

      cancelledAt:
        this.toOptionalDate(
          data['cancelledAt']
        ),

      completedAt:
        this.toOptionalDate(
          data['completedAt']
        )
    } as ShowingRequest;
  }

  private requireShowingRequest(
    snapshot:
      DocumentSnapshot<DocumentData>
  ): ShowingRequest {
    if (!snapshot.exists()) {
      throw new Error(
        'The showing request could not be found.'
      );
    }

    return this.mapShowingRequestSnapshot(
      snapshot
    );
  }

  private toOptionalDate(
    value: unknown
  ): Date | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (value instanceof Date) {
      return value;
    }

    if (value instanceof Timestamp) {
      return value.toDate();
    }

    if (
      typeof value === 'object' &&
      value !== null &&
      'toDate' in value &&
      typeof value.toDate ===
      'function'
    ) {
      return value.toDate();
    }

    return null;
  }

  private getTime(
    value: Date | null
  ): number {
    return value?.getTime() ?? 0;
  }
}