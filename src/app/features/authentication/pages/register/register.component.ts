import {
  ChangeDetectorRef,
  Component,
  inject
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

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

interface PendingRegistration {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {

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

  private readonly router =
    inject(Router);

  private readonly route =
    inject(ActivatedRoute);

  private readonly changeDetectorRef =
    inject(ChangeDetectorRef);

  loading = false;
  verifying = false;
  otpStep = false;

  errorMessage = '';
  successMessage = '';

  pendingRegistration:
    PendingRegistration | null = null;

  readonly registerForm =
    this.formBuilder.nonNullable.group({
      firstName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.pattern(/^[A-Za-z' -]+$/)
        ]
      ],

      lastName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.pattern(/^[A-Za-z' -]+$/)
        ]
      ],

      email: [
        '',
        [
          Validators.required,
          Validators.email
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
      ]
    });

  readonly otpForm =
    this.formBuilder.nonNullable.group({
      code: [
        '',
        [
          Validators.required,
          Validators.pattern(/^\d{6}$/)
        ]
      ]
    });

  get formattedTimeRemaining(): string {
    return this.otpService.formattedTimeRemaining();
  }

  get formattedResendRemaining(): string {
    return this.otpService.formattedResendRemaining();
  }

  get canResend(): boolean {
    return this.otpService.canResend();
  }

  get isExpired(): boolean {
    return this.otpService.isExpired();
  }

  /*
   * True when Firebase Authentication has already
   * established the user's identity but the NavStreet
   * Firestore profile is missing.
   *
   * This state does not require another OTP.
   */
  protected get isCompletingAccount(): boolean {
    return (
      this.authService.isAuthenticated &&
      this.accountState.hasIncompleteAccount()
    );
  }

  formatPhoneNumber(event: Event): void {
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

    this.registerForm.controls.phone.setValue(
      formattedValue,
      {
        emitEvent: false
      }
    );
  }

  formatOtpCode(event: Event): void {
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

  async submit(): Promise<void> {
    if (
      this.registerForm.invalid ||
      this.loading
    ) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.otpService.clearError();

    try {
      const {
        firstName,
        lastName,
        email,
        phone
      } = this.registerForm.getRawValue();

      this.pendingRegistration = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.replace(/\D/g, '')
      };

      /*
       * An authenticated Firebase user whose Firestore
       * profile is missing has already completed identity
       * verification.
       *
       * Complete the NavStreet profile directly instead
       * of sending another OTP.
       */
      if (this.isCompletingAccount) {
        await this.completeExistingAccount(
          this.pendingRegistration
        );

        return;
      }

      /*
       * Normal new-user registration.
       */
      sessionStorage.setItem(
        'pendingRegistration',
        JSON.stringify(
          this.pendingRegistration
        )
      );

      await this.otpService.sendOtp(
        this.pendingRegistration.email
      );

      this.otpStep = true;

      this.successMessage =
        `We sent a six-digit verification code to ` +
        `${this.pendingRegistration.email}.`;

      this.changeDetectorRef.detectChanges();

    } catch (error) {
      console.error(
        'Unable to begin registration:',
        error
      );

      this.errorMessage =
        this.getErrorMessage(
          error,
          'We could not complete registration.'
        );

    } finally {
      this.loading = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  async verifyCode(): Promise<void> {
    if (
      this.otpForm.invalid ||
      this.verifying ||
      !this.pendingRegistration
    ) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.verifying = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const code =
        this.otpForm.controls.code.value;

      await this.otpService.verifyOtp(
        this.pendingRegistration.email,
        code
      );

      const firebaseUser =
        this.authService.currentUser;

      if (!firebaseUser) {
        throw new Error(
          'Authentication succeeded but no Firebase user was found.'
        );
      }

      /*
       * The Firebase account returned by OTP verification
       * must correspond to the email being registered.
       */
      if (
        firebaseUser.email?.toLowerCase() !==
        this.pendingRegistration.email
      ) {
        throw new Error(
          'The authenticated email does not match the registration email.'
        );
      }

      const existingUser =
        await this.userRepository.getById(
          firebaseUser.uid
        );

      if (!existingUser) {
        await this.createUserProfile(
          firebaseUser.uid,
          this.pendingRegistration
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

      sessionStorage.removeItem(
        'pendingRegistration'
      );

      /*
       * The account guard now depends on AccountState.
       * Refresh it before navigating so the newly-created
       * Firestore profile is immediately recognized.
       */
      await this.accountState.refresh();

      if (!this.accountState.isActive()) {
        throw new Error(
          'Your NavStreet account could not be activated.'
        );
      }

      await this.navigateAfterAuthentication();

    } catch (error) {
      console.error(
        'Unable to verify registration code:',
        error
      );

      this.errorMessage =
        this.getErrorMessage(
          error,
          'We could not verify the code.'
        );

    } finally {
      this.verifying = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  async resendCode(): Promise<void> {
    if (
      !this.pendingRegistration ||
      !this.canResend ||
      this.loading
    ) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      await this.otpService.sendOtp(
        this.pendingRegistration.email
      );

      this.otpForm.reset();

      this.successMessage =
        'A new verification code has been sent.';

    } catch (error) {
      this.errorMessage =
        this.getErrorMessage(
          error,
          'We could not resend the code.'
        );

    } finally {
      this.loading = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  changeEmail(): void {
    this.otpService.reset();
    this.otpForm.reset();

    this.otpStep = false;
    this.pendingRegistration = null;

    sessionStorage.removeItem(
      'pendingRegistration'
    );

    this.errorMessage = '';
    this.successMessage = '';
  }

  protected get returnUrl(): string | null {
    return this.getSafeReturnUrl();
  }

  private async completeExistingAccount(
    registration: PendingRegistration
  ): Promise<void> {

    const firebaseUser =
      this.authService.currentUser;

    if (!firebaseUser) {
      throw new Error(
        'Your authenticated session could not be found.'
      );
    }

    /*
     * An incomplete Firebase account must not be used
     * to create a profile for a different email address.
     */
    const authenticatedEmail =
      firebaseUser.email
        ?.trim()
        .toLowerCase();

    if (
      !authenticatedEmail ||
      authenticatedEmail !== registration.email
    ) {
      throw new Error(
        'Please use the email address associated with your authenticated account.'
      );
    }

    const existingUser =
      await this.userRepository.getById(
        firebaseUser.uid
      );

    if (!existingUser) {
      await this.createUserProfile(
        firebaseUser.uid,
        registration
      );
    }

    sessionStorage.removeItem(
      'pendingRegistration'
    );

    await this.accountState.refresh();

    if (!this.accountState.isActive()) {
      throw new Error(
        'Your NavStreet account could not be activated.'
      );
    }

    await this.navigateAfterAuthentication();
  }

  private async createUserProfile(
    uid: string,
    registration: PendingRegistration
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

  private async navigateAfterAuthentication():
    Promise<void> {

    const returnUrl =
      this.getSafeReturnUrl();

    await this.router.navigateByUrl(
      returnUrl ?? '/dashboard'
    );
  }

  private getSafeReturnUrl():
    string | null {

    const returnUrl =
      this.route.snapshot.queryParamMap.get(
        'returnUrl'
      );

    /*
     * Only permit local application URLs.
     * This prevents returnUrl from becoming an
     * external redirect.
     */
    if (
      !returnUrl ||
      !returnUrl.startsWith('/') ||
      returnUrl.startsWith('//')
    ) {
      return null;
    }

    return returnUrl;
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
}