export type ShowingRequestStatus =
  | 'pending'
  | 'confirmed'
  | 'alternate_proposed'
  | 'declined'
  | 'cancelled'
  | 'completed';

export interface ShowingContactInformation {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface ShowingRequestedTime {
  date: string;
  startTime: string;
  endTime: string;
  timeZone: string;
}

export interface CreateShowingRequestData {
  listingUid: string;
  buyerContact: ShowingContactInformation;
  requestedTime: ShowingRequestedTime;
  buyerMessage?: string;
}

export interface CreateShowingRequestResponse {
  success: true;
  showingRequestUid: string;
  status: 'pending';
}

export type ShowingRequestResponseAction =
  | 'confirm'
  | 'decline'
  | 'propose_alternate'
  | 'accept_alternate'
  | 'decline_alternate';

export interface ShowingAlternateTimeData {
  date: string;
  startTime: string;
  endTime: string;
  timeZone: string;
  message?: string;
}

export interface RespondToShowingRequestData {
  showingRequestUid: string;
  action: ShowingRequestResponseAction;
  responseMessage?: string;
  alternateTime?: ShowingAlternateTimeData;
}

export interface RespondToShowingRequestResponse {
  success: true;
  showingRequestUid: string;
  listingUid: string;
  status: ShowingRequestStatus;
}

export interface ShowingTimeWindow {
  startTime: string;
  endTime: string;
}

export interface ShowingDailyAvailability {
  dayOfWeek: string;
  enabled: boolean;
  timeWindows: ShowingTimeWindow[];
}

export interface ShowingAvailabilityException {
  date: string;
  unavailable: boolean;
  timeWindows: ShowingTimeWindow[];
}

export interface ShowingAvailabilityDocument {
  listingUid: string;
  sellerUid: string;
  acceptingRequests: boolean;
  timeZone: string;
  appointmentDurationMinutes: number;
  bufferMinutes: number;
  minimumNoticeHours: number;
  bookingWindowDays: number;
  weeklyAvailability: ShowingDailyAvailability[];
  exceptions: ShowingAvailabilityException[];
}

export interface ShowingScheduleReservation {
  showingRequestUid: string;
  startTime: string;
  endTime: string;
  status: ShowingRequestStatus;
}

export interface ShowingScheduleDocument {
  listingUid: string;
  date: string;
  reservations: ShowingScheduleReservation[];
}