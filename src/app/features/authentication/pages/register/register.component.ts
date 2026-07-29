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
  Router,
  RouterLink
} from '@angular/router';

import {
  OtpService
} from '../../../../core/authentication/otp.service';

import { auth } from '../../../../core/infrastructure/firebase/firebase';
import { FirebaseUserRepository } from '../../../../core/firebase/firebase-user.repository';

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

  private readonly formBuilder = inject(FormBuilder);
  private readonly otpService = inject(OtpService);
  private readonly router = inject(Router);
  private readonly changeDetectorRef =
    inject(ChangeDetectorRef);
  private readonly userRepository =
    inject(FirebaseUserRepository);

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

  formatPhoneNumber(event: Event): void {
    const input = event.target as HTMLInputElement;

    const digits = input.value
      .replace(/\D/g, '')
      .slice(0, 10);

    let formattedValue = '';

    if (digits.length > 0) {
      formattedValue = `(${digits.slice(0, 3)}`;
    }

    if (digits.length >= 4) {
      formattedValue += `) ${digits.slice(3, 6)}`;
    }

    if (digits.length >= 7) {
      formattedValue += `-${digits.slice(6, 10)}`;
    }

    this.registerForm.controls.phone.setValue(
      formattedValue,
      {
        emitEvent: false
      }
    );
  }

  formatOtpCode(event: Event): void {
    const input = event.target as HTMLInputElement;

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

      sessionStorage.setItem(
        'pendingRegistration',
        JSON.stringify(this.pendingRegistration)
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
        error instanceof Error
          ? error.message
          : 'We could not send the verification code.';
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

      const firebaseUser = auth.currentUser;

      if (!firebaseUser) {
        throw new Error(
          'Authentication succeeded but no Firebase user was found.'
        );
      }

      const existingUser =
        await this.userRepository.getById(
          firebaseUser.uid
        );

      if (!existingUser) {
        await this.userRepository.create({
          id: firebaseUser.uid,

          firstName: this.pendingRegistration.firstName,
          lastName: this.pendingRegistration.lastName,
          displayName:
            `${this.pendingRegistration.firstName} ${this.pendingRegistration.lastName}`,

          email: this.pendingRegistration.email,
          phone: this.pendingRegistration.phone,

          photoURL: null,

          emailVerified: true,

          status: 'active',

          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: new Date()
        });
      }

      sessionStorage.removeItem(
        'pendingRegistration'
      );

      await this.router.navigate([
        '/dashboard'
      ]);
    } catch (error) {
      console.error(
        'Unable to verify registration code:',
        error
      );

      this.errorMessage =
        error instanceof Error
          ? error.message
          : 'We could not verify the code.';
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
      error instanceof Error
        ? error.message
        : 'We could not resend the code.';
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
    this.errorMessage = '';
    this.successMessage = '';
  }
}