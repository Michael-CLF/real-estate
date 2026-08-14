import {
  Injectable,
  inject
} from '@angular/core';

import {
  Observable,
  firstValueFrom
} from 'rxjs';

import {
  DEFAULT_SHOWING_AVAILABILITY,
  ShowingAvailability,
  ShowingAvailabilityUpdate,
  ShowingDayOfWeek,
  ShowingReservedTime,
  ShowingTimeWindow
} from '../models/showing-availability.model';

import {
  CancelShowingRequestInput,
  CreateShowingRequestInput,
  ProposeAlternateShowingTimeInput,
  RespondToShowingRequestInput,
  ShowingRequest,
  ShowingRequestStatus,
  ShowingRequestedTime,
  ShowingStatusHistoryEntry
} from '../models/showing-request.model';

import {
  ShowingRepository
} from '../repositories/showing.repository';

export interface AvailableShowingSlot {
  date: string;
  startTime: string;
  endTime: string;
  timeZone: string;
}

@Injectable({
  providedIn: 'root'
})
export class ShowingService {
  private readonly showingRepository =
    inject(ShowingRepository);

  getAvailability(
    listingUid: string
  ): Observable<ShowingAvailability | null> {
    return this.showingRepository
      .getAvailabilityByListingUid(listingUid);
  }

  getReservedTimesForDate(
    listingUid: string,
    date: string
  ): Observable<ShowingReservedTime[]> {
    return this.showingRepository
      .getReservedTimesForDate(
        listingUid,
        date
      );
  }

  getShowingRequest(
    showingRequestUid: string
  ): Observable<ShowingRequest | null> {
    return this.showingRepository
      .getShowingRequestByUid(showingRequestUid);
  }

  getSellerShowingRequests(
    sellerUid: string
  ): Observable<ShowingRequest[]> {
    return this.showingRepository
      .getShowingRequestsBySellerUid(sellerUid);
  }

  getBuyerShowingRequests(
    buyerUid: string
  ): Observable<ShowingRequest[]> {
    return this.showingRepository
      .getShowingRequestsByBuyerUid(buyerUid);
  }

  getListingShowingRequests(
    listingUid: string
  ): Observable<ShowingRequest[]> {
    return this.showingRepository
      .getShowingRequestsByListingUid(listingUid);
  }

  createDefaultAvailability(
    listingUid: string,
    sellerUid: string
  ): Promise<void> {
    const availability: ShowingAvailability = {
      listingUid,
      sellerUid,

      ...DEFAULT_SHOWING_AVAILABILITY,

      weeklyAvailability:
        DEFAULT_SHOWING_AVAILABILITY.weeklyAvailability.map(
          day => ({
            ...day,
            timeWindows: day.timeWindows.map(
              timeWindow => ({
                ...timeWindow
              })
            )
          })
        ),

      exceptions:
        DEFAULT_SHOWING_AVAILABILITY.exceptions.map(
          exception => ({
            ...exception,
            timeWindows: exception.timeWindows.map(
              timeWindow => ({
                ...timeWindow
              })
            )
          })
        ),

      createdAt: null,
      updatedAt: null
    };

    return this.showingRepository
      .createAvailability(availability);
  }

  updateAvailability(
    listingUid: string,
    sellerUid: string,
    changes: ShowingAvailabilityUpdate
  ): Promise<void> {
    this.validateAvailability(changes);

    return this.showingRepository.updateAvailability(
      listingUid,
      sellerUid,
      changes
    );
  }

  createShowingRequest(
    input: CreateShowingRequestInput
  ): Promise<string> {
    this.validateShowingRequest(input);

    /*
     * The repository performs the final conflict check
     * inside a Firestore transaction.
     */
    return this.showingRepository
      .createShowingRequestIfAvailable(input);
  }

  confirmShowingRequest(
    input: RespondToShowingRequestInput
  ): Promise<void> {
    if (!input.showingRequestUid.trim()) {
      throw new Error(
        'A showing request UID is required.'
      );
    }

    if (!input.sellerUid.trim()) {
      throw new Error(
        'A seller UID is required.'
      );
    }

    /*
     * Confirmation is transactional because another
     * request may have claimed the time since the seller
     * opened the dashboard.
     */
    return this.showingRepository
      .confirmShowingRequestIfAvailable({
        ...input,
        responseMessage:
          input.responseMessage.trim()
      });
  }

  proposeAlternateTime(
    input: ProposeAlternateShowingTimeInput
  ): Promise<void> {
    this.validateRequestedTime(
      input.alternateTime
    );

    /*
     * Alternate times are also checked transactionally.
     */
    return this.showingRepository
      .proposeAlternateTimeIfAvailable({
        ...input,
        alternateTime: {
          ...input.alternateTime,
          message:
            input.alternateTime.message.trim()
        }
      });
  }

  async declineShowingRequest(
    input: RespondToShowingRequestInput
  ): Promise<void> {
    const request = await this.requireShowingRequest(
      input.showingRequestUid
    );

    this.requireSellerOwnership(
      request,
      input.sellerUid
    );

    this.requireStatus(
      request,
      [
        'pending',
        'alternate_proposed'
      ]
    );

    await this.updateRequestStatus(
      request,
      'declined',
      'seller',
      input.sellerUid,
      input.responseMessage
    );
  }

  async cancelShowingRequest(
    input: CancelShowingRequestInput
  ): Promise<void> {
    const request = await this.requireShowingRequest(
      input.showingRequestUid
    );

    if (
      input.cancelledBy === 'seller' &&
      request.sellerUid !== input.cancelledByUid
    ) {
      throw new Error(
        'Only the listing seller may cancel this showing as the seller.'
      );
    }

    if (
      input.cancelledBy === 'buyer' &&
      request.buyerUid !== input.cancelledByUid
    ) {
      throw new Error(
        'Only the buyer who requested this showing may cancel it.'
      );
    }

    this.requireStatus(
      request,
      [
        'pending',
        'confirmed',
        'alternate_proposed'
      ]
    );

    await this.updateRequestStatus(
      request,
      'cancelled',
      input.cancelledBy,
      input.cancelledByUid,
      input.cancellationMessage
    );
  }

  async completeShowingRequest(
    showingRequestUid: string,
    sellerUid: string
  ): Promise<void> {
    const request = await this.requireShowingRequest(
      showingRequestUid
    );

    this.requireSellerOwnership(
      request,
      sellerUid
    );

    this.requireStatus(
      request,
      ['confirmed']
    );

    await this.updateRequestStatus(
      request,
      'completed',
      'seller',
      sellerUid,
      'Showing completed.'
    );
  }

  getAvailableSlotsForDate(
    date: string,
    availability: ShowingAvailability,
    existingRequests: ShowingRequest[]
  ): AvailableShowingSlot[] {
    if (
      !availability.acceptingRequests ||
      !this.isValidDate(date)
    ) {
      return [];
    }

    const exception =
      availability.exceptions.find(
        item => item.date === date
      );

    if (exception?.unavailable) {
      return [];
    }

    const timeWindows =
      exception
        ? exception.timeWindows
        : this.getWeeklyTimeWindows(
          date,
          availability
        );

    if (!timeWindows.length) {
      return [];
    }

    const slots = timeWindows.flatMap(
      timeWindow =>
        this.buildSlotsFromWindow(
          date,
          timeWindow,
          availability
        )
    );

    return slots.filter(
      slot =>
        !this.hasConflict(
          slot,
          existingRequests
        )
    );
  }

  hasConflict(
    requestedTime: ShowingRequestedTime,
    existingRequests: ShowingRequest[],
    excludedShowingRequestUid: string | null = null
  ): boolean {
    const blockingStatuses:
      ShowingRequestStatus[] = [
        'pending',
        'confirmed',
        'alternate_proposed'
      ];

    return existingRequests.some(request => {
      if (
        excludedShowingRequestUid &&
        request.showingRequestUid ===
        excludedShowingRequestUid
      ) {
        return false;
      }

      if (
        !blockingStatuses.includes(
          request.status
        )
      ) {
        return false;
      }

      const blockedTimes: ShowingRequestedTime[] = [
        request.requestedTime
      ];

      if (request.alternateTime) {
        blockedTimes.push({
          date: request.alternateTime.date,
          startTime:
            request.alternateTime.startTime,
          endTime:
            request.alternateTime.endTime,
          timeZone:
            request.alternateTime.timeZone
        });
      }

      return blockedTimes.some(
        blockedTime =>
          this.timesOverlap(
            requestedTime,
            blockedTime
          )
      );
    });
  }

  private getWeeklyTimeWindows(
    date: string,
    availability: ShowingAvailability
  ): ShowingTimeWindow[] {
    const dayOfWeek =
      this.getDayOfWeek(date);

    const dailyAvailability =
      availability.weeklyAvailability.find(
        day => day.dayOfWeek === dayOfWeek
      );

    if (
      !dailyAvailability ||
      !dailyAvailability.enabled
    ) {
      return [];
    }

    return dailyAvailability.timeWindows;
  }

  private buildSlotsFromWindow(
    date: string,
    timeWindow: ShowingTimeWindow,
    availability: ShowingAvailability
  ): AvailableShowingSlot[] {
    const slots: AvailableShowingSlot[] = [];

    const windowStart =
      this.timeToMinutes(
        timeWindow.startTime
      );

    const windowEnd =
      this.timeToMinutes(
        timeWindow.endTime
      );

    const duration =
      availability.appointmentDurationMinutes;

    const interval =
      duration + availability.bufferMinutes;

    for (
      let start = windowStart;
      start + duration <= windowEnd;
      start += interval
    ) {
      slots.push({
        date,
        startTime:
          this.minutesToTime(start),
        endTime:
          this.minutesToTime(
            start + duration
          ),
        timeZone:
          availability.timeZone
      });
    }

    return slots;
  }

  private timesOverlap(
    first: ShowingRequestedTime,
    second: ShowingRequestedTime
  ): boolean {
    if (first.date !== second.date) {
      return false;
    }

    const firstStart =
      this.timeToMinutes(first.startTime);

    const firstEnd =
      this.timeToMinutes(first.endTime);

    const secondStart =
      this.timeToMinutes(second.startTime);

    const secondEnd =
      this.timeToMinutes(second.endTime);

    return (
      firstStart < secondEnd &&
      firstEnd > secondStart
    );
  }

  private async updateRequestStatus(
    request: ShowingRequest,
    status: ShowingRequestStatus,
    changedBy: 'buyer' | 'seller',
    changedByUid: string,
    note: string
  ): Promise<void> {
    const now = new Date();

    const historyEntry:
      ShowingStatusHistoryEntry = {
      status,
      changedBy,
      changedByUid,
      note: note.trim(),
      changedAt: now
    };

    const timestampChanges: Partial<
      Pick<
        ShowingRequest,
        | 'confirmedAt'
        | 'declinedAt'
        | 'cancelledAt'
        | 'completedAt'
      >
    > = {};

    if (status === 'confirmed') {
      timestampChanges.confirmedAt = now;
    }

    if (status === 'declined') {
      timestampChanges.declinedAt = now;
    }

    if (status === 'cancelled') {
      timestampChanges.cancelledAt = now;
    }

    if (status === 'completed') {
      timestampChanges.completedAt = now;
    }

    await this.showingRepository
      .updateShowingRequest(
        request.showingRequestUid,
        {
          status,
          statusHistory: [
            ...request.statusHistory,
            historyEntry
          ],
          updatedAt: now,
          ...timestampChanges
        }
      );
  }

  private async requireShowingRequest(
    showingRequestUid: string
  ): Promise<ShowingRequest> {
    const request = await firstValueFrom(
      this.showingRepository
        .getShowingRequestByUid(
          showingRequestUid
        )
    );

    if (!request) {
      throw new Error(
        'The showing request could not be found.'
      );
    }

    return request;
  }

  private requireSellerOwnership(
    request: ShowingRequest,
    sellerUid: string
  ): void {
    if (request.sellerUid !== sellerUid) {
      throw new Error(
        'Only the listing seller may manage this showing request.'
      );
    }
  }

  private requireStatus(
    request: ShowingRequest,
    permittedStatuses:
      ShowingRequestStatus[]
  ): void {
    if (
      !permittedStatuses.includes(
        request.status
      )
    ) {
      throw new Error(
        `This action is not available while the showing request is ${request.status}.`
      );
    }
  }

  private validateShowingRequest(
    input: CreateShowingRequestInput
  ): void {
    if (
      !input.listingUid.trim() ||
      !input.sellerUid.trim()
    ) {
      throw new Error(
        'The listing and seller are required.'
      );
    }

    if (
      !input.buyerContact.firstName.trim() ||
      !input.buyerContact.lastName.trim()
    ) {
      throw new Error(
        'The buyer’s first and last name are required.'
      );
    }

    if (
      !input.buyerContact.email.trim() ||
      !input.buyerContact.phone.trim()
    ) {
      throw new Error(
        'The buyer’s email and phone number are required.'
      );
    }

    this.validateRequestedTime(
      input.requestedTime
    );
  }

  private validateRequestedTime(
    requestedTime: {
      date: string;
      startTime: string;
      endTime: string;
      timeZone: string;
    }
  ): void {
    if (!this.isValidDate(requestedTime.date)) {
      throw new Error(
        'A valid showing date is required.'
      );
    }

    if (
      !this.isValidTime(
        requestedTime.startTime
      ) ||
      !this.isValidTime(
        requestedTime.endTime
      )
    ) {
      throw new Error(
        'Valid showing start and end times are required.'
      );
    }

    if (
      this.timeToMinutes(
        requestedTime.endTime
      ) <=
      this.timeToMinutes(
        requestedTime.startTime
      )
    ) {
      throw new Error(
        'The showing end time must be after its start time.'
      );
    }

    if (!requestedTime.timeZone.trim()) {
      throw new Error(
        'A showing timezone is required.'
      );
    }
  }

  private validateAvailability(
    changes: ShowingAvailabilityUpdate
  ): void {
    if (
      changes.appointmentDurationMinutes <= 0
    ) {
      throw new Error(
        'The appointment duration must be greater than zero.'
      );
    }

    if (changes.bufferMinutes < 0) {
      throw new Error(
        'The appointment buffer cannot be negative.'
      );
    }

    if (changes.minimumNoticeHours < 0) {
      throw new Error(
        'The minimum notice cannot be negative.'
      );
    }

    if (changes.bookingWindowDays <= 0) {
      throw new Error(
        'The booking window must be greater than zero.'
      );
    }

    if (!changes.timeZone.trim()) {
      throw new Error(
        'A timezone is required.'
      );
    }

    const allTimeWindows = [
      ...changes.weeklyAvailability.flatMap(
        day => day.timeWindows
      ),
      ...changes.exceptions.flatMap(
        exception =>
          exception.timeWindows
      )
    ];

    allTimeWindows.forEach(
      timeWindow => {
        if (
          !this.isValidTime(
            timeWindow.startTime
          ) ||
          !this.isValidTime(
            timeWindow.endTime
          )
        ) {
          throw new Error(
            'Availability contains an invalid time.'
          );
        }

        if (
          this.timeToMinutes(
            timeWindow.endTime
          ) <=
          this.timeToMinutes(
            timeWindow.startTime
          )
        ) {
          throw new Error(
            'Availability end times must be after their start times.'
          );
        }
      }
    );
  }

  private getDayOfWeek(
    date: string
  ): ShowingDayOfWeek {
    const dayNames: ShowingDayOfWeek[] = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday'
    ];

    const [year, month, day] =
      date.split('-').map(Number);

    const dayIndex = new Date(
      Date.UTC(year, month - 1, day)
    ).getUTCDay();

    return dayNames[dayIndex];
  }

  private timeToMinutes(
    time: string
  ): number {
    const [hours, minutes] =
      time.split(':').map(Number);

    return hours * 60 + minutes;
  }

  private minutesToTime(
    totalMinutes: number
  ): string {
    const hours = Math.floor(
      totalMinutes / 60
    );

    const minutes =
      totalMinutes % 60;

    return `${hours
      .toString()
      .padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}`;
  }

  private isValidDate(
    date: string
  ): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(
      date
    );
  }

  private isValidTime(
    time: string
  ): boolean {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(
      time
    );
  }
}