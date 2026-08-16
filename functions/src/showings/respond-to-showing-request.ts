import * as logger from 'firebase-functions/logger';

import {
  HttpsError,
  onCall,
} from 'firebase-functions/v2/https';

import {
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  FieldValue,
  Timestamp,
} from 'firebase-admin/firestore';

import {
  adminFirestore,
} from '../shared/firebase-admin';

import {
  callableFunctionOptions,
} from '../shared/function-options';

import type {
  RespondToShowingRequestData,
  RespondToShowingRequestResponse,
  ShowingAlternateTimeData,
  ShowingAvailabilityDocument,
  ShowingRequestedTime,
  ShowingRequestResponseAction,
  ShowingRequestStatus,
  ShowingScheduleDocument,
  ShowingScheduleReservation,
  ShowingTimeWindow,
} from './showing-types';

const DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}$/;

const TIME_PATTERN =
  /^([01]\d|2[0-3]):[0-5]\d$/;

const BLOCKING_STATUSES =
  new Set<ShowingRequestStatus>([
    'pending',
    'confirmed',
    'alternate_proposed',
  ]);

interface ValidatedResponseData {
  showingRequestUid: string;
  action: ShowingRequestResponseAction;
  responseMessage: string;
  alternateTime:
  ShowingAlternateTimeData | null;
}

interface ShowingRequestDocument {
  showingRequestUid: string;
  listingUid: string;
  sellerUid: string;
  buyerUid: string | null;
  requestedTime: ShowingRequestedTime;
  alternateTime:
  ShowingAlternateTimeData | null;
  status: ShowingRequestStatus;
  statusHistory:
  Record<string, unknown>[];
}

interface ScheduleSnapshotRecord {
  date: string;
  reference:
  DocumentReference<DocumentData>;
  snapshot:
  DocumentSnapshot<DocumentData>;
  schedule: ShowingScheduleDocument;
}

/**
 * Securely handles a seller response to a showing
 * request.
 *
 * Supported actions:
 * - confirm
 * - decline
 * - propose_alternate
 * - accept_alternate
 * - decline_alternate
 */
export const respondToShowingRequest =
  onCall<
    RespondToShowingRequestData,
    Promise<RespondToShowingRequestResponse>
  >(
    {
      ...callableFunctionOptions,
    },

    async request => {
      const authenticatedSellerUid =
        request.auth?.uid;

      if (!authenticatedSellerUid) {
        throw new HttpsError(
          'unauthenticated',
          'Sign in before responding to a showing request.',
        );
      }

      const data =
        validateResponseData(
          request.data,
        );

      const requestReference =
        adminFirestore
          .collection('showingRequests')
          .doc(
            data.showingRequestUid,
          );

      let responseListingUid = '';
      let responseStatus:
        ShowingRequestStatus =
        'pending';

      try {
        await adminFirestore.runTransaction(
          async transaction => {
            /*
             * Read the showing request first because it
             * identifies the listing and schedule dates.
             */
            const requestSnapshot =
              await transaction.get(
                requestReference,
              );

            const showingRequest =
              readShowingRequest(
                requestSnapshot,
              );

            responseListingUid =
              showingRequest.listingUid;

            validateUserAction(
              showingRequest,
              authenticatedSellerUid,
              data.action,
            );

            const listingReference =
              adminFirestore
                .collection('listings')
                .doc(
                  showingRequest
                    .listingUid,
                );

            const availabilityReference =
              adminFirestore
                .collection(
                  'showingAvailability',
                )
                .doc(
                  showingRequest
                    .listingUid,
                );

            /*
             * Read the published listing and, when an
             * alternate time is proposed, its current
             * availability configuration.
             */
            const [
              listingSnapshot,
              availabilitySnapshot,
            ] = await Promise.all([
              transaction.get(
                listingReference,
              ),

              data.action ===
                'propose_alternate'
                ? transaction.get(
                  availabilityReference,
                )
                : Promise.resolve(null),
            ]);

            if (!listingSnapshot.exists) {
              throw new HttpsError(
                'not-found',
                'The listing associated with this showing request could not be found.',
              );
            }

            const listingData =
              listingSnapshot.data();

            if (!listingData) {
              throw new HttpsError(
                'not-found',
                'The listing associated with this showing request contains no data.',
              );
            }

            const listingSellerUid =
              readString(
                listingData[
                'sellerUid'
                ],
              );

            if (
              listingSellerUid !==
              showingRequest.sellerUid
            ) {
              throw new HttpsError(
                'failed-precondition',
                'The showing request does not match the listing owner.',
              );
            }

            let alternateTime:
              ShowingAlternateTimeData |
              null = null;

            if (
              data.action ===
              'propose_alternate'
            ) {
              alternateTime =
                data.alternateTime;

              if (!alternateTime) {
                throw new HttpsError(
                  'invalid-argument',
                  'Select an alternate showing date and time.',
                );
              }

              if (
                !availabilitySnapshot ||
                !availabilitySnapshot
                  .exists
              ) {
                throw new HttpsError(
                  'failed-precondition',
                  'Showing availability has not been configured for this listing.',
                );
              }

              const availability =
                availabilitySnapshot
                  .data() as
                ShowingAvailabilityDocument;

              if (
                availability.listingUid !==
                showingRequest
                  .listingUid ||
                availability.sellerUid !==
                authenticatedSellerUid
              ) {
                throw new HttpsError(
                  'failed-precondition',
                  'The showing schedule does not match this listing.',
                );
              }

              validateAlternateAppointment(
                alternateTime,
                availability,
              );

              if (
                sameAppointment(
                  showingRequest.requestedTime,
                  alternateTime,
                )
              ) {
                throw new HttpsError(
                  'invalid-argument',
                  'The alternate appointment must be different from the buyer\u2019s requested time.',
                );
              }
            }

            /*
             * Collect every schedule date that could
             * contain a reservation for this request.
             */
            const scheduleDates =
              new Set<string>([
                showingRequest
                  .requestedTime.date,
              ]);

            if (
              showingRequest
                .alternateTime
            ) {
              scheduleDates.add(
                showingRequest
                  .alternateTime.date,
              );
            }

            if (alternateTime) {
              scheduleDates.add(
                alternateTime.date,
              );
            }

            const confirmedTime =
              getConfirmedTime(
                showingRequest,
                data.action,
              );

            if (confirmedTime) {
              scheduleDates.add(
                confirmedTime.date,
              );
            }

            const scheduleReferences =
              Array.from(
                scheduleDates,
              ).map(
                date => ({
                  date,

                  reference:
                    adminFirestore
                      .collection(
                        'showingSchedules',
                      )
                      .doc(
                        showingRequest
                          .listingUid,
                      )
                      .collection('dates')
                      .doc(date),
                }),
              );

            /*
             * Firestore transactions require every
             * read to complete before the first write.
             */
            const scheduleSnapshots =
              await Promise.all(
                scheduleReferences.map(
                  item =>
                    transaction.get(
                      item.reference,
                    ),
                ),
              );

            const schedules:
              ScheduleSnapshotRecord[] =
              scheduleReferences.map(
                (item, index) => ({
                  ...item,

                  snapshot:
                    scheduleSnapshots[
                    index
                    ],

                  schedule:
                    readSchedule(
                      scheduleSnapshots[
                        index
                      ].data(),
                      showingRequest
                        .listingUid,
                      item.date,
                    ),
                }),
              );

            if (
              data.action === 'confirm' ||
              data.action ===
                'accept_alternate'
            ) {
              const timeToConfirm =
                confirmedTime;

              if (!timeToConfirm) {
                throw new HttpsError(
                  'failed-precondition',
                  'The showing time could not be identified.',
                );
              }

              const targetSchedule =
                requireSchedule(
                  schedules,
                  timeToConfirm.date,
                );

              assertNoConflict(
                timeToConfirm,
                targetSchedule
                  .schedule
                  .reservations,
                showingRequest
                  .showingRequestUid,
              );

              clearRequestReservations(
                schedules,
                showingRequest
                  .showingRequestUid,
              );

              addReservation(
                requireSchedule(
                  schedules,
                  timeToConfirm.date,
                ),
                {
                  showingRequestUid:
                    showingRequest
                      .showingRequestUid,

                  startTime:
                    timeToConfirm
                      .startTime,

                  endTime:
                    timeToConfirm
                      .endTime,

                  status:
                    'confirmed',
                },
              );

              const note =
                data.responseMessage ||
                (
                  data.action ===
                    'accept_alternate'
                    ? 'Buyer accepted the proposed alternate showing time.'
                    : 'Showing request confirmed.'
                );

              const historyEntry =
                data.action ===
                  'accept_alternate'
                  ? createBuyerHistoryEntry(
                    'confirmed',
                    authenticatedSellerUid,
                    note,
                  )
                  : createHistoryEntry(
                    'confirmed',
                    authenticatedSellerUid,
                    note,
                  );

              transaction.update(
                requestReference,
                {
                  status: 'confirmed',

                  ...(
                    data.action ===
                      'confirm'
                      ? {
                        sellerResponseMessage:
                          data.responseMessage,
                      }
                      : {}
                  ),

                  statusHistory: [
                    ...showingRequest
                      .statusHistory,

                    historyEntry,
                  ],

                  confirmedAt:
                    FieldValue
                      .serverTimestamp(),

                  updatedAt:
                    FieldValue
                      .serverTimestamp(),
                },
              );

              responseStatus =
                'confirmed';
            }

            if (
              data.action === 'decline'
            ) {
              clearRequestReservations(
                schedules,
                showingRequest
                  .showingRequestUid,
              );

              const note =
                data.responseMessage ||
                'Showing request declined.';

              transaction.update(
                requestReference,
                {
                  status: 'declined',

                  sellerResponseMessage:
                    data.responseMessage,

                  statusHistory: [
                    ...showingRequest
                      .statusHistory,

                    createHistoryEntry(
                      'declined',
                      authenticatedSellerUid,
                      note,
                    ),
                  ],

                  declinedAt:
                    FieldValue
                      .serverTimestamp(),

                  updatedAt:
                    FieldValue
                      .serverTimestamp(),
                },
              );

              responseStatus =
                'declined';
            }

            if (
              data.action ===
                'decline_alternate'
            ) {
              clearRequestReservations(
                schedules,
                showingRequest
                  .showingRequestUid,
              );

              const note =
                data.responseMessage ||
                'Buyer declined the proposed alternate showing time.';

              transaction.update(
                requestReference,
                {
                  status: 'cancelled',

                  statusHistory: [
                    ...showingRequest
                      .statusHistory,

                    createBuyerHistoryEntry(
                      'cancelled',
                      authenticatedSellerUid,
                      note,
                    ),
                  ],

                  cancelledAt:
                    FieldValue
                      .serverTimestamp(),

                  updatedAt:
                    FieldValue
                      .serverTimestamp(),
                },
              );

              responseStatus =
                'cancelled';
            }

            if (
              data.action ===
              'propose_alternate'
            ) {
              if (!alternateTime) {
                throw new HttpsError(
                  'invalid-argument',
                  'Select an alternate showing date and time.',
                );
              }

              const targetSchedule =
                requireSchedule(
                  schedules,
                  alternateTime.date,
                );

              assertNoConflict(
                alternateTime,
                targetSchedule
                  .schedule
                  .reservations,
                showingRequest
                  .showingRequestUid,
              );

              /*
               * Remove an earlier alternate proposal,
               * then protect the original requested time
               * and the newly proposed alternate time.
               */
              clearRequestReservations(
                schedules,
                showingRequest
                  .showingRequestUid,
              );

              addReservation(
                requireSchedule(
                  schedules,
                  showingRequest
                    .requestedTime.date,
                ),
                {
                  showingRequestUid:
                    showingRequest
                      .showingRequestUid,

                  startTime:
                    showingRequest
                      .requestedTime
                      .startTime,

                  endTime:
                    showingRequest
                      .requestedTime
                      .endTime,

                  status:
                    'alternate_proposed',
                },
              );

              if (
                !sameAppointment(
                  showingRequest
                    .requestedTime,
                  alternateTime,
                )
              ) {
                addReservation(
                  requireSchedule(
                    schedules,
                    alternateTime.date,
                  ),
                  {
                    showingRequestUid:
                      showingRequest
                        .showingRequestUid,

                    startTime:
                      alternateTime
                        .startTime,

                    endTime:
                      alternateTime
                        .endTime,

                    status:
                      'alternate_proposed',
                  },
                );
              }

              const alternateMessage =
                alternateTime.message
                  ?.trim() ||
                data.responseMessage ||
                'The seller proposed another showing time.';

              transaction.update(
                requestReference,
                {
                  status:
                    'alternate_proposed',

                  alternateTime: {
                    date:
                      alternateTime.date,

                    startTime:
                      alternateTime
                        .startTime,

                    endTime:
                      alternateTime
                        .endTime,

                    timeZone:
                      alternateTime
                        .timeZone,

                    message:
                      alternateMessage,

                    proposedAt:
                      Timestamp.now(),
                  },

                  sellerResponseMessage:
                    alternateMessage,

                  statusHistory: [
                    ...showingRequest
                      .statusHistory,

                    createHistoryEntry(
                      'alternate_proposed',
                      authenticatedSellerUid,
                      alternateMessage,
                    ),
                  ],

                  updatedAt:
                    FieldValue
                      .serverTimestamp(),
                },
              );

              responseStatus =
                'alternate_proposed';
            }

            /*
             * Persist all affected reservation documents
             * inside the same transaction as the request.
             */
            schedules.forEach(
              scheduleRecord => {
                if (
                  !scheduleRecord
                    .snapshot.exists &&
                  scheduleRecord
                    .schedule
                    .reservations
                    .length === 0
                ) {
                  return;
                }

                transaction.set(
                  scheduleRecord.reference,
                  {
                    listingUid:
                      showingRequest
                        .listingUid,

                    date:
                      scheduleRecord.date,

                    reservations:
                      scheduleRecord
                        .schedule
                        .reservations,

                    updatedAt:
                      FieldValue
                        .serverTimestamp(),
                  },
                  {
                    merge: true,
                  },
                );
              },
            );
          },
        );
      } catch (error: unknown) {
        if (error instanceof HttpsError) {
          throw error;
        }

        logger.error(
          'Unable to respond to showing request.',
          {
            error,
            showingRequestUid:
              data.showingRequestUid,
            sellerUid:
              authenticatedSellerUid,
            action:
              data.action,
          },
        );

        throw new HttpsError(
          'internal',
          'We could not update this showing request. Please try again.',
        );
      }

      logger.info(
        'Showing request response completed.',
        {
          showingRequestUid:
            data.showingRequestUid,
          listingUid:
            responseListingUid,
          sellerUid:
            authenticatedSellerUid,
          action:
            data.action,
          status:
            responseStatus,
        },
      );

      return {
        success: true,
        showingRequestUid:
          data.showingRequestUid,
        listingUid:
          responseListingUid,
        status:
          responseStatus,
      };
    },
  );

function validateResponseData(
  value: unknown,
): ValidatedResponseData {
  if (!isRecord(value)) {
    throw new HttpsError(
      'invalid-argument',
      'Showing response data is required.',
    );
  }

  const showingRequestUid =
    requireString(
      value['showingRequestUid'],
      'A showing request UID is required.',
      128,
    );

  const actionValue =
    value['action'];

  if (
    actionValue !== 'confirm' &&
    actionValue !== 'decline' &&
    actionValue !==
    'propose_alternate' &&
    actionValue !==
    'accept_alternate' &&
    actionValue !==
    'decline_alternate'
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Select a valid showing response.',
    );
  }

  const action:
    ShowingRequestResponseAction =
    actionValue;

  const responseMessage =
    optionalString(
      value['responseMessage'],
      1000,
    );

  let alternateTime:
    ShowingAlternateTimeData |
    null = null;

  if (
    action ===
    'propose_alternate'
  ) {
    const alternateTimeValue =
      value['alternateTime'];

    if (
      !isRecord(
        alternateTimeValue,
      )
    ) {
      throw new HttpsError(
        'invalid-argument',
        'Select an alternate showing date and time.',
      );
    }

    alternateTime = {
      date:
        requireString(
          alternateTimeValue[
          'date'
          ],
          'An alternate date is required.',
          10,
        ),

      startTime:
        requireString(
          alternateTimeValue[
          'startTime'
          ],
          'An alternate start time is required.',
          5,
        ),

      endTime:
        requireString(
          alternateTimeValue[
          'endTime'
          ],
          'An alternate end time is required.',
          5,
        ),

      timeZone:
        requireString(
          alternateTimeValue[
          'timeZone'
          ],
          'An alternate timezone is required.',
          100,
        ),

      message:
        optionalString(
          alternateTimeValue[
          'message'
          ],
          1000,
        ),
    };

    validateRequestedTime(
      alternateTime,
    );
  }

  return {
    showingRequestUid,
    action,
    responseMessage,
    alternateTime,
  };
}

function readShowingRequest(
  snapshot:
    DocumentSnapshot<DocumentData>,
): ShowingRequestDocument {
  if (!snapshot.exists) {
    throw new HttpsError(
      'not-found',
      'The showing request could not be found.',
    );
  }

  const data =
    snapshot.data();

  if (!data) {
    throw new HttpsError(
      'not-found',
      'The showing request contains no data.',
    );
  }

  const listingUid =
    readString(
      data['listingUid'],
    );

  const sellerUid =
    readString(
      data['sellerUid'],
    );

  const requestedTimeValue =
    data['requestedTime'];

  if (
    !listingUid ||
    !sellerUid ||
    !isRecord(
      requestedTimeValue,
    )
  ) {
    throw new HttpsError(
      'failed-precondition',
      'The showing request is incomplete.',
    );
  }

  const requestedTime =
    readRequestedTime(
      requestedTimeValue,
    );

  const alternateTimeValue =
    data['alternateTime'];

  const alternateTime =
    isRecord(
      alternateTimeValue,
    )
      ? {
        ...readRequestedTime(
          alternateTimeValue,
        ),

        message:
          optionalString(
            alternateTimeValue[
            'message'
            ],
            1000,
          ),
      }
      : null;

  const status =
    readShowingStatus(
      data['status'],
    );

  const statusHistory =
    Array.isArray(
      data['statusHistory'],
    )
      ? data['statusHistory'].filter(
        isRecord,
      )
      : [];

  return {
    showingRequestUid:
      readString(
        data[
        'showingRequestUid'
        ],
      ) || snapshot.id,

    listingUid,
    sellerUid,

    buyerUid:
      typeof data['buyerUid'] ===
        'string'
        ? data['buyerUid']
        : null,

    requestedTime,
    alternateTime,
    status,
    statusHistory,
  };
}

function validateUserAction(
  request:
    ShowingRequestDocument,
  authenticatedUserUid: string,
  action:
    ShowingRequestResponseAction,
): void {
  const sellerAction =
    action === 'confirm' ||
    action === 'decline' ||
    action === 'propose_alternate';

  const buyerAction =
    action === 'accept_alternate' ||
    action === 'decline_alternate';

  if (sellerAction) {
    if (
      request.sellerUid !==
      authenticatedUserUid
    ) {
      throw new HttpsError(
        'permission-denied',
        'Only the listing seller may perform this response.',
      );
    }

    if (request.status !== 'pending') {
      throw new HttpsError(
        'failed-precondition',
        `This seller response cannot be completed while the request is ${request.status}.`,
      );
    }

    return;
  }

  if (buyerAction) {
    if (
      !request.buyerUid ||
      request.buyerUid !==
        authenticatedUserUid
    ) {
      throw new HttpsError(
        'permission-denied',
        'Only the buyer who submitted this request may respond to the proposed time.',
      );
    }

    if (
      request.status !==
        'alternate_proposed' ||
      !request.alternateTime
    ) {
      throw new HttpsError(
        'failed-precondition',
        'There is no alternate showing time awaiting your response.',
      );
    }

    return;
  }

  throw new HttpsError(
    'invalid-argument',
    'Select a valid showing response.',
  );
}

function getConfirmedTime(
  request:
    ShowingRequestDocument,
  action:
    ShowingRequestResponseAction,
): ShowingRequestedTime | null {
  if (action === 'confirm') {
    return request.requestedTime;
  }

  if (
    action === 'accept_alternate'
  ) {
    return request.alternateTime;
  }

  return null;
}


function validateAlternateAppointment(
  alternateTime:
    ShowingAlternateTimeData,
  availability:
    ShowingAvailabilityDocument,
): void {
  validateRequestedTime(
    alternateTime,
  );

  if (
    !availability
      .acceptingRequests
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This listing is not currently accepting showing requests.',
    );
  }

  if (
    alternateTime.timeZone !==
    availability.timeZone
  ) {
    throw new HttpsError(
      'invalid-argument',
      'The alternate timezone does not match the property schedule.',
    );
  }

  validateTimeZone(
    availability.timeZone,
  );

  const currentDate =
    getDateInTimeZone(
      new Date(),
      availability.timeZone,
    );

  const finalBookingDate =
    addDaysToDate(
      currentDate,
      availability
        .bookingWindowDays,
    );

  if (
    alternateTime.date <
    currentDate ||
    alternateTime.date >
    finalBookingDate
  ) {
    throw new HttpsError(
      'failed-precondition',
      'The alternate date is outside the seller’s booking window.',
    );
  }

  const exception =
    availability.exceptions.find(
      item =>
        item.date ===
        alternateTime.date,
    );

  if (exception?.unavailable) {
    throw new HttpsError(
      'failed-precondition',
      'The property is unavailable on the selected date.',
    );
  }

  const timeWindows =
    exception
      ? exception.timeWindows
      : getWeeklyTimeWindows(
        alternateTime.date,
        availability,
      );

  if (!timeWindows.length) {
    throw new HttpsError(
      'failed-precondition',
      'The property is unavailable on the selected date.',
    );
  }

  const duration =
    availability
      .appointmentDurationMinutes;

  const buffer =
    availability.bufferMinutes;

  const alternateStart =
    timeToMinutes(
      alternateTime.startTime,
    );

  const alternateEnd =
    timeToMinutes(
      alternateTime.endTime,
    );

  if (
    alternateEnd -
    alternateStart !==
    duration
  ) {
    throw new HttpsError(
      'invalid-argument',
      'The alternate appointment duration is invalid.',
    );
  }

  const isGeneratedSlot =
    timeWindows.some(
      window =>
        isSlotInWindow(
          alternateStart,
          alternateEnd,
          duration,
          buffer,
          window,
        ),
    );

  if (!isGeneratedSlot) {
    throw new HttpsError(
      'failed-precondition',
      'The alternate time is not available in the seller’s schedule.',
    );
  }

  const appointmentDate =
    zonedDateTimeToDate(
      alternateTime.date,
      alternateTime.startTime,
      availability.timeZone,
    );

  const earliestAllowedTime =
    Date.now() +
    availability
      .minimumNoticeHours *
    60 *
    60 *
    1000;

  if (
    appointmentDate.getTime() <
    earliestAllowedTime
  ) {
    throw new HttpsError(
      'failed-precondition',
      'The alternate time does not provide enough advance notice.',
    );
  }
}

function validateRequestedTime(
  requestedTime:
    ShowingRequestedTime,
): void {
  if (
    !DATE_PATTERN.test(
      requestedTime.date,
    ) ||
    !isRealCalendarDate(
      requestedTime.date,
    )
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Enter a valid showing date.',
    );
  }

  if (
    !TIME_PATTERN.test(
      requestedTime.startTime,
    ) ||
    !TIME_PATTERN.test(
      requestedTime.endTime,
    )
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Enter valid showing times.',
    );
  }

  if (
    timeToMinutes(
      requestedTime.endTime,
    ) <=
    timeToMinutes(
      requestedTime.startTime,
    )
  ) {
    throw new HttpsError(
      'invalid-argument',
      'The showing end time must be after the start time.',
    );
  }
}

function createHistoryEntry(
  status: ShowingRequestStatus,
  sellerUid: string,
  note: string,
): Record<string, unknown> {
  return {
    status,
    changedBy: 'seller',
    changedByUid:
      sellerUid,
    note,
    changedAt:
      Timestamp.now(),
  };
}

function createBuyerHistoryEntry(
  status: ShowingRequestStatus,
  buyerUid: string,
  note: string,
): Record<string, unknown> {
  return {
    status,
    changedBy: 'buyer',
    changedByUid:
      buyerUid,
    note,
    changedAt:
      Timestamp.now(),
  };
}

function requireSchedule(
  schedules:
    ScheduleSnapshotRecord[],
  date: string,
): ScheduleSnapshotRecord {
  const schedule =
    schedules.find(
      item =>
        item.date === date,
    );

  if (!schedule) {
    throw new HttpsError(
      'internal',
      'The showing schedule could not be prepared.',
    );
  }

  return schedule;
}

function clearRequestReservations(
  schedules:
    ScheduleSnapshotRecord[],
  showingRequestUid: string,
): void {
  schedules.forEach(
    scheduleRecord => {
      scheduleRecord
        .schedule
        .reservations =
        scheduleRecord
          .schedule
          .reservations
          .filter(
            reservation =>
              reservation
                .showingRequestUid !==
              showingRequestUid,
          );
    },
  );
}

function addReservation(
  scheduleRecord:
    ScheduleSnapshotRecord,
  reservation:
    ShowingScheduleReservation,
): void {
  const duplicate =
    scheduleRecord
      .schedule
      .reservations
      .some(
        existingReservation =>
          existingReservation
            .showingRequestUid ===
          reservation
            .showingRequestUid &&
          existingReservation
            .startTime ===
          reservation.startTime &&
          existingReservation
            .endTime ===
          reservation.endTime,
      );

  if (!duplicate) {
    scheduleRecord
      .schedule
      .reservations
      .push(reservation);
  }
}

function assertNoConflict(
  requestedTime:
    ShowingRequestedTime,
  reservations:
    ShowingScheduleReservation[],
  excludedShowingRequestUid:
    string,
): void {
  const requestedStart =
    timeToMinutes(
      requestedTime.startTime,
    );

  const requestedEnd =
    timeToMinutes(
      requestedTime.endTime,
    );

  const conflict =
    reservations.some(
      reservation => {
        if (
          reservation
            .showingRequestUid ===
          excludedShowingRequestUid
        ) {
          return false;
        }

        if (
          !BLOCKING_STATUSES.has(
            reservation.status,
          )
        ) {
          return false;
        }

        const existingStart =
          timeToMinutes(
            reservation.startTime,
          );

        const existingEnd =
          timeToMinutes(
            reservation.endTime,
          );

        return (
          requestedStart <
          existingEnd &&
          requestedEnd >
          existingStart
        );
      },
    );

  if (conflict) {
    throw new HttpsError(
      'already-exists',
      'That showing time is no longer available. Please select another time.',
    );
  }
}

function sameAppointment(
  first: ShowingRequestedTime,
  second: ShowingRequestedTime,
): boolean {
  return (
    first.date === second.date &&
    first.startTime ===
    second.startTime &&
    first.endTime ===
    second.endTime &&
    first.timeZone ===
    second.timeZone
  );
}

function readSchedule(
  value: DocumentData | undefined,
  listingUid: string,
  date: string,
): ShowingScheduleDocument {
  if (!value) {
    return {
      listingUid,
      date,
      reservations: [],
    };
  }

  return {
    listingUid:
      typeof value['listingUid'] ===
        'string'
        ? value['listingUid']
        : listingUid,

    date:
      typeof value['date'] ===
        'string'
        ? value['date']
        : date,

    reservations:
      Array.isArray(
        value['reservations'],
      )
        ? value[
        'reservations'
        ] as
        ShowingScheduleReservation[]
        : [],
  };
}

function readRequestedTime(
  value:
    Record<string, unknown>,
): ShowingRequestedTime {
  const requestedTime = {
    date:
      readString(
        value['date'],
      ),

    startTime:
      readString(
        value['startTime'],
      ),

    endTime:
      readString(
        value['endTime'],
      ),

    timeZone:
      readString(
        value['timeZone'],
      ),
  };

  validateRequestedTime(
    requestedTime,
  );

  return requestedTime;
}

function readShowingStatus(
  value: unknown,
): ShowingRequestStatus {
  if (
    value === 'pending' ||
    value === 'confirmed' ||
    value ===
    'alternate_proposed' ||
    value === 'declined' ||
    value === 'cancelled' ||
    value === 'completed'
  ) {
    return value;
  }

  throw new HttpsError(
    'failed-precondition',
    'The showing request status is invalid.',
  );
}

function getWeeklyTimeWindows(
  date: string,
  availability:
    ShowingAvailabilityDocument,
): ShowingTimeWindow[] {
  const dayNames = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];

  const parsedDate =
    parseDateParts(date);

  const dayIndex =
    new Date(
      Date.UTC(
        parsedDate.year,
        parsedDate.month - 1,
        parsedDate.day,
      ),
    ).getUTCDay();

  const dayAvailability =
    availability
      .weeklyAvailability
      .find(
        day =>
          day.dayOfWeek ===
          dayNames[dayIndex],
      );

  if (
    !dayAvailability ||
    !dayAvailability.enabled
  ) {
    return [];
  }

  return dayAvailability
    .timeWindows;
}

function isSlotInWindow(
  requestedStart: number,
  requestedEnd: number,
  duration: number,
  buffer: number,
  window: ShowingTimeWindow,
): boolean {
  const windowStart =
    timeToMinutes(
      window.startTime,
    );

  const windowEnd =
    timeToMinutes(
      window.endTime,
    );

  const interval =
    duration + buffer;

  if (
    requestedStart < windowStart ||
    requestedEnd > windowEnd ||
    interval <= 0
  ) {
    return false;
  }

  return (
    (
      requestedStart -
      windowStart
    ) %
    interval ===
    0
  );
}

function getDateInTimeZone(
  date: Date,
  timeZone: string,
): string {
  const parts =
    getDateTimeParts(
      date,
      timeZone,
    );

  return formatDateParts(
    parts.year,
    parts.month,
    parts.day,
  );
}

function zonedDateTimeToDate(
  date: string,
  time: string,
  timeZone: string,
): Date {
  const dateParts =
    parseDateParts(date);

  const [hour, minute] =
    time.split(':').map(Number);

  const expectedUtcTime =
    Date.UTC(
      dateParts.year,
      dateParts.month - 1,
      dateParts.day,
      hour,
      minute,
      0,
    );

  let result =
    expectedUtcTime;

  for (
    let attempt = 0;
    attempt < 2;
    attempt += 1
  ) {
    const actualParts =
      getDateTimeParts(
        new Date(result),
        timeZone,
      );

    const actualUtcTime =
      Date.UTC(
        actualParts.year,
        actualParts.month - 1,
        actualParts.day,
        actualParts.hour,
        actualParts.minute,
        0,
      );

    result +=
      expectedUtcTime -
      actualUtcTime;
  }

  const convertedDate =
    new Date(result);

  const convertedParts =
    getDateTimeParts(
      convertedDate,
      timeZone,
    );

  if (
    convertedParts.year !==
    dateParts.year ||
    convertedParts.month !==
    dateParts.month ||
    convertedParts.day !==
    dateParts.day ||
    convertedParts.hour !==
    hour ||
    convertedParts.minute !==
    minute
  ) {
    throw new HttpsError(
      'invalid-argument',
      'The selected local showing time is invalid.',
    );
  }

  return convertedDate;
}

function getDateTimeParts(
  date: Date,
  timeZone: string,
): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const formatter =
    new Intl.DateTimeFormat(
      'en-US',
      {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      },
    );

  const values =
    new Map(
      formatter
        .formatToParts(date)
        .map(
          part => [
            part.type,
            part.value,
          ],
        ),
    );

  return {
    year:
      Number(values.get('year')),
    month:
      Number(values.get('month')),
    day:
      Number(values.get('day')),
    hour:
      Number(values.get('hour')),
    minute:
      Number(values.get('minute')),
  };
}

function validateTimeZone(
  timeZone: string,
): void {
  try {
    new Intl.DateTimeFormat(
      'en-US',
      {
        timeZone,
      },
    ).format();
  } catch {
    throw new HttpsError(
      'invalid-argument',
      'The property timezone is invalid.',
    );
  }
}

function addDaysToDate(
  date: string,
  days: number,
): string {
  const parts =
    parseDateParts(date);

  const result =
    new Date(
      Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day + days,
      ),
    );

  return formatDateParts(
    result.getUTCFullYear(),
    result.getUTCMonth() + 1,
    result.getUTCDate(),
  );
}

function isRealCalendarDate(
  value: string,
): boolean {
  const parts =
    parseDateParts(value);

  const date =
    new Date(
      Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
      ),
    );

  return (
    date.getUTCFullYear() ===
    parts.year &&
    date.getUTCMonth() + 1 ===
    parts.month &&
    date.getUTCDate() ===
    parts.day
  );
}

function parseDateParts(
  value: string,
): {
  year: number;
  month: number;
  day: number;
} {
  const [year, month, day] =
    value.split('-').map(Number);

  return {
    year,
    month,
    day,
  };
}

function formatDateParts(
  year: number,
  month: number,
  day: number,
): string {
  return [
    year
      .toString()
      .padStart(4, '0'),

    month
      .toString()
      .padStart(2, '0'),

    day
      .toString()
      .padStart(2, '0'),
  ].join('-');
}

function timeToMinutes(
  time: string,
): number {
  const [
    hours,
    minutes,
  ] = time
    .split(':')
    .map(Number);

  return (
    hours * 60 +
    minutes
  );
}

function requireString(
  value: unknown,
  message: string,
  maximumLength: number,
): string {
  if (typeof value !== 'string') {
    throw new HttpsError(
      'invalid-argument',
      message,
    );
  }

  const normalizedValue =
    value.trim();

  if (
    !normalizedValue ||
    normalizedValue.length >
    maximumLength
  ) {
    throw new HttpsError(
      'invalid-argument',
      message,
    );
  }

  return normalizedValue;
}

function optionalString(
  value: unknown,
  maximumLength: number,
): string {
  if (
    value === undefined ||
    value === null
  ) {
    return '';
  }

  if (typeof value !== 'string') {
    throw new HttpsError(
      'invalid-argument',
      'The response message is invalid.',
    );
  }

  const normalizedValue =
    value.trim();

  if (
    normalizedValue.length >
    maximumLength
  ) {
    throw new HttpsError(
      'invalid-argument',
      'The response message is too long.',
    );
  }

  return normalizedValue;
}

function readString(
  value: unknown,
): string {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}