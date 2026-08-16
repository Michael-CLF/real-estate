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
  Router,
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
  selector: 'app-showing-requests',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl: './showing-requests.component.html',
  styleUrl: './showing-requests.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShowingRequestsComponent implements OnInit {
  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

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

  protected readonly listingUid =
    this.route.snapshot.paramMap.get(
      'listingUid'
    ) ?? '';

  protected readonly pendingCount =
    computed(
      () =>
        this.requests().filter(
          request =>
            request.status === 'pending'
        ).length
    );

  protected readonly confirmedCount =
    computed(
      () =>
        this.requests().filter(
          request =>
            request.status === 'confirmed'
        ).length
    );

  protected readonly alternateCount =
    computed(
      () =>
        this.requests().filter(
          request =>
            request.status ===
            'alternate_proposed'
        ).length
    );

  async ngOnInit(): Promise<void> {
    if (!this.listingUid) {
      this.loadError.set(
        'The listing could not be identified.'
      );

      this.isLoading.set(false);
      return;
    }

    const currentUserUid =
      this.authService.currentUserUid;

    if (!currentUserUid) {
      this.loadError.set(
        'You must be signed in to review showing requests.'
      );

      this.isLoading.set(false);
      return;
    }

    this.showingService
      .getListingShowingRequests(
        this.listingUid
      )
      .pipe(
        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe({
        next: requests => {
          const ownedRequests =
            requests.filter(
              request =>
                request.sellerUid ===
                currentUserUid
            );

          if (
            requests.length !==
            ownedRequests.length
          ) {
            console.error(
              'Showing request ownership mismatch detected.'
            );

            this.loadError.set(
              'You do not have permission to review the showing requests for this listing.'
            );

            this.requests.set([]);
            this.isLoading.set(false);
            return;
          }

          this.requests.set(
            this.sortRequests(
              ownedRequests
            )
          );

          this.loadError.set('');
          this.isLoading.set(false);
        },

        error: (error: unknown) => {
          console.error(
            'Unable to load showing requests:',
            error
          );

          this.loadError.set(
            'We could not load the showing requests for this listing. Please try again.'
          );

          this.isLoading.set(false);
        }
      });
  }

  protected async openRequest(
    showingRequestUid: string
  ): Promise<void> {
    await this.router.navigate([
      '/sell/listings',
      this.listingUid,
      'showing-requests',
      showingRequestUid
    ]);
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
        weekday: 'short',
        month: 'short',
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
    return [
      request.propertyCity,
      request.propertyState,
      request.propertyZipCode
    ]
      .filter(Boolean)
      .join(', ')
      .replace(
        `, ${request.propertyZipCode}`,
        ` ${request.propertyZipCode}`
      );
  }

  private sortRequests(
    requests: ShowingRequest[]
  ): ShowingRequest[] {
    const statusPriority:
      Record<ShowingRequestStatus, number> = {
        pending: 0,
        alternate_proposed: 1,
        confirmed: 2,
        completed: 3,
        declined: 4,
        cancelled: 5
      };

    return [
      ...requests
    ].sort(
      (
        firstRequest,
        secondRequest
      ) => {
        const priorityDifference =
          statusPriority[
            firstRequest.status
          ] -
          statusPriority[
            secondRequest.status
          ];

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        const firstDateTime =
          `${firstRequest.requestedTime.date}` +
          `T${firstRequest.requestedTime.startTime}`;

        const secondDateTime =
          `${secondRequest.requestedTime.date}` +
          `T${secondRequest.requestedTime.startTime}`;

        return firstDateTime.localeCompare(
          secondDateTime
        );
      }
    );
  }
}