import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
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
  selector: 'app-my-showing-requests',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl: './my-showing-requests.component.html',
  styleUrl: './my-showing-requests.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class MyShowingRequestsComponent
implements OnInit {
  private readonly destroyRef =
    inject(DestroyRef);

  private readonly authService =
    inject(AuthService);

  private readonly showingService =
    inject(ShowingService);

  protected readonly requests =
    signal<ShowingRequest[]>([]);

  protected readonly isLoading =
    signal(true);

  protected readonly loadError =
    signal('');

  protected readonly respondingRequestUid =
    signal('');

  protected readonly responseError =
    signal('');

  async ngOnInit(): Promise<void> {
    const buyerUid =
      this.authService.currentUserUid;

    if (!buyerUid) {
      this.loadError.set(
        'You must be signed in to view your showing requests.'
      );

      this.isLoading.set(false);
      return;
    }

    this.showingService
      .getBuyerShowingRequests(
        buyerUid
      )
      .pipe(
        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe({
        next: requests => {
          this.requests.set(requests);
          this.loadError.set('');
          this.isLoading.set(false);
        },

        error: (error: unknown) => {
          console.error(
            'Unable to load buyer showing requests:',
            error
          );

          this.loadError.set(
            'We could not load your showing requests. Please try again.'
          );

          this.requests.set([]);
          this.isLoading.set(false);
        }
      });
  }

  protected async acceptAlternateTime(
    request: ShowingRequest
  ): Promise<void> {
    const buyerUid =
      this.authService.currentUserUid;

    if (
      !buyerUid ||
      request.status !==
        'alternate_proposed' ||
      this.respondingRequestUid()
    ) {
      return;
    }

    this.respondingRequestUid.set(
      request.showingRequestUid
    );

    this.responseError.set('');

    try {
      await this.showingService
        .acceptAlternateShowingTime({
          showingRequestUid:
            request.showingRequestUid,

          buyerUid,

          responseMessage:
            'Buyer accepted the proposed alternate showing time.'
        });
    } catch (error: unknown) {
      console.error(
        'Unable to accept alternate showing time:',
        error
      );

      this.responseError.set(
        this.getErrorMessage(
          error,
          'We could not accept this proposed time. It may no longer be available.'
        )
      );
    } finally {
      this.respondingRequestUid.set('');
    }
  }

  protected async declineAlternateTime(
    request: ShowingRequest
  ): Promise<void> {
    const buyerUid =
      this.authService.currentUserUid;

    if (
      !buyerUid ||
      request.status !==
        'alternate_proposed' ||
      this.respondingRequestUid()
    ) {
      return;
    }

    this.respondingRequestUid.set(
      request.showingRequestUid
    );

    this.responseError.set('');

    try {
      await this.showingService
        .declineAlternateShowingTime({
          showingRequestUid:
            request.showingRequestUid,

          buyerUid,

          responseMessage:
            'Buyer declined the proposed alternate showing time.'
        });
    } catch (error: unknown) {
      console.error(
        'Unable to decline alternate showing time:',
        error
      );

      this.responseError.set(
        this.getErrorMessage(
          error,
          'We could not decline this proposed time. Please try again.'
        )
      );
    } finally {
      this.respondingRequestUid.set('');
    }
  }

  protected isResponding(
    request: ShowingRequest
  ): boolean {
    return (
      this.respondingRequestUid() ===
      request.showingRequestUid
    );
  }

  protected statusLabel(
    status: ShowingRequestStatus
  ): string {
    switch (status) {
      case 'pending':
        return 'Pending seller response';

      case 'confirmed':
        return 'Confirmed';

      case 'alternate_proposed':
        return 'Your response is needed';

      case 'declined':
        return 'Declined by seller';

      case 'cancelled':
        return 'Cancelled';

      case 'completed':
        return 'Completed';
    }
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

  protected referenceNumber(
    request: ShowingRequest
  ): string {
    return (
      request.showingReferenceNumber ||
      request.showingRequestUid
    );
  }

  private getErrorMessage(
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
}