import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
  signal
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  firstValueFrom
} from 'rxjs';

import {
  AuthService
} from '../../../../../core/authentication/services/auth.service';

import {
  ShowingAvailability,
  ShowingReservedTime
} from '../../../../../core/domains/showings/models/showing-availability.model';

import {
  ShowingRequestedTime
} from '../../../../../core/domains/showings/models/showing-request.model';

import {
  AvailableShowingSlot,
  ShowingService
} from '../../../../../core/domains/showings/services/showing.service';

interface ShowingDateOption {
  date: string;
  dayLabel: string;
  dateLabel: string;
  monthLabel: string;
  fullLabel: string;
  slots: AvailableShowingSlot[];
}

@Component({
  selector: 'app-request-showing',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './request-showing.component.html',
  styleUrl: './request-showing.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class RequestShowingComponent
  implements OnInit {

  private readonly authService =
    inject(AuthService);

  private readonly showingService =
    inject(ShowingService);

  private readonly formBuilder =
    inject(FormBuilder);

  readonly listingUid =
    input.required<string>();

  readonly sellerUid =
    input.required<string>();

  readonly propertyAddress =
    input.required<string>();

  readonly propertyCity =
    input.required<string>();

  readonly propertyState =
    input.required<string>();

  readonly propertyZipCode =
    input.required<string>();

  readonly primaryPhotoUrl =
    input<string | null>(null);

  protected readonly requestForm =
    this.formBuilder.nonNullable.group({
      firstName: [
        '',
        [
          Validators.required,
          Validators.maxLength(60)
        ]
      ],

      lastName: [
        '',
        [
          Validators.required,
          Validators.maxLength(60)
        ]
      ],

      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.maxLength(160)
        ]
      ],

      phone: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^\(\d{3}\) \d{3}-\d{4}$/
          )
        ]
      ],

      buyerMessage: [
        '',
        [
          Validators.maxLength(1000)
        ]
      ]
    });

  protected readonly availability =
    signal<ShowingAvailability | null>(
      null
    );

  protected readonly dateOptions =
    signal<ShowingDateOption[]>([]);

  protected readonly selectedDate =
    signal<string | null>(null);

  protected readonly selectedSlot =
    signal<AvailableShowingSlot | null>(
      null
    );

  protected readonly isLoading =
    signal(true);

  protected readonly isSubmitting =
    signal(false);

  protected readonly loadError =
    signal<string | null>(null);

  protected readonly submitError =
    signal<string | null>(null);

  protected readonly requestSubmitted =
    signal(false);

  protected readonly submittedTime =
    signal<ShowingRequestedTime | null>(
      null
    );

  async ngOnInit(): Promise<void> {
    if (
      !this.listingUid() ||
      !this.sellerUid()
    ) {
      this.loadError.set(
        'This property is not currently available for online showing requests.'
      );

      this.isLoading.set(false);
      return;
    }

    try {
      const availability =
        await firstValueFrom(
          this.showingService.getAvailability(
            this.listingUid()
          )
        );

      if (
        !availability ||
        !availability.acceptingRequests
      ) {
        this.availability.set(
          availability
        );

        return;
      }

      this.availability.set(
        availability
      );

      const dateOptions =
        await this.buildDateOptions(
          availability
        );

      this.dateOptions.set(
        dateOptions
      );

      if (dateOptions.length > 0) {
        this.selectDate(
          dateOptions[0].date
        );
      }
    } catch (error: unknown) {
      console.error(
        'Unable to load showing availability:',
        error
      );

      this.loadError.set(
        'We could not load available showing times. Please try again.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  protected selectDate(
    date: string
  ): void {
    this.selectedDate.set(date);
    this.selectedSlot.set(null);
    this.submitError.set(null);
  }

  protected selectSlot(
    slot: AvailableShowingSlot
  ): void {
    this.selectedSlot.set(slot);
    this.submitError.set(null);
  }

  protected getSelectedDateOption():
    ShowingDateOption | null {
    const selectedDate =
      this.selectedDate();

    if (!selectedDate) {
      return null;
    }

    return (
      this.dateOptions().find(
        option =>
          option.date === selectedDate
      ) ?? null
    );
  }

  protected isSelectedSlot(
    slot: AvailableShowingSlot
  ): boolean {
    const selectedSlot =
      this.selectedSlot();

    return (
      selectedSlot?.date ===
        slot.date &&
      selectedSlot?.startTime ===
        slot.startTime &&
      selectedSlot?.endTime ===
        slot.endTime
    );
  }

  protected formatSlotTime(
    time: string
  ): string {
    const [hoursValue, minutes] =
      time.split(':').map(Number);

    const period =
      hoursValue >= 12
        ? 'PM'
        : 'AM';

    const hours =
      hoursValue % 12 || 12;

    return `${hours}:${minutes
      .toString()
      .padStart(2, '0')} ${period}`;
  }

  protected async submitRequest():
    Promise<void> {
    if (
      this.isSubmitting() ||
      this.requestSubmitted()
    ) {
      return;
    }

    this.requestForm.markAllAsTouched();

    if (this.requestForm.invalid) {
      this.submitError.set(
        'Please complete all required contact information.'
      );

      return;
    }

    const selectedSlot =
      this.selectedSlot();

    if (!selectedSlot) {
      this.submitError.set(
        'Please select an available showing time.'
      );

      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);

    const formValue =
      this.requestForm.getRawValue();

    try {
      await this.showingService
        .createShowingRequest({
          listingUid:
            this.listingUid(),

          sellerUid:
            this.sellerUid(),

          buyerUid:
            this.authService.currentUserUid,

          propertyAddress:
            this.propertyAddress(),

          propertyCity:
            this.propertyCity(),

          propertyState:
            this.propertyState(),

          propertyZipCode:
            this.propertyZipCode(),

          primaryPhotoUrl:
            this.primaryPhotoUrl(),

          buyerContact: {
            firstName:
              formValue.firstName.trim(),

            lastName:
              formValue.lastName.trim(),

            email:
              formValue.email
                .trim()
                .toLowerCase(),

            phone:
              formValue.phone.trim()
          },

          requestedTime: {
            date:
              selectedSlot.date,

            startTime:
              selectedSlot.startTime,

            endTime:
              selectedSlot.endTime,

            timeZone:
              selectedSlot.timeZone
          },

          buyerMessage:
            formValue.buyerMessage.trim()
        });

      this.submittedTime.set({
        date:
          selectedSlot.date,

        startTime:
          selectedSlot.startTime,

        endTime:
          selectedSlot.endTime,

        timeZone:
          selectedSlot.timeZone
      });

      this.requestSubmitted.set(true);
    } catch (error: unknown) {
      console.error(
        'Unable to submit showing request:',
        error
      );

      const errorMessage =
        error instanceof Error
          ? error.message
          : '';

      if (
        errorMessage.includes(
          'no longer available'
        )
      ) {
        this.submitError.set(
          'That time was just reserved by another buyer. Please select another available time.'
        );

        await this.reloadAvailableDates();
      } else {
        this.submitError.set(
          'We could not submit your showing request. Please try again.'
        );
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }


  protected formatPhoneNumber(
    event: Event
  ): void {
    const inputElement =
      event.target as HTMLInputElement;

    const digits =
      inputElement.value
        .replace(/\D/g, '')
        .slice(0, 10);

    let formattedValue = digits;

    if (digits.length > 6) {
      formattedValue =
        `(${digits.slice(0, 3)}) ` +
        `${digits.slice(3, 6)}-` +
        digits.slice(6);
    } else if (digits.length > 3) {
      formattedValue =
        `(${digits.slice(0, 3)}) ` +
        digits.slice(3);
    }

    this.requestForm.controls.phone.setValue(
      formattedValue,
      {
        emitEvent: false
      }
    );

    inputElement.value =
      formattedValue;
  }

  protected formatSubmittedDate(
    date: string
  ): string {
    const parsedDate =
      this.createLocalDate(date);

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

  private async reloadAvailableDates():
    Promise<void> {
    const availability =
      this.availability();

    if (!availability) {
      return;
    }

    const dateOptions =
      await this.buildDateOptions(
        availability
      );

    this.dateOptions.set(
      dateOptions
    );

    this.selectedSlot.set(null);

    const selectedDateStillAvailable =
      dateOptions.some(
        option =>
          option.date ===
          this.selectedDate()
      );

    if (!selectedDateStillAvailable) {
      this.selectedDate.set(
        dateOptions[0]?.date ?? null
      );
    }
  }

  private async buildDateOptions(
    availability: ShowingAvailability
  ): Promise<ShowingDateOption[]> {
    const candidateDates =
      this.createCandidateDates(
        availability.bookingWindowDays
      );

    const possibleDates =
      candidateDates.filter(
        date =>
          this.showingService
            .getAvailableSlotsForDate(
              date,
              availability,
              []
            )
            .some(
              slot =>
                this.meetsMinimumNotice(
                  slot,
                  availability
                    .minimumNoticeHours
                )
            )
      );

    /*
     * Show up to seven upcoming dates. Only dates that
     * have regular availability are queried for reserved
     * times, which limits unnecessary Firestore reads.
     */
    const datesToLoad =
      possibleDates.slice(0, 7);

    const options =
      await Promise.all(
        datesToLoad.map(
          async date => {
            const reservedTimes =
              await firstValueFrom(
                this.showingService
                  .getReservedTimesForDate(
                    this.listingUid(),
                    date
                  )
              );

            const slots =
              this.showingService
                .getAvailableSlotsForDate(
                  date,
                  availability,
                  []
                )
                .filter(
                  slot =>
                    this.meetsMinimumNotice(
                      slot,
                      availability
                        .minimumNoticeHours
                    )
                )
                .filter(
                  slot =>
                    !this.hasReservedConflict(
                      slot,
                      reservedTimes
                    )
                );

            return this.createDateOption(
              date,
              slots
            );
          }
        )
      );

    return options.filter(
      option =>
        option.slots.length > 0
    );
  }

  private createCandidateDates(
    bookingWindowDays: number
  ): string[] {
    const dates: string[] = [];

    const today = new Date();

    today.setHours(
      12,
      0,
      0,
      0
    );

    for (
      let dayOffset = 0;
      dayOffset <= bookingWindowDays;
      dayOffset += 1
    ) {
      const date = new Date(today);

      date.setDate(
        today.getDate() + dayOffset
      );

      dates.push(
        this.formatDateValue(date)
      );
    }

    return dates;
  }

  private createDateOption(
    date: string,
    slots: AvailableShowingSlot[]
  ): ShowingDateOption {
    const parsedDate =
      this.createLocalDate(date);

    return {
      date,

      dayLabel:
        new Intl.DateTimeFormat(
          'en-US',
          {
            weekday: 'short'
          }
        )
          .format(parsedDate)
          .toUpperCase(),

      dateLabel:
        new Intl.DateTimeFormat(
          'en-US',
          {
            day: 'numeric'
          }
        ).format(parsedDate),

      monthLabel:
        new Intl.DateTimeFormat(
          'en-US',
          {
            month: 'short'
          }
        )
          .format(parsedDate)
          .toUpperCase(),

      fullLabel:
        new Intl.DateTimeFormat(
          'en-US',
          {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          }
        ).format(parsedDate),

      slots
    };
  }

  private meetsMinimumNotice(
    slot: AvailableShowingSlot,
    minimumNoticeHours: number
  ): boolean {
    const slotDate =
      this.createLocalDate(
        slot.date
      );

    const [hours, minutes] =
      slot.startTime
        .split(':')
        .map(Number);

    slotDate.setHours(
      hours,
      minutes,
      0,
      0
    );

    const earliestAllowedTime =
      Date.now() +
      minimumNoticeHours *
        60 *
        60 *
        1000;

    return (
      slotDate.getTime() >=
      earliestAllowedTime
    );
  }

  private hasReservedConflict(
    slot: AvailableShowingSlot,
    reservedTimes:
      ShowingReservedTime[]
  ): boolean {
    const slotStart =
      this.timeToMinutes(
        slot.startTime
      );

    const slotEnd =
      this.timeToMinutes(
        slot.endTime
      );

    return reservedTimes.some(
      reservation => {
        if (
          reservation.date !==
          slot.date
        ) {
          return false;
        }

        const reservedStart =
          this.timeToMinutes(
            reservation.startTime
          );

        const reservedEnd =
          this.timeToMinutes(
            reservation.endTime
          );

        return (
          slotStart < reservedEnd &&
          slotEnd > reservedStart
        );
      }
    );
  }

  private timeToMinutes(
    time: string
  ): number {
    const [hours, minutes] =
      time.split(':').map(Number);

    return hours * 60 + minutes;
  }

  private formatDateValue(
    date: Date
  ): string {
    const year =
      date.getFullYear();

    const month =
      (date.getMonth() + 1)
        .toString()
        .padStart(2, '0');

    const day =
      date.getDate()
        .toString()
        .padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private createLocalDate(
    date: string
  ): Date {
    const [year, month, day] =
      date.split('-').map(Number);

    return new Date(
      year,
      month - 1,
      day,
      12,
      0,
      0,
      0
    );
  }
}