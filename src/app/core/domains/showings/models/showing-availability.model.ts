export type ShowingDayOfWeek =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

export interface ShowingTimeWindow {
  startTime: string;
  endTime: string;
}

export interface ShowingReservedTime {
  showingRequestUid: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface ShowingDailyAvailability {
  dayOfWeek: ShowingDayOfWeek;
  enabled: boolean;
  timeWindows: ShowingTimeWindow[];
}

export interface ShowingAvailabilityException {
  /**
   * Calendar date formatted as YYYY-MM-DD.
   */
  date: string;

  /**
   * When true, no showings may be requested on this date.
   */
  unavailable: boolean;

  /**
   * Optional replacement hours for this specific date.
   * These override the normal weekly schedule.
   */
  timeWindows: ShowingTimeWindow[];
}

export interface ShowingAvailability {
  listingUid: string;
  sellerUid: string;

  /**
   * Controls whether buyers may currently request showings
   * for this listing.
   */
  acceptingRequests: boolean;

  /**
   * IANA timezone used when presenting and saving showing times.
   * Example: America/New_York
   */
  timeZone: string;

  /**
   * Length of each available showing appointment.
   */
  appointmentDurationMinutes: number;

  /**
   * Time required between consecutive showing appointments.
   */
  bufferMinutes: number;

  /**
   * Minimum notice required before a buyer may request a showing.
   */
  minimumNoticeHours: number;

  /**
   * Maximum number of days into the future that a buyer may request.
   */
  bookingWindowDays: number;

  weeklyAvailability: ShowingDailyAvailability[];
  exceptions: ShowingAvailabilityException[];

  createdAt: Date | null;
  updatedAt: Date | null;
}

export type ShowingAvailabilityUpdate = Pick<
  ShowingAvailability,
  | 'acceptingRequests'
  | 'timeZone'
  | 'appointmentDurationMinutes'
  | 'bufferMinutes'
  | 'minimumNoticeHours'
  | 'bookingWindowDays'
  | 'weeklyAvailability'
  | 'exceptions'
>;

export const DEFAULT_SHOWING_AVAILABILITY: Omit<
  ShowingAvailability,
  'listingUid' | 'sellerUid' | 'createdAt' | 'updatedAt'
> = {
  acceptingRequests: true,
  timeZone: 'America/New_York',
  appointmentDurationMinutes: 30,
  bufferMinutes: 30,
  minimumNoticeHours: 24,
  bookingWindowDays: 30,

  weeklyAvailability: [
    {
      dayOfWeek: 'sunday',
      enabled: false,
      timeWindows: []
    },
    {
      dayOfWeek: 'monday',
      enabled: true,
      timeWindows: [
        {
          startTime: '09:00',
          endTime: '17:00'
        }
      ]
    },
    {
      dayOfWeek: 'tuesday',
      enabled: true,
      timeWindows: [
        {
          startTime: '09:00',
          endTime: '17:00'
        }
      ]
    },
    {
      dayOfWeek: 'wednesday',
      enabled: true,
      timeWindows: [
        {
          startTime: '09:00',
          endTime: '17:00'
        }
      ]
    },
    {
      dayOfWeek: 'thursday',
      enabled: true,
      timeWindows: [
        {
          startTime: '09:00',
          endTime: '17:00'
        }
      ]
    },
    {
      dayOfWeek: 'friday',
      enabled: true,
      timeWindows: [
        {
          startTime: '09:00',
          endTime: '17:00'
        }
      ]
    },
    {
      dayOfWeek: 'saturday',
      enabled: false,
      timeWindows: []
    }
  ],

  exceptions: []
};