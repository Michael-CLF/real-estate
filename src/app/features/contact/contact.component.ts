import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';

import {
  ActivatedRoute
} from '@angular/router';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  toSignal
} from '@angular/core/rxjs-interop';

import {
  map
} from 'rxjs';

import {
  AnalyticsDataLayerService
} from '../../core/analytics/analytics-data-layer.service';

import {
  ContactInquiryService
} from '../../core/domains/contact/services/contact-inquiry.service';

interface ContactInterest {
  label: string;
  value: string;
}

@Component({
  changeDetection:
    ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule
  ],
  selector:
    'app-contact',
  standalone:
    true,
  styleUrl:
    './contact.component.scss',
  templateUrl:
    './contact.component.html'
})
export class ContactComponent {
  private readonly route =
    inject(ActivatedRoute);

  private readonly formBuilder =
    inject(FormBuilder);

  private readonly analytics =
    inject(
      AnalyticsDataLayerService
    );

  private readonly contactInquiryService =
    inject(ContactInquiryService);

  private readonly hasTrackedFormStart =
    signal(false);

  readonly selectedState =
    toSignal(
      this.route.queryParamMap.pipe(
        map(
          parameters =>
            parameters.get(
              'state'
            ) ?? ''
        )
      ),
      {
        initialValue: ''
      }
    );

  readonly interest =
    toSignal(
      this.route.queryParamMap.pipe(
        map(
          parameters =>
            parameters.get(
              'interest'
            ) ?? ''
        )
      ),
      {
        initialValue: ''
      }
    );

  readonly pageTitle =
    computed(
      () =>
        this.selectedState()
          ? `Contact Us About ${this.selectedState()}`
          : 'Contact Us'
    );

  readonly interestOptions:
    readonly ContactInterest[] = [
      {
        label:
          'Buying a home',
        value:
          'buying'
      },
      {
        label:
          'Selling a home',
        value:
          'selling'
      },
      {
        label:
          'Mortgage financing',
        value:
          'financing'
      },
      {
        label:
          'Professional partnership',
        value:
          'professional-partner'
      },
      {
        label:
          'Business expansion',
        value:
          'business-expansion'
      },
      {
        label:
          'State launch updates',
        value:
          'state-launch'
      },
      {
        label:
          'General question',
        value:
          'general'
      },
      {
        label:
          'Other',
        value:
          'other'
      }
    ];

  readonly contactForm =
    this.formBuilder
      .nonNullable
      .group({
        email: [
          '',
          [
            Validators.required,
            Validators.email,
            Validators.maxLength(254)
          ]
        ],
        firstName: [
          '',
          [
            Validators.required,
            Validators.maxLength(100)
          ]
        ],
        interest: [
          'general',
          Validators.required
        ],
        lastName: [
          '',
          [
            Validators.required,
            Validators.maxLength(100)
          ]
        ],
        marketingConsent: [
          false
        ],
        message: [
          '',
          [
            Validators.required,
            Validators.minLength(10),
            Validators.maxLength(5000)
          ]
        ],
        phone: [
          '',
          [
            Validators.pattern(
              /^\(\d{3}\) \d{3}-\d{4}$/
            )
          ]
        ],
        state: [
          '',
          Validators.maxLength(100)
        ],
        /*
         * Honeypot field. Real users never
         * see or complete this field.
         */
        website: [
          ''
        ]
      });

  readonly isSubmitting =
    signal(false);

  readonly submitError =
    signal('');

  readonly wasSubmitted =
    signal(false);

  constructor() {
    effect(() => {
      const state =
        this.selectedState()
          .trim();

      const requestedInterest =
        this.interest()
          .trim();

      const validInterest =
        this.interestOptions.some(
          option =>
            option.value ===
            requestedInterest
        );

      this.contactForm.patchValue(
        {
          state,
          interest:
            validInterest
              ? requestedInterest
              : state
                ? 'state-launch'
                : 'general'
        },
        {
          emitEvent: false
        }
      );
    });
  }

  protected trackContactFormStarted():
    void {
    if (
      this.hasTrackedFormStart()
    ) {
      return;
    }

    this.hasTrackedFormStart.set(
      true
    );

    this.analytics.track(
      'contact_form_started',
      {
        lead_source:
          this.getLeadSource(),
        interest:
          this.contactForm.controls
            .interest.value,
        inquiry_state:
          this.contactForm.controls
            .state.value.trim() ||
          null
      }
    );
  }

  async submit():
    Promise<void> {
    this.submitError.set('');

    this.contactForm.markAllAsTouched();

    if (
      this.contactForm.invalid ||
      this.isSubmitting()
    ) {
      return;
    }

    this.isSubmitting.set(true);

    const formValue =
      this.contactForm
        .getRawValue();

    const leadSource =
      this.getLeadSource();

    const inquiryState =
      formValue.state.trim();

    try {
      const response =
        await this.contactInquiryService
          .submit({
            email:
              formValue.email.trim(),
            firstName:
              formValue.firstName.trim(),
            interest:
              formValue.interest,
            lastName:
              formValue.lastName.trim(),
            marketingConsent:
              formValue.marketingConsent,
            message:
              formValue.message.trim(),
            phone:
              formValue.phone.trim(),
            state:
              inquiryState,
            website:
              formValue.website.trim()
          });

      if (!response.accepted) {
        throw new Error(
          'The inquiry was not accepted.'
        );
      }

      /*
       * Do not record fake honeypot
       * submissions as Analytics leads.
       */
      if (
        !formValue.website.trim()
      ) {
        this.analytics.track(
          'generate_lead',
          {
            lead_source:
              leadSource,
            interest:
              formValue.interest,
            inquiry_state:
              inquiryState || null
          }
        );
      }

      this.wasSubmitted.set(true);

      this.contactForm.reset({
        email:
          '',
        firstName:
          '',
        interest:
          this.selectedState()
            ? 'state-launch'
            : 'general',
        lastName:
          '',
        marketingConsent:
          false,
        message:
          '',
        phone:
          '',
        state:
          this.selectedState(),
        website:
          ''
      });
    } catch (
      error: unknown
    ) {
      console.error(
        'Unable to submit contact inquiry:',
        error
      );

      this.analytics.track(
        'contact_form_error',
        {
          lead_source:
            leadSource,
          interest:
            formValue.interest,
          inquiry_state:
            inquiryState || null
        }
      );

      this.submitError.set(
        this.getErrorMessage(error)
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected formatPhoneNumber(
    event: Event
  ): void {
    const input =
      event.target as HTMLInputElement;

    const digits =
      input.value
        .replace(/\D/g, '')
        .slice(0, 10);

    let formattedValue =
      '';

    if (digits.length > 0) {
      formattedValue =
        `(${digits.slice(0, 3)}`;
    }

    if (digits.length >= 4) {
      formattedValue +=
        `) ${digits.slice(3, 6)}`;
    }

    if (digits.length >= 7) {
      formattedValue +=
        `-${digits.slice(6, 10)}`;
    }

    input.value =
      formattedValue;

    this.contactForm.controls
      .phone
      .setValue(
        formattedValue,
        {
          emitEvent: false
        }
      );
  }

  protected sendAnotherMessage():
    void {
    this.wasSubmitted.set(false);
    this.submitError.set('');
    this.hasTrackedFormStart.set(
      false
    );
  }

  private getLeadSource():
    string {
    return this.selectedState()
      ? 'state-page'
      : 'contact-page';
  }

  private getErrorMessage(
    error: unknown
  ): string {
    if (
      error !== null &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message ===
        'string'
    ) {
      const message =
        error.message.trim();

      if (message) {
        return message;
      }
    }

    return (
      'We could not send your message. Please try again.'
    );
  }
}