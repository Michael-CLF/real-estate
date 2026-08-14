export type ShowingRequestStatus =
  | 'pending'
  | 'confirmed'
  | 'alternate_proposed'
  | 'declined'
  | 'cancelled'
  | 'completed';

export type ShowingRequestParticipant =
  | 'buyer'
  | 'seller';

export interface ShowingContactInformation {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface ShowingRequestedTime {
  /**
   * Calendar date formatted as YYYY-MM-DD.
   */
  date: string;

  /**
   * Times formatted using 24-hour HH:mm values.
   */
  startTime: string;
  endTime: string;

  /**
   * IANA timezone inherited from the listing availability.
   * Example: America/New_York
   */
  timeZone: string;
}

export interface ShowingAlternateTime {
  date: string;
  startTime: string;
  endTime: string;
  timeZone: string;
  message: string;
  proposedAt: Date | null;
}

export interface ShowingStatusHistoryEntry {
  status: ShowingRequestStatus;
  changedBy: ShowingRequestParticipant;
  changedByUid: string;
  note: string;
  changedAt: Date | null;
}

export interface ShowingRequest {
  showingRequestUid: string;

  listingUid: string;
  sellerUid: string;

  /**
   * Null allows an unauthenticated buyer request if that
   * option is enabled later. Authenticated buyers store
   * their Firebase UID here.
   */
  buyerUid: string | null;

  /**
   * Denormalized listing information used by the seller
   * and buyer dashboards without loading the full listing.
   */
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  propertyZipCode: string;
  primaryPhotoUrl: string | null;

  buyerContact: ShowingContactInformation;
  requestedTime: ShowingRequestedTime;

  /**
   * Optional message supplied by the buyer.
   */
  buyerMessage: string;

  status: ShowingRequestStatus;

  /**
   * Populated when the seller proposes a different time.
   */
  alternateTime: ShowingAlternateTime | null;

  /**
   * Optional explanation when the seller declines.
   */
  sellerResponseMessage: string;

  statusHistory: ShowingStatusHistoryEntry[];

  createdAt: Date | null;
  updatedAt: Date | null;
  confirmedAt: Date | null;
  declinedAt: Date | null;
  cancelledAt: Date | null;
  completedAt: Date | null;
}

export interface CreateShowingRequestInput {
  listingUid: string;
  sellerUid: string;
  buyerUid: string | null;

  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  propertyZipCode: string;
  primaryPhotoUrl: string | null;

  buyerContact: ShowingContactInformation;
  requestedTime: ShowingRequestedTime;
  buyerMessage: string;
}

export interface ProposeAlternateShowingTimeInput {
  showingRequestUid: string;
  sellerUid: string;
  alternateTime: Omit<
    ShowingAlternateTime,
    'proposedAt'
  >;
}

export interface RespondToShowingRequestInput {
  showingRequestUid: string;
  sellerUid: string;
  responseMessage: string;
}

export interface CancelShowingRequestInput {
  showingRequestUid: string;
  cancelledBy: ShowingRequestParticipant;
  cancelledByUid: string;
  cancellationMessage: string;
}