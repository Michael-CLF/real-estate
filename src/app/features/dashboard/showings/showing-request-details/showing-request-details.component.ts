import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  ActivatedRoute,
  RouterLink
} from '@angular/router';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

import {
  AuthService
} from '../../../../core/authentication/services/auth.service';

import {
  ShowingRequest,
  ShowingRequestStatus
} from '../../../../core/domains/showings/models/showing-request.model';

import {
  ShowingService
} from '../../../../core/domains/showings/services/showing.service';

@Component({
  selector: 'app-showing-request-details',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl: './showing-request-details.component.html',
  styleUrl: './showing-request-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShowingRequestDetailsComponent
  implements OnInit {
  private readonly route =
    inject(ActivatedRoute);

  private readonly destroyRef =
    inject(DestroyRef);

  private readonly authService =
    inject(AuthService);

  private readonly showingService =
    inject(ShowingService);

  protected readonly request =
    signal<ShowingRequest | null>(null);

  protected readonly isLoading =
    signal(true);

  protected readonly loadError =
    signal('');

  protected readonly isResponding =
    signal(false);

  protected readonly responseError =
    signal('');

  protected readonly responseMessage =
    signal('');

  protected readonly showAlternateForm =
    signal(false);

  protected readonly alternateDate =
    signal('');

  protected readonly alternateStartTime =
    signal('');

  protected readonly alternateMessage =
    signal('');

  protected readonly listingUid =
    this.route.snapshot.paramMap.get(
      'listingUid'
    ) ?? '';

  protected readonly showingRequestUid =
    this.route.snapshot.paramMap.get(
      'showingRequestUid'
    ) ?? '';

  protected readonly canRespond =
    computed(() =>
      this.request()?.status === 'pending'
    );

  async ngOnInit(): Promise<void> {
    if (
      !this.listingUid ||
      !this.showingRequestUid
    ) {
      this.loadError.set(
        'The showing request could not be identified.'
      );

      this.isLoading.set(false);
      return;
    }

    const currentUserUid =
      this.authService.currentUserUid;

    if (!currentUserUid) {
      this.loadError.set(
        'You must be signed in to review this showing request.'
      );

      this.isLoading.set(false);
      return;
    }

    this.showingService
      .getShowingRequest(
        this.showingRequestUid
      )
      .pipe(
        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe({
        next: request => {
          if (!request) {
            this.loadError.set(
              'The showing request could not be found.'
            );

            this.request.set(null);
            this.isLoading.set(false);
            return;
          }

          if (
            request.listingUid !==
            this.listingUid
          ) {
            this.loadError.set(
              'This showing request does not belong to the selected listing.'
            );

            this.request.set(null);
            this.isLoading.set(false);
            return;
          }

          if (
            request.sellerUid !==
            currentUserUid
          ) {
            this.loadError.set(
              'You do not have permission to review this showing request.'
            );

            this.request.set(null);
            this.isLoading.set(false);
            return;
          }

          this.request.set(request);
          this.loadError.set('');
          this.isLoading.set(false);
        },

        error: (error: unknown) => {
          console.error(
            'Unable to load showing request:',
            error
          );

          this.loadError.set(
            'We could not load this showing request. Please return to the request list and try again.'
          );

          this.request.set(null);
          this.isLoading.set(false);
        }
      });
  }

  protected updateResponseMessage(
    value: string
  ): void {
    this.responseMessage.set(value);
  }

  protected updateAlternateDate(
    value: string
  ): void {
    this.alternateDate.set(value);
  }

  protected updateAlternateStartTime(
    value: string
  ): void {
    this.alternateStartTime.set(value);
  }

  protected updateAlternateMessage(
    value: string
  ): void {
    this.alternateMessage.set(value);
  }

  protected openAlternateForm(): void {
    const request =
      this.request();

    if (!request) {
      return;
    }

    this.responseError.set('');

    this.alternateDate.set(
      request.alternateTime?.date ||
      request.requestedTime.date
    );

    this.alternateStartTime.set(
      request.alternateTime?.startTime ||
      request.requestedTime.startTime
    );

    this.alternateMessage.set(
      request.alternateTime?.message || ''
    );

    this.showAlternateForm.set(true);
  }

  protected closeAlternateForm(): void {
    if (this.isResponding()) {
      return;
    }

    this.responseError.set('');
    this.showAlternateForm.set(false);
  }

  protected async acceptShowing(): Promise<void> {
    const request =
      this.request();

    const sellerUid =
      this.authService.currentUserUid;

    if (
      !request ||
      !sellerUid ||
      this.isResponding()
    ) {
      return;
    }

    this.isResponding.set(true);
    this.responseError.set('');

    try {
      await this.showingService
        .confirmShowingRequest({
          showingRequestUid:
            request.showingRequestUid,

          sellerUid,

          responseMessage:
            this.responseMessage().trim()
        });
    } catch (error: unknown) {
      console.error(
        'Unable to confirm showing request:',
        error
      );

      this.responseError.set(
        this.getResponseErrorMessage(
          error,
          'We could not confirm this showing request. Please try again.'
        )
      );
    } finally {
      this.isResponding.set(false);
    }
  }

  protected async declineShowing(): Promise<void> {
    const request =
      this.request();

    const sellerUid =
      this.authService.currentUserUid;

    if (
      !request ||
      !sellerUid ||
      this.isResponding()
    ) {
      return;
    }

    this.isResponding.set(true);
    this.responseError.set('');

    try {
      await this.showingService
        .declineShowingRequest({
          showingRequestUid:
            request.showingRequestUid,

          sellerUid,

          responseMessage:
            this.responseMessage().trim()
        });
    } catch (error: unknown) {
      console.error(
        'Unable to decline showing request:',
        error
      );

      this.responseError.set(
        this.getResponseErrorMessage(
          error,
          'We could not decline this showing request. Please try again.'
        )
      );
    } finally {
      this.isResponding.set(false);
    }
  }

  protected async proposeAlternateTime():
    Promise<void> {
    const request =
      this.request();

    const sellerUid =
      this.authService.currentUserUid;

    const date =
      this.alternateDate().trim();

    const startTime =
      this.alternateStartTime().trim();

    if (
      !request ||
      !sellerUid ||
      this.isResponding()
    ) {
      return;
    }

    if (!date || !startTime) {
      this.responseError.set(
        'Select an alternate date and start time.'
      );

      return;
    }

    const endTime =
      this.calculateAlternateEndTime(
        startTime,
        request.requestedTime.startTime,
        request.requestedTime.endTime
      );

    this.isResponding.set(true);
    this.responseError.set('');

    try {
      await this.showingService
        .proposeAlternateTime({
          showingRequestUid:
            request.showingRequestUid,

          sellerUid,

          alternateTime: {
            date,
            startTime,
            endTime,

            timeZone:
              request.requestedTime.timeZone,

            message:
              this.alternateMessage().trim()
          }
        });

      this.showAlternateForm.set(false);
    } catch (error: unknown) {
      console.error(
        'Unable to propose alternate showing time:',
        error
      );

      this.responseError.set(
        this.getResponseErrorMessage(
          error,
          'We could not propose that time. It may no longer be available.'
        )
      );
    } finally {
      this.isResponding.set(false);
    }
  }

  private calculateAlternateEndTime(
    startTime: string,
    originalStartTime: string,
    originalEndTime: string
  ): string {
    const originalStartMinutes =
      this.timeToMinutes(
        originalStartTime
      );

    const originalEndMinutes =
      this.timeToMinutes(
        originalEndTime
      );

    const durationMinutes =
      Math.max(
        originalEndMinutes -
        originalStartMinutes,
        15
      );

    const alternateEndMinutes =
      this.timeToMinutes(startTime) +
      durationMinutes;

    const hours =
      Math.floor(
        alternateEndMinutes / 60
      ) % 24;

    const minutes =
      alternateEndMinutes % 60;

    return (
      `${hours}`.padStart(2, '0') +
      ':' +
      `${minutes}`.padStart(2, '0')
    );
  }

  private timeToMinutes(
    time: string
  ): number {
    const [
      hours,
      minutes
    ] = time
      .split(':')
      .map(Number);

    return (
      (Number.isFinite(hours) ? hours : 0) *
      60 +
      (Number.isFinite(minutes) ? minutes : 0)
    );
  }

  private getResponseErrorMessage(
    error: unknown,
    fallbackMessage: string
  ): string {
    if (
      error instanceof Error &&
      error.message.trim()
    ) {
      return error.message;
    }

    return fallbackMessage;
  }

  protected buyerName(
    request: ShowingRequest
  ): string {
    return [
      request.buyerContact.firstName,
      request.buyerContact.lastName
    ]
      .filter(Boolean)
      .join(' ');
  }

  protected propertyLocation(
    request: ShowingRequest
  ): string {
    const cityAndState = [
      request.propertyCity,
      request.propertyState
    ]
      .filter(Boolean)
      .join(', ');

    return [
      cityAndState,
      request.propertyZipCode
    ]
      .filter(Boolean)
      .join(' ');
  }

  protected responsePanelHeading(
    status: ShowingRequestStatus
  ): string {
    switch (status) {
      case 'pending':
        return 'Respond to this request';

      case 'alternate_proposed':
        return 'Waiting for the buyer';

      case 'confirmed':
        return 'Showing confirmed';

      case 'declined':
        return 'Request declined';

      case 'cancelled':
        return 'Showing cancelled';

      case 'completed':
        return 'Showing completed';
    }
  }

  protected sellerStatusDescription(
    status: ShowingRequestStatus
  ): string {
    switch (status) {
      case 'pending':
        return 'This request is waiting for your response.';

      case 'alternate_proposed':
        return 'You proposed another appointment time. The buyer must accept or decline the proposed time.';

      case 'confirmed':
        return 'This appointment is confirmed. The buyer has been notified.';

      case 'declined':
        return 'You declined this showing request. The buyer has been notified.';

      case 'cancelled':
        return 'This showing has been cancelled and its reserved time has been released.';

      case 'completed':
        return 'This showing has been marked as completed.';
    }
  }

  protected statusLabel(
    status: ShowingRequestStatus
  ): string {
    switch (status) {
      case 'pending':
        return 'Pending review';

      case 'confirmed':
        return 'Confirmed';

      case 'alternate_proposed':
        return 'Alternate time proposed';

      case 'declined':
        return 'Declined';

      case 'cancelled':
        return 'Cancelled';

      case 'completed':
        return 'Completed';
    }
  }

  protected statusClass(
    status: ShowingRequestStatus
  ): string {
    return `status-badge--${status}`;
  }

  protected formatDate(
    date: string
  ): string {
    const parsedDate =
      new Date(`${date}T12:00:00`);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return date;
    }

    return new Intl.DateTimeFormat(
      'en-US',
      {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }
    ).format(parsedDate);
  }

  protected formatTime(
    time: string
  ): string {
    const [
      hourValue,
      minuteValue
    ] = time
      .split(':')
      .map(Number);

    if (
      !Number.isFinite(hourValue) ||
      !Number.isFinite(minuteValue)
    ) {
      return time;
    }

    const date =
      new Date();

    date.setHours(
      hourValue,
      minuteValue,
      0,
      0
    );

    return new Intl.DateTimeFormat(
      'en-US',
      {
        hour: 'numeric',
        minute: '2-digit'
      }
    ).format(date);
  }

  protected formatSubmittedAt(
    date: Date | null
  ): string {
    if (!date) {
      return 'Not available';
    }

    return new Intl.DateTimeFormat(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }
    ).format(date);
  }

  protected referenceNumber(
    request: ShowingRequest
  ): string {
    return (
      request.showingReferenceNumber ||
      request.showingRequestUid
    );
  }
}