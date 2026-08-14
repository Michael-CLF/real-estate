import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  firstValueFrom
} from 'rxjs';

import {
  AuthService
} from '../../../../core/authentication/services/auth.service';

import {
  ShowingAvailability,
  ShowingAvailabilityException,
  ShowingDayOfWeek,
  ShowingTimeWindow
} from '../../../../core/domains/showings/models/showing-availability.model';

import {
  ShowingService
} from '../../../../core/domains/showings/services/showing.service';

interface ShowingDayOption {
  value: ShowingDayOfWeek;
  label: string;
}

@Component({
  selector: 'app-showing-availability',
  standalone: true,
  imports: [],
  templateUrl: './showing-availability.component.html',
  styleUrl: './showing-availability.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShowingAvailabilityComponent
  implements OnInit {

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly authService =
    inject(AuthService);

  private readonly showingService =
    inject(ShowingService);

  protected readonly dayOptions:
    readonly ShowingDayOption[] = [
      {
        value: 'sunday',
        label: 'Sunday'
      },
      {
        value: 'monday',
        label: 'Monday'
      },
      {
        value: 'tuesday',
        label: 'Tuesday'
      },
      {
        value: 'wednesday',
        label: 'Wednesday'
      },
      {
        value: 'thursday',
        label: 'Thursday'
      },
      {
        value: 'friday',
        label: 'Friday'
      },
      {
        value: 'saturday',
        label: 'Saturday'
      }
    ];

  protected readonly durationOptions =
    [
      {
        value: 15,
        label: '15 minutes'
      },
      {
        value: 30,
        label: '30 minutes'
      },
      {
        value: 45,
        label: '45 minutes'
      },
      {
        value: 60,
        label: '1 hour'
      },
      {
        value: 90,
        label: '1 hour 30 minutes'
      }
    ] as const;

  protected readonly bufferOptions =
    [
      {
        value: 0,
        label: 'No buffer'
      },
      {
        value: 15,
        label: '15 minutes'
      },
      {
        value: 30,
        label: '30 minutes'
      },
      {
        value: 45,
        label: '45 minutes'
      },
      {
        value: 60,
        label: '1 hour'
      }
    ] as const;

  protected readonly timeZoneOptions =
    [
      {
        value: 'America/New_York',
        label: 'Eastern Time'
      },
      {
        value: 'America/Chicago',
        label: 'Central Time'
      },
      {
        value: 'America/Denver',
        label: 'Mountain Time'
      },
      {
        value: 'America/Phoenix',
        label: 'Arizona Time'
      },
      {
        value: 'America/Los_Angeles',
        label: 'Pacific Time'
      },
      {
        value: 'America/Anchorage',
        label: 'Alaska Time'
      },
      {
        value: 'Pacific/Honolulu',
        label: 'Hawaii Time'
      }
    ] as const;

  protected readonly availability =
    signal<ShowingAvailability | null>(
      null
    );

  protected readonly isLoading =
    signal(true);

  protected readonly isSaving =
    signal(false);

  protected readonly hasChanges =
    signal(false);

  protected readonly pageError =
    signal<string | null>(null);

  protected readonly saveMessage =
    signal<string | null>(null);

  protected readonly unavailableDate =
    signal('');

  protected readonly listingUid =
    this.route.snapshot.paramMap.get(
      'listingUid'
    ) ?? '';

  async ngOnInit(): Promise<void> {
    const sellerUid =
      this.authService.currentUserUid;

    if (!this.listingUid) {
      this.pageError.set(
        'The selected listing could not be identified.'
      );

      this.isLoading.set(false);
      return;
    }

    if (!sellerUid) {
      this.pageError.set(
        'You must be signed in to manage showing availability.'
      );

      this.isLoading.set(false);
      return;
    }

    try {
      let availability =
        await firstValueFrom(
          this.showingService.getAvailability(
            this.listingUid
          )
        );

      if (!availability) {
        await this.showingService
          .createDefaultAvailability(
            this.listingUid,
            sellerUid
          );

        availability =
          await firstValueFrom(
            this.showingService.getAvailability(
              this.listingUid
            )
          );
      }

      if (!availability) {
        throw new Error(
          'Showing availability could not be created.'
        );
      }

      if (
        availability.sellerUid !==
        sellerUid
      ) {
        throw new Error(
          'You do not have permission to manage this listing.'
        );
      }

      this.availability.set(
        this.cloneAvailability(
          availability
        )
      );
    } catch (error: unknown) {
      console.error(
        'Unable to load showing availability:',
        error
      );

      this.pageError.set(
        'We could not load the showing schedule. Please try again.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  protected setAcceptingRequests(
    event: Event
  ): void {
    const checked =
      this.getCheckboxValue(event);

    this.updateAvailability(
      current => ({
        ...current,
        acceptingRequests: checked
      })
    );
  }

  protected setTimeZone(
    event: Event
  ): void {
    const timeZone =
      this.getInputValue(event);

    this.updateAvailability(
      current => ({
        ...current,
        timeZone
      })
    );
  }

  protected setAppointmentDuration(
    event: Event
  ): void {
    const appointmentDurationMinutes =
      this.getNumericValue(event);

    this.updateAvailability(
      current => ({
        ...current,
        appointmentDurationMinutes
      })
    );
  }

  protected setBufferMinutes(
    event: Event
  ): void {
    const bufferMinutes =
      this.getNumericValue(event);

    this.updateAvailability(
      current => ({
        ...current,
        bufferMinutes
      })
    );
  }

  protected setMinimumNoticeHours(
    event: Event
  ): void {
    const minimumNoticeHours =
      Math.max(
        this.getNumericValue(event),
        0
      );

    this.updateAvailability(
      current => ({
        ...current,
        minimumNoticeHours
      })
    );
  }

  protected setBookingWindowDays(
    event: Event
  ): void {
    const bookingWindowDays =
      Math.max(
        this.getNumericValue(event),
        1
      );

    this.updateAvailability(
      current => ({
        ...current,
        bookingWindowDays
      })
    );
  }

  protected toggleDay(
    dayOfWeek: ShowingDayOfWeek
  ): void {
    this.updateAvailability(
      current => ({
        ...current,

        weeklyAvailability:
          current.weeklyAvailability.map(
            day => {
              if (
                day.dayOfWeek !==
                dayOfWeek
              ) {
                return day;
              }

              const enabled =
                !day.enabled;

              return {
                ...day,
                enabled,

                timeWindows:
                  enabled &&
                  day.timeWindows.length === 0
                    ? [
                        {
                          startTime: '09:00',
                          endTime: '17:00'
                        }
                      ]
                    : day.timeWindows
              };
            }
          )
      })
    );
  }

  protected addTimeWindow(
    dayOfWeek: ShowingDayOfWeek
  ): void {
    this.updateAvailability(
      current => ({
        ...current,

        weeklyAvailability:
          current.weeklyAvailability.map(
            day =>
              day.dayOfWeek ===
              dayOfWeek
                ? {
                    ...day,

                    enabled: true,

                    timeWindows: [
                      ...day.timeWindows,
                      {
                        startTime: '09:00',
                        endTime: '17:00'
                      }
                    ]
                  }
                : day
          )
      })
    );
  }

  protected removeTimeWindow(
    dayOfWeek: ShowingDayOfWeek,
    timeWindowIndex: number
  ): void {
    this.updateAvailability(
      current => ({
        ...current,

        weeklyAvailability:
          current.weeklyAvailability.map(
            day => {
              if (
                day.dayOfWeek !==
                dayOfWeek
              ) {
                return day;
              }

              const timeWindows =
                day.timeWindows.filter(
                  (
                    _timeWindow,
                    index
                  ) =>
                    index !==
                    timeWindowIndex
                );

              return {
                ...day,
                enabled:
                  timeWindows.length > 0
                    ? day.enabled
                    : false,
                timeWindows
              };
            }
          )
      })
    );
  }

  protected updateTimeWindow(
    dayOfWeek: ShowingDayOfWeek,
    timeWindowIndex: number,
    field:
      | 'startTime'
      | 'endTime',
    event: Event
  ): void {
    const value =
      this.getInputValue(event);

    this.updateAvailability(
      current => ({
        ...current,

        weeklyAvailability:
          current.weeklyAvailability.map(
            day => {
              if (
                day.dayOfWeek !==
                dayOfWeek
              ) {
                return day;
              }

              return {
                ...day,

                timeWindows:
                  day.timeWindows.map(
                    (
                      timeWindow,
                      index
                    ) =>
                      index ===
                      timeWindowIndex
                        ? {
                            ...timeWindow,
                            [field]: value
                          }
                        : timeWindow
                  )
              };
            }
          )
      })
    );
  }

  protected setUnavailableDate(
    event: Event
  ): void {
    this.unavailableDate.set(
      this.getInputValue(event)
    );
  }

  protected addUnavailableDate(): void {
    const date =
      this.unavailableDate();

    if (!date) {
      return;
    }

    this.updateAvailability(
      current => {
        const existingException =
          current.exceptions.some(
            exception =>
              exception.date === date
          );

        if (existingException) {
          return current;
        }

        const exception:
          ShowingAvailabilityException = {
            date,
            unavailable: true,
            timeWindows: []
          };

        return {
          ...current,

          exceptions: [
            ...current.exceptions,
            exception
          ].sort(
            (
              firstException,
              secondException
            ) =>
              firstException.date.localeCompare(
                secondException.date
              )
          )
        };
      }
    );

    this.unavailableDate.set('');
  }

  protected removeUnavailableDate(
    date: string
  ): void {
    this.updateAvailability(
      current => ({
        ...current,

        exceptions:
          current.exceptions.filter(
            exception =>
              exception.date !== date
          )
      })
    );
  }

  protected getDayLabel(
    dayOfWeek: ShowingDayOfWeek
  ): string {
    return (
      this.dayOptions.find(
        day =>
          day.value === dayOfWeek
      )?.label ?? dayOfWeek
    );
  }

  protected formatUnavailableDate(
    date: string
  ): string {
    const [year, month, day] =
      date.split('-').map(Number);

    return new Intl.DateTimeFormat(
      'en-US',
      {
        weekday: 'short',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }
    ).format(
      new Date(
        Date.UTC(
          year,
          month - 1,
          day,
          12
        )
      )
    );
  }

  protected async saveAvailability():
    Promise<void> {
    const currentAvailability =
      this.availability();

    const sellerUid =
      this.authService.currentUserUid;

    if (
      !currentAvailability ||
      !sellerUid ||
      this.isSaving()
    ) {
      return;
    }

    this.isSaving.set(true);
    this.pageError.set(null);
    this.saveMessage.set(null);

    try {
      await this.showingService
        .updateAvailability(
          this.listingUid,
          sellerUid,
          {
            acceptingRequests:
              currentAvailability
                .acceptingRequests,

            timeZone:
              currentAvailability.timeZone,

            appointmentDurationMinutes:
              currentAvailability
                .appointmentDurationMinutes,

            bufferMinutes:
              currentAvailability
                .bufferMinutes,

            minimumNoticeHours:
              currentAvailability
                .minimumNoticeHours,

            bookingWindowDays:
              currentAvailability
                .bookingWindowDays,

            weeklyAvailability:
              currentAvailability
                .weeklyAvailability,

            exceptions:
              currentAvailability.exceptions
          }
        );

      this.hasChanges.set(false);

      this.saveMessage.set(
        'Showing availability saved.'
      );
    } catch (error: unknown) {
      console.error(
        'Unable to save showing availability:',
        error
      );

      this.pageError.set(
        error instanceof Error
          ? error.message
          : 'We could not save the showing schedule. Please try again.'
      );
    } finally {
      this.isSaving.set(false);
    }
  }

 protected async returnToListing():
  Promise<void> {
  await this.router.navigate([
    '/sell/listings',
    this.listingUid,
    'manage'
  ]);
}

  private updateAvailability(
    update: (
      current: ShowingAvailability
    ) => ShowingAvailability
  ): void {
    const current =
      this.availability();

    if (!current) {
      return;
    }

    this.availability.set(
      update(current)
    );

    this.hasChanges.set(true);
    this.saveMessage.set(null);
    this.pageError.set(null);
  }

  private cloneAvailability(
    availability: ShowingAvailability
  ): ShowingAvailability {
    return {
      ...availability,

      weeklyAvailability:
        availability.weeklyAvailability.map(
          day => ({
            ...day,

            timeWindows:
              day.timeWindows.map(
                timeWindow => ({
                  ...timeWindow
                })
              )
          })
        ),

      exceptions:
        availability.exceptions.map(
          exception => ({
            ...exception,

            timeWindows:
              exception.timeWindows.map(
                timeWindow => ({
                  ...timeWindow
                })
              )
          })
        )
    };
  }

  private getInputValue(
    event: Event
  ): string {
    return (
      event.target as HTMLInputElement
    ).value;
  }

  private getCheckboxValue(
    event: Event
  ): boolean {
    return (
      event.target as HTMLInputElement
    ).checked;
  }

  private getNumericValue(
    event: Event
  ): number {
    return Number(
      this.getInputValue(event)
    );
  }
}