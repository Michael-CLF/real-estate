import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  httpsCallable
} from 'firebase/functions';

import {
  functions
} from '../../../../core/infrastructure/firebase/firebase';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  ActivatedRoute,
  RouterLink
} from '@angular/router';
import {
  toSignal
} from '@angular/core/rxjs-interop';
import {
  map
} from 'rxjs';

import {
  PROFESSIONAL_CATEGORY_LABELS,
  PROFESSIONAL_TYPE_LABELS,
  ProfessionalCategory,
  ProfessionalType
} from '../../../../core/domains/users/models/professional-type';

import {
  ProfessionalServiceAreaType,
  ProfessionalSubscriptionStatus
} from '../../../../core/domains/users/models/professional-user.model';

import {
  OtpService
} from '../../../../core/authentication/services/otp.service';

import {
  AuthService
} from '../../../../core/authentication/services/auth.service';

import {
  AccountState
} from '../../../../core/authentication/state/account.state';

import {
  FirebaseUserRepository
} from '../../../../core/infrastructure/firebase/firebase-user.repository';

import {
  FirebaseProfessionalRepository
} from '../../../../core/infrastructure/firebase/firebase-professional.repository';

interface PendingProfessionalRegistration {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  businessName: string;

  category: ProfessionalCategory;
  professionalType: ProfessionalType;

  specialties: string[];

  stateName: string;
  stateAbbreviation: string;
  stateSlug: string;

  serviceAreaType:
  ProfessionalServiceAreaType;

  serviceAreas: string[];

  subscriptionStatus:
  ProfessionalSubscriptionStatus;

  submissionCertified: true;
}

interface ProfessionalCategoryOption {
  value: ProfessionalCategory;
  label: string;
}

interface ProfessionalTypeOption {
  value: ProfessionalType;
  label: string;
}

interface ProfessionalProfileCheckoutResult {
  checkoutSessionId: string;
  checkoutUrl: string;
}

const CATEGORY_TYPES:
  Readonly<
    Record<
      ProfessionalCategory,
      ReadonlyArray<ProfessionalType>
    >
  > = {
  financing: [
    'bank',
    'credit_union',
    'mortgage_lender',
    'mortgage_broker',
    'construction_lender'
  ],

  legal: [
    'real_estate_attorney',
    'closing_attorney'
  ],

  title_and_closing: [
    'title_company',
    'escrow_company',
    'settlement_company',
    'mobile_notary',
    'qualified_intermediary'
  ],

  inspections: [
    'home_inspector',
    'pest_inspector',
    'environmental_inspector',
    'structural_engineer'
  ],

  property_and_valuation: [
    'independent_appraiser',
    'land_surveyor',
    'property_tax_consultant'
  ],

  home_preparation: [
    'real_estate_photographer',
    'floor_plan_service',
    'home_stager',
    'general_contractor',
    'painter',
    'handyman',
    'cleaning_company',
    'landscaper',
    'junk_removal_company',
    'locksmith'
  ],

  insurance_and_protection: [
    'insurance_agency',
    'flood_insurance_specialist',
    'home_warranty_company'
  ],

  moving_and_storage: [
    'moving_company',
    'packing_service',
    'storage_facility'
  ]
};

const CATEGORY_SPECIALTIES:
  Readonly<
    Record<
      ProfessionalCategory,
      ReadonlyArray<string>
    >
  > = {
  financing: [
    'Conventional mortgages',
    'First-time homebuyers',
    'Government lending',
    'Jumbo financing',
    'Construction loans',
    'Renovation financing',
    'Investment properties',
    'Self-employed borrowers'
  ],

  legal: [
    'Residential closings',
    'Contract review',
    'Seller representation',
    'Buyer representation',
    'Title matters',
    'Estate property sales',
    'Boundary disputes',
    'Foreclosure matters'
  ],

  title_and_closing: [
    'Title searches',
    'Title insurance',
    'Closing coordination',
    'Escrow services',
    'Remote closing support',
    'Document preparation',
    'Mobile notarization',
    '1031 exchanges'
  ],

  inspections: [
    'Pre-purchase inspections',
    'Pre-listing inspections',
    'New-construction inspections',
    'Termite inspections',
    'Radon testing',
    'Mold inspections',
    'Septic inspections',
    'Well and water testing',
    'Pool inspections',
    'Roof inspections',
    'Chimney inspections',
    'Structural evaluations',
    'Environmental testing'
  ],

  property_and_valuation: [
    'Pre-listing valuations',
    'Private-use appraisals',
    'Estate valuations',
    'Tax-appeal valuations',
    'Boundary surveys',
    'Closing surveys',
    'Elevation certificates',
    'Property tax consulting'
  ],

  home_preparation: [
    'Listing photography',
    'Floor plans',
    'Property measurements',
    'Home staging',
    'Pre-listing consultations',
    'Painting',
    'General repairs',
    'Cleaning',
    'Landscaping',
    'Junk removal',
    'Lock changes'
  ],

  insurance_and_protection: [
    'Homeowners insurance',
    'Flood insurance',
    'Landlord policies',
    'Vacant-home coverage',
    'Investment property coverage',
    'Home warranties'
  ],

  moving_and_storage: [
    'Local residential moves',
    'Long-distance moves',
    'Packing services',
    'Unpacking services',
    'Climate-controlled storage',
    'Short-term storage',
    'Moving supplies'
  ]
};

@Component({
  selector: 'app-professional-registration',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl:
    './professional-registration.component.html',
  styleUrl:
    './professional-registration.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class ProfessionalRegistrationComponent
  implements OnDestroy {

  private readonly route =
    inject(ActivatedRoute);

  private readonly formBuilder =
    inject(FormBuilder);

  private readonly otpService =
    inject(OtpService);

  private readonly authService =
    inject(AuthService);

  private readonly accountState =
    inject(AccountState);

  private readonly userRepository =
    inject(FirebaseUserRepository);

  private readonly professionalRepository =
    inject(FirebaseProfessionalRepository);

  protected readonly selectedCategory =
    signal<ProfessionalCategory | null>(
      null
    );
  protected readonly otpStep =
    signal(false);

  protected readonly verificationComplete =
    signal(false);

  protected readonly errorMessage =
    signal('');

  protected readonly successMessage =
    signal('');

  protected readonly pendingRegistration =
    signal<
      PendingProfessionalRegistration | null
    >(null);

  protected readonly stateSlug =
    toSignal(
      this.route.paramMap.pipe(
        map(
          parameters =>
            parameters.get('stateSlug') ??
            'north-carolina'
        )
      ),
      {
        initialValue: 'north-carolina'
      }
    );

  protected readonly stateName =
    computed(() => {
      switch (this.stateSlug()) {
        case 'north-carolina':
          return 'North Carolina';

        default:
          return this.stateSlug()
            .split('-')
            .map(
              word =>
                word.charAt(0).toUpperCase() +
                word.slice(1)
            )
            .join(' ');
      }
    });

  protected readonly isSupportedState =
    computed(
      () =>
        this.stateSlug() ===
        'north-carolina'
    );

  protected readonly categoryOptions:
    ReadonlyArray<ProfessionalCategoryOption> =
    Object.entries(
      PROFESSIONAL_CATEGORY_LABELS
    ).map(
      ([value, label]) => ({
        value:
          value as ProfessionalCategory,
        label
      })
    );

  protected readonly professionalTypeOptions =
    computed<
      ReadonlyArray<ProfessionalTypeOption>
    >(() => {
      const category =
        this.selectedCategory();

      if (!category) {
        return [];
      }

      return CATEGORY_TYPES[category].map(
        value => ({
          value,
          label:
            PROFESSIONAL_TYPE_LABELS[value]
        })
      );
    });

  protected readonly specialtyOptions =
    computed<ReadonlyArray<string>>(
      () => {
        const category =
          this.selectedCategory();

        return category
          ? CATEGORY_SPECIALTIES[category]
          : [];
      }
    );

  protected readonly registrationForm =
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
          Validators.maxLength(254)
        ]
      ],

      businessName: [
        '',
        [
          Validators.required,
          Validators.maxLength(120)
        ]
      ],

      category:
        this.formBuilder.nonNullable.control<
          ProfessionalCategory | ''
        >(
          '',
          {
            validators: [
              Validators.required
            ]
          }
        ),

      professionalType:
        this.formBuilder.nonNullable.control<
          ProfessionalType | ''
        >(
          '',
          {
            validators: [
              Validators.required
            ]
          }
        ),

      specialties:
        this.formBuilder.nonNullable.control<
          string[]
        >(
          [],
          {
            validators: [
              Validators.required
            ]
          }
        ),

      phone: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^\(\d{3}\) \d{3}-\d{4}$/
          )
        ]
      ],

      serviceAreaType:
        this.formBuilder.nonNullable.control<
          ProfessionalServiceAreaType
        >(
          'statewide',
          {
            validators: [
              Validators.required
            ]
          }
        ),

      serviceAreas: [
        '',
        [
          Validators.maxLength(500)
        ]
      ],

      subscriptionStatus:
        this.formBuilder.nonNullable.control<
          ProfessionalSubscriptionStatus
        >(
          'free',
          {
            validators: [
              Validators.required
            ]
          }
        ),

      submissionCertified: [
        false,
        [
          Validators.requiredTrue
        ]
      ]
    });

  protected readonly otpForm =
    this.formBuilder.nonNullable.group({
      code: [
        '',
        [
          Validators.required,
          Validators.pattern(/^\d{6}$/)
        ]
      ]
    });

  protected readonly isOtpLoading =
    this.otpService.isLoading;

  protected readonly attemptsRemaining =
    this.otpService.attemptsRemaining;

  protected readonly formattedTimeRemaining =
    this.otpService.formattedTimeRemaining;

  protected readonly formattedResendRemaining =
    this.otpService.formattedResendRemaining;

  protected readonly canResend =
    this.otpService.canResend;

  protected readonly isExpired =
    this.otpService.isExpired;

  protected onCategoryChange(
    event: Event
  ): void {
    const select =
      event.target as HTMLSelectElement;

    const category =
      select.value as ProfessionalCategory;

    this.selectedCategory.set(
      category || null
    );

    this.registrationForm.controls
      .professionalType
      .setValue('');

    this.registrationForm.controls
      .specialties
      .setValue([]);
  }

  protected toggleSpecialty(
    specialty: string,
    checked: boolean
  ): void {
    const control =
      this.registrationForm.controls
        .specialties;

    const selectedSpecialties = [
      ...control.value
    ];

    if (
      checked &&
      !selectedSpecialties.includes(
        specialty
      )
    ) {
      selectedSpecialties.push(specialty);
    }

    if (!checked) {
      const specialtyIndex =
        selectedSpecialties.indexOf(
          specialty
        );

      if (specialtyIndex >= 0) {
        selectedSpecialties.splice(
          specialtyIndex,
          1
        );
      }
    }

    control.setValue(
      selectedSpecialties
    );

    control.markAsTouched();
    control.markAsDirty();
  }

  protected isSpecialtySelected(
    specialty: string
  ): boolean {
    return this.registrationForm.controls
      .specialties
      .value
      .includes(specialty);
  }

  protected onServiceAreaChange(): void {
    const serviceAreaType =
      this.registrationForm.controls
        .serviceAreaType
        .value;

    const serviceAreasControl =
      this.registrationForm.controls
        .serviceAreas;

    if (
      serviceAreaType === 'statewide'
    ) {
      serviceAreasControl.setValue('');
      serviceAreasControl.clearValidators();
    } else {
      serviceAreasControl.setValidators([
        Validators.required,
        Validators.maxLength(500)
      ]);
    }

    serviceAreasControl
      .updateValueAndValidity();
  }


  protected async prepareRegistration():
    Promise<void> {
    if (
      this.registrationForm.invalid ||
      this.isOtpLoading()
    ) {
      this.registrationForm
        .markAllAsTouched();

      this.focusFirstInvalidControl();

      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const values =
        this.registrationForm.getRawValue();

      if (
        !values.category ||
        !values.professionalType
      ) {
        throw new Error(
          'Select a professional category and type.'
        );
      }

      const pendingRegistration:
        PendingProfessionalRegistration = {
        firstName:
          values.firstName.trim(),

        lastName:
          values.lastName.trim(),

        email:
          values.email
            .trim()
            .toLowerCase(),

        phone:
          values.phone.replace(/\D/g, ''),

        businessName:
          values.businessName.trim(),

        category:
          values.category,

        professionalType:
          values.professionalType,

        specialties: [
          ...values.specialties
        ],

        stateName:
          this.stateName(),

        stateAbbreviation: 'NC',

        stateSlug:
          this.stateSlug(),

        serviceAreaType:
          values.serviceAreaType,

        serviceAreas:
          values.serviceAreaType ===
            'statewide'
            ? []
            : values.serviceAreas
              .split(',')
              .map(
                serviceArea =>
                  serviceArea.trim()
              )
              .filter(Boolean),

        subscriptionStatus:
          values.subscriptionStatus,

        submissionCertified: true
      };

      this.pendingRegistration.set(
        pendingRegistration
      );

      sessionStorage.setItem(
        'pendingProfessionalRegistration',
        JSON.stringify(
          pendingRegistration
        )
      );

      this.otpService.clearError();

      await this.otpService.sendOtp(
        pendingRegistration.email
      );

      this.otpStep.set(true);

      this.successMessage.set(
        `We sent a six-digit verification ` +
        `code to ${pendingRegistration.email}.`
      );

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } catch (error) {
      console.error(
        'Unable to begin professional registration:',
        error
      );

      this.errorMessage.set(
        this.getErrorMessage(
          error,
          'We could not send the verification code.'
        )
      );
    }
  }

  protected formatPhoneNumber(
    event: Event
  ): void {
    const input =
      event.target as HTMLInputElement;

    const digits = input.value
      .replace(/\D/g, '')
      .slice(0, 10);

    let formattedValue = '';

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

    this.registrationForm.controls
      .phone
      .setValue(
        formattedValue,
        {
          emitEvent: false
        }
      );

    input.value = formattedValue;
  }

  protected formatOtpCode(
    event: Event
  ): void {
    const input =
      event.target as HTMLInputElement;

    const code = input.value
      .replace(/\D/g, '')
      .slice(0, 6);

    this.otpForm.controls.code.setValue(
      code,
      {
        emitEvent: false
      }
    );

    input.value = code;
  }

  protected async verifyCode():
    Promise<void> {
    const pendingRegistration =
      this.pendingRegistration();

    if (
      this.otpForm.invalid ||
      this.isOtpLoading() ||
      !pendingRegistration
    ) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const code =
        this.otpForm.controls.code.value;

      await this.otpService.verifyOtp(
        pendingRegistration.email,
        code
      );

      const firebaseUser =
        this.authService.currentUser;

      if (!firebaseUser) {
        throw new Error(
          'Authentication succeeded but no Firebase user was found.'
        );
      }

      if (
        firebaseUser.email
          ?.trim()
          .toLowerCase() !==
        pendingRegistration.email
      ) {
        throw new Error(
          'The authenticated email does not match the professional registration email.'
        );
      }

      const existingUser =
        await this.userRepository.getById(
          firebaseUser.uid
        );

      if (!existingUser) {
        await this.createUserProfile(
          firebaseUser.uid,
          pendingRegistration
        );
      } else {
        await this.userRepository.update(
          firebaseUser.uid,
          {
            emailVerified: true,
            lastLoginAt: new Date(),
            updatedAt: new Date()
          }
        );
      }

      await this.accountState.refresh();

      if (!this.accountState.isActive()) {
        throw new Error(
          'Your NavStreet account could not be activated.'
        );
      }

      const existingProfessional =
        await this.professionalRepository
          .getProfessionalByOwnerUid(
            firebaseUser.uid
          );

      const counties =
        pendingRegistration.serviceAreaType ===
          'counties'
          ? pendingRegistration.serviceAreas
          : [];

      const cities =
        pendingRegistration.serviceAreaType ===
          'cities'
          ? pendingRegistration.serviceAreas
          : [];

      if (existingProfessional) {
        await this.professionalRepository
          .updateProfessional(
            existingProfessional.uid,
            {
              businessName:
                pendingRegistration.businessName,

              category:
                pendingRegistration.category,

              professionalType:
                pendingRegistration.professionalType,

              specialties:
                pendingRegistration.specialties,

              stateName:
                pendingRegistration.stateName,

              stateAbbreviation:
                pendingRegistration.stateAbbreviation,

              stateSlug:
                pendingRegistration.stateSlug,

              serviceAreaType:
                pendingRegistration.serviceAreaType,

              counties,
              cities,

              phone:
                pendingRegistration.phone,

              email:
                pendingRegistration.email,

              submissionCertified: true
            }
          );
      } else {
        await this.professionalRepository
          .createProfessional({
            ownerUid:
              firebaseUser.uid,

            businessName:
              pendingRegistration.businessName,

            category:
              pendingRegistration.category,

            professionalType:
              pendingRegistration.professionalType,

            specialties:
              pendingRegistration.specialties,

            stateName:
              pendingRegistration.stateName,

            stateAbbreviation:
              pendingRegistration.stateAbbreviation,

            stateSlug:
              pendingRegistration.stateSlug,

            serviceAreaType:
              pendingRegistration.serviceAreaType,

            counties,
            cities,

            phone:
              pendingRegistration.phone,

            email:
              pendingRegistration.email,

            /*
             * All client-created registrations begin with a
             * free directory listing. Paid profile access will
             * be activated through the subscription workflow.
             */
            subscriptionStatus: 'free',

            placement: 'standard',

            submissionCertified: true,

            status: 'active'
          });
      }

      if (
        pendingRegistration.subscriptionStatus ===
        'profile'
      ) {
        sessionStorage.removeItem(
          'pendingProfessionalRegistration'
        );

        await this.openProfessionalProfileCheckout();

        return;
      }

      sessionStorage.removeItem(
        'pendingProfessionalRegistration'
      );

      this.otpStep.set(false);
      this.verificationComplete.set(true);

      this.successMessage.set(
        'Your email has been verified and your professional directory listing is active.'
      );
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } catch (error) {
      console.error(
        'Unable to verify professional registration:',
        error
      );

      this.errorMessage.set(
        this.getErrorMessage(
          error,
          'We could not verify the code.'
        )
      );
    }
  }

  protected async resendCode():
    Promise<void> {
    const pendingRegistration =
      this.pendingRegistration();

    if (
      !pendingRegistration ||
      !this.canResend() ||
      this.isOtpLoading()
    ) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      await this.otpService.sendOtp(
        pendingRegistration.email
      );

      this.otpForm.reset();

      this.successMessage.set(
        'A new verification code has been sent.'
      );
    } catch (error) {
      this.errorMessage.set(
        this.getErrorMessage(
          error,
          'We could not resend the code.'
        )
      );
    }
  }

  protected changeEmail(): void {
    this.otpService.reset();
    this.otpForm.reset();

    this.otpStep.set(false);
    this.verificationComplete.set(false);

    this.errorMessage.set('');
    this.successMessage.set('');

    sessionStorage.removeItem(
      'pendingProfessionalRegistration'
    );
  }

  protected getServiceAreaLabel(): string {
    const serviceAreaType =
      this.registrationForm.controls
        .serviceAreaType
        .value;

    switch (serviceAreaType) {
      case 'counties':
        return 'Counties served';

      case 'cities':
        return 'Cities served';

      case 'statewide':
      default:
        return 'Statewide';
    }
  }

  private async openProfessionalProfileCheckout():
    Promise<void> {
    const createCheckoutSession =
      httpsCallable<
        void,
        ProfessionalProfileCheckoutResult
      >(
        functions,
        'createProfessionalProfileCheckoutSession'
      );

    const result =
      await createCheckoutSession();

    const checkoutUrl =
      result.data.checkoutUrl?.trim();

    if (!checkoutUrl) {
      throw new Error(
        'Stripe did not return a secure payment URL.'
      );
    }

    window.location.assign(
      checkoutUrl
    );
  }

  ngOnDestroy(): void {
    this.otpService.reset();
  }

  private async createUserProfile(
    uid: string,
    registration:
      PendingProfessionalRegistration
  ): Promise<void> {
    await this.userRepository.create({
      uid,

      firstName:
        registration.firstName,

      lastName:
        registration.lastName,

      displayName:
        `${registration.firstName} ` +
        `${registration.lastName}`,

      email:
        registration.email,

      phone:
        registration.phone,

      photoURL: null,

      emailVerified: true,

      status: 'active',

      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date()
    });
  }

  private getErrorMessage(
    error: unknown,
    fallback: string
  ): string {
    if (
      error instanceof Error &&
      error.message
    ) {
      return error.message;
    }

    return fallback;
  }

  private focusFirstInvalidControl(): void {
    window.setTimeout(() => {
      const firstInvalidElement =
        document.querySelector<HTMLElement>(
          `
            .professional-registration
            input.ng-invalid,
            .professional-registration
            select.ng-invalid
          `
        );

      firstInvalidElement?.focus();
    });
  }
}