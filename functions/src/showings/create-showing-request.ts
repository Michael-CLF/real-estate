import * as logger from 'firebase-functions/logger';

import {
  HttpsError,
  onCall,
} from 'firebase-functions/v2/https';

import {
  DocumentData,
  FieldValue,
  Timestamp,
} from 'firebase-admin/firestore';

import {
  callableFunctionOptions,
} from '../shared/function-options';

import {
  adminAuth,
  adminFirestore,
} from '../shared/firebase-admin';

import {
  normalizeEmail,
} from '../shared/normalize-email';

import type {
  CreateShowingRequestData,
  CreateShowingRequestResponse,
  ShowingAvailabilityDocument,
  ShowingRequestedTime,
  ShowingScheduleDocument,
  ShowingScheduleReservation,
  ShowingTimeWindow,
} from './showing-types';

const DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}$/;

const TIME_PATTERN =
  /^([01]\d|2[0-3]):[0-5]\d$/;

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MINIMUM_REQUEST_INTERVAL_MS =
  30 * 1000;

const BLOCKING_STATUSES = new Set([
  'pending',
  'confirmed',
  'alternate_proposed',
]);

/**
 * Creates a showing request and reserves the selected
 * appointment time in one trusted Firestore transaction.
 */
export const createShowingRequest = onCall<
  CreateShowingRequestData,
  Promise<CreateShowingRequestResponse>
>(
  {
    ...callableFunctionOptions,
  },

  async request => {
    const buyerUid =
      request.auth?.uid;

    if (!buyerUid) {
      throw new HttpsError(
        'unauthenticated',
        'Sign in before requesting a showing.',
      );
    }

    const data =
      validateRequestData(
        request.data,
      );

    const buyerRecord =
      await adminAuth.getUser(
        buyerUid,
      );

    const authenticatedEmail =
      normalizeEmail(
        buyerRecord.email,
      );

    if (!authenticatedEmail) {
      throw new HttpsError(
        'failed-precondition',
        'Your NavStreet account does not have a verified email address.',
      );
    }

    if (
      normalizeEmail(
        data.buyerContact.email,
      ) !== authenticatedEmail
    ) {
      throw new HttpsError(
        'permission-denied',
        'Use the email address associated with your NavStreet account.',
      );
    }

    const listingReference =
      adminFirestore
        .collection('listings')
        .doc(data.listingUid);

    const availabilityReference =
      adminFirestore
        .collection(
          'showingAvailability',
        )
        .doc(data.listingUid);

    const scheduleReference =
      adminFirestore
        .collection(
          'showingSchedules',
        )
        .doc(data.listingUid)
        .collection('dates')
        .doc(
          data.requestedTime.date,
        );

    const requestReference =
      adminFirestore
        .collection(
          'showingRequests',
        )
        .doc();

    const rateLimitReference =
      adminFirestore
        .collection(
          'showingRequestRateLimits',
        )
        .doc(buyerUid);

    try {
      await adminFirestore.runTransaction(
        async transaction => {
          /*
           * All transactional reads must occur before
           * any transactional writes.
           */
          const [
            listingSnapshot,
            availabilitySnapshot,
            scheduleSnapshot,
            rateLimitSnapshot,
          ] = await Promise.all([
            transaction.get(
              listingReference,
            ),

            transaction.get(
              availabilityReference,
            ),

            transaction.get(
              scheduleReference,
            ),

            transaction.get(
              rateLimitReference,
            ),
          ]);

          if (!listingSnapshot.exists) {
            throw new HttpsError(
              'not-found',
              'The selected listing could not be found.',
            );
          }

          const listingData =
            listingSnapshot.data();

          if (!listingData) {
            throw new HttpsError(
              'not-found',
              'The selected listing contains no data.',
            );
          }

          if (
            listingData['status'] !==
            'active'
          ) {
            throw new HttpsError(
              'failed-precondition',
              'This listing is not currently active.',
            );
          }

          const sellerUid =
            readString(
              listingData,
              'sellerUid',
            );

          if (!sellerUid) {
            throw new HttpsError(
              'failed-precondition',
              'The listing seller could not be identified.',
            );
          }

          if (sellerUid === buyerUid) {
            throw new HttpsError(
              'failed-precondition',
              'You cannot request a showing of your own listing.',
            );
          }

          if (
            !availabilitySnapshot.exists
          ) {
            throw new HttpsError(
              'failed-precondition',
              'The seller has not configured showing availability.',
            );
          }

          const availability =
            availabilitySnapshot.data() as
              ShowingAvailabilityDocument;

          if (
            availability.listingUid !==
              data.listingUid ||
            availability.sellerUid !==
              sellerUid
          ) {
            throw new HttpsError(
              'failed-precondition',
              'The showing schedule does not match this listing.',
            );
          }

          if (
            !availability
              .acceptingRequests
          ) {
            throw new HttpsError(
              'failed-precondition',
              'The seller is not currently accepting showing requests.',
            );
          }

          validateRequestedAppointment(
            data.requestedTime,
            availability,
          );

          enforceRateLimit(
            rateLimitSnapshot.data(),
          );

          const schedule =
            readSchedule(
              scheduleSnapshot.data(),
              data.listingUid,
              data.requestedTime.date,
            );

          assertNoConflict(
            data.requestedTime,
            schedule.reservations,
          );

          const now =
            Timestamp.now();

          const reservation:
            ShowingScheduleReservation = {
              showingRequestUid:
                requestReference.id,

              startTime:
                data.requestedTime
                  .startTime,

              endTime:
                data.requestedTime
                  .endTime,

              status: 'pending',
            };

          const listingAddress =
            getListingAddress(
              listingData,
            );

          transaction.create(
            requestReference,
            {
              showingRequestUid:
                requestReference.id,

              listingUid:
                data.listingUid,

              sellerUid,

              buyerUid,

              propertyAddress:
                listingAddress
                  .addressLine1,

              propertyCity:
                listingAddress.city,

              propertyState:
                listingAddress.state,

              propertyZipCode:
                listingAddress.zipCode,

              primaryPhotoUrl:
                getPrimaryPhotoUrl(
                  listingData,
                ),

              buyerContact: {
                firstName:
                  data.buyerContact
                    .firstName,

                lastName:
                  data.buyerContact
                    .lastName,

                email:
                  authenticatedEmail,

                phone:
                  data.buyerContact
                    .phone,
              },

              requestedTime:
                data.requestedTime,

              buyerMessage:
                data.buyerMessage,

              status: 'pending',

              alternateTime: null,

              sellerResponseMessage:
                '',

              statusHistory: [
                {
                  status: 'pending',
                  changedBy: 'buyer',
                  changedByUid:
                    buyerUid,
                  note:
                    'Showing request submitted.',
                  changedAt: now,
                },
              ],

              createdAt:
                FieldValue
                  .serverTimestamp(),

              updatedAt:
                FieldValue
                  .serverTimestamp(),

              confirmedAt: null,
              declinedAt: null,
              cancelledAt: null,
              completedAt: null,
            },
          );

          transaction.set(
            scheduleReference,
            {
              listingUid:
                data.listingUid,

              date:
                data.requestedTime
                  .date,

              reservations: [
                ...schedule.reservations,
                reservation,
              ],

              updatedAt:
                FieldValue
                  .serverTimestamp(),
            },
            {
              merge: true,
            },
          );

          transaction.set(
            rateLimitReference,
            {
              buyerUid,

              lastRequestAt:
                FieldValue
                  .serverTimestamp(),

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
    } catch (error: unknown) {
      if (error instanceof HttpsError) {
        throw error;
      }

      logger.error(
        'Unable to create showing request.',
        {
          error,
          listingUid:
            data.listingUid,
          buyerUid,
        },
      );

      throw new HttpsError(
        'internal',
        'We could not submit your showing request. Please try again.',
      );
    }

    logger.info(
      'Showing request created.',
      {
        showingRequestUid:
          requestReference.id,
        listingUid:
          data.listingUid,
        buyerUid,
      },
    );

    return {
      success: true,
      showingRequestUid:
        requestReference.id,
      status: 'pending',
    };
  },
);

/**
 * Validates and normalizes callable request data.
 */
function validateRequestData(
  value: unknown,
): CreateShowingRequestData {
  if (!isRecord(value)) {
    throw new HttpsError(
      'invalid-argument',
      'Showing request data is required.',
    );
  }

  const listingUid =
    requireString(
      value['listingUid'],
      'A listing UID is required.',
      128,
    );

  const buyerContactValue =
    value['buyerContact'];

  if (!isRecord(buyerContactValue)) {
    throw new HttpsError(
      'invalid-argument',
      'Buyer contact information is required.',
    );
  }

  const firstName =
    requireString(
      buyerContactValue[
        'firstName'
      ],
      'First name is required.',
      60,
    );

  const lastName =
    requireString(
      buyerContactValue[
        'lastName'
      ],
      'Last name is required.',
      60,
    );

  const email =
    normalizeEmail(
      buyerContactValue['email'],
    );

  if (
    !email ||
    email.length > 160 ||
    !EMAIL_PATTERN.test(email)
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Enter a valid email address.',
    );
  }

  const phone =
    requireString(
      buyerContactValue['phone'],
      'Phone number is required.',
      30,
    );

  const requestedTimeValue =
    value['requestedTime'];

  if (!isRecord(requestedTimeValue)) {
    throw new HttpsError(
      'invalid-argument',
      'A showing date and time are required.',
    );
  }

  const requestedTime:
    ShowingRequestedTime = {
      date:
        requireString(
          requestedTimeValue['date'],
          'A showing date is required.',
          10,
        ),

      startTime:
        requireString(
          requestedTimeValue[
            'startTime'
          ],
          'A showing start time is required.',
          5,
        ),

      endTime:
        requireString(
          requestedTimeValue[
            'endTime'
          ],
          'A showing end time is required.',
          5,
        ),

      timeZone:
        requireString(
          requestedTimeValue[
            'timeZone'
          ],
          'A showing timezone is required.',
          100,
        ),
    };

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

  const buyerMessage =
    optionalString(
      value['buyerMessage'],
      1000,
    );

  return {
    listingUid,

    buyerContact: {
      firstName,
      lastName,
      email,
      phone,
    },

    requestedTime,
    buyerMessage,
  };
}

/**
 * Confirms the requested appointment is one of the
 * seller's generated schedule slots.
 */
function validateRequestedAppointment(
  requestedTime:
    ShowingRequestedTime,
  availability:
    ShowingAvailabilityDocument,
): void {
  if (
    requestedTime.timeZone !==
    availability.timeZone
  ) {
    throw new HttpsError(
      'invalid-argument',
      'The showing timezone does not match the property schedule.',
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
      availability.bookingWindowDays,
    );

  if (
    requestedTime.date <
      currentDate ||
    requestedTime.date >
      finalBookingDate
  ) {
    throw new HttpsError(
      'failed-precondition',
      'The selected date is outside the seller’s booking window.',
    );
  }

  const exception =
    availability.exceptions.find(
      item =>
        item.date ===
        requestedTime.date,
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
          requestedTime.date,
          availability,
        );

  if (!timeWindows.length) {
    throw new HttpsError(
      'failed-precondition',
      'The seller is unavailable on the selected date.',
    );
  }

  const duration =
    availability
      .appointmentDurationMinutes;

  const buffer =
    availability.bufferMinutes;

  const requestedStart =
    timeToMinutes(
      requestedTime.startTime,
    );

  const requestedEnd =
    timeToMinutes(
      requestedTime.endTime,
    );

  if (
    requestedEnd - requestedStart !==
    duration
  ) {
    throw new HttpsError(
      'invalid-argument',
      'The requested appointment duration is invalid.',
    );
  }

  const isGeneratedSlot =
    timeWindows.some(
      window =>
        isSlotInWindow(
          requestedStart,
          requestedEnd,
          duration,
          buffer,
          window,
        ),
    );

  if (!isGeneratedSlot) {
    throw new HttpsError(
      'failed-precondition',
      'The selected time is not available in the seller’s schedule.',
    );
  }

  const appointmentDate =
    zonedDateTimeToDate(
      requestedTime.date,
      requestedTime.startTime,
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
      'The selected time does not provide enough advance notice.',
    );
  }
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

function assertNoConflict(
  requestedTime:
    ShowingRequestedTime,
  reservations:
    ShowingScheduleReservation[],
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

function enforceRateLimit(
  rateLimitData:
    DocumentData | undefined,
): void {
  const lastRequestAt =
    rateLimitData?.[
      'lastRequestAt'
    ];

  if (
    !(lastRequestAt instanceof Timestamp)
  ) {
    return;
  }

  const elapsedTime =
    Date.now() -
    lastRequestAt.toMillis();

  if (
    elapsedTime <
    MINIMUM_REQUEST_INTERVAL_MS
  ) {
    throw new HttpsError(
      'resource-exhausted',
      'Please wait before submitting another showing request.',
    );
  }
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

function getListingAddress(
  listingData: DocumentData,
): {
  addressLine1: string;
  city: string;
  state: string;
  zipCode: string;
} {
  const nestedAddress =
    isRecord(
      listingData['address'],
    )
      ? listingData['address']
      : {};

  return {
    addressLine1:
      readString(
        listingData,
        'addressLine1',
      ) ||
      readString(
        nestedAddress,
        'addressLine1',
      ),

    city:
      readString(
        listingData,
        'city',
      ) ||
      readString(
        nestedAddress,
        'city',
      ),

    state:
      readString(
        listingData,
        'state',
      ) ||
      readString(
        nestedAddress,
        'stateAbbreviation',
      ) ||
      readString(
        nestedAddress,
        'state',
      ),

    zipCode:
      readString(
        listingData,
        'zipCode',
      ) ||
      readString(
        nestedAddress,
        'postalCode',
      ),
  };
}

function getPrimaryPhotoUrl(
  listingData: DocumentData,
): string | null {
  const featuredPhotoUrl =
    readString(
      listingData,
      'featuredPhotoUrl',
    );

  return featuredPhotoUrl || null;
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
  const [hours, minutes] =
    time.split(':').map(Number);

  return hours * 60 + minutes;
}

function readString(
  value: Record<string, unknown>,
  key: string,
): string {
  const fieldValue =
    value[key];

  return typeof fieldValue ===
    'string'
    ? fieldValue.trim()
    : '';
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
  if (value === undefined) {
    return '';
  }

  if (typeof value !== 'string') {
    throw new HttpsError(
      'invalid-argument',
      'The message is invalid.',
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
      'The message is too long.',
    );
  }

  return normalizedValue;
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