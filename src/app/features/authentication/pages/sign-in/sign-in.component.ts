import {
  Component,
  computed,
  inject,
  signal
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

import { AuthService } from '../../../../core/authentication/auth.service';
import { OtpService } from '../../../../core/authentication/otp.service';
import { FirebaseUserRepository } from '../../../../core/firebase/firebase-user.repository';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss'
})
export class SignInComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly userRepository = inject(FirebaseUserRepository);
  private readonly router = inject(Router);

  readonly otpService = inject(OtpService);

  readonly currentStep = signal<'email' | 'code' | 'verifying'>(
    'email'
  );

  readonly codeDigits = signal<string[]>([
    '',
    '',
    '',
    '',
    '',
    ''
  ]);

  readonly googleLoading = signal(false);
  readonly errorMessage = signal('');

  readonly isLoading = computed(
    () => this.otpService.isLoading() || this.googleLoading()
  );

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  get emailControl() {
    return this.loginForm.controls.email;
  }

  async sendOtpCode(): Promise<void> {
    if (this.loginForm.invalid || this.isLoading()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');

    const email = this.getNormalizedEmail();

    try {
      await this.otpService.sendOtp(email);

      sessionStorage.setItem('pendingOtpEmail', email);

      this.currentStep.set('code');
      this.codeDigits.set(['', '', '', '', '', '']);

      setTimeout(() => {
        this.focusCodeInput(0);
      });
    } catch (error) {
      console.error('Unable to request sign-in code:', error);

      this.errorMessage.set(
        this.getErrorMessage(
          error,
          'We could not send your verification code. Please try again.'
        )
      );
    }
  }

  async verifyOtpCode(): Promise<void> {
    if (this.isLoading()) {
      return;
    }

    const code = this.codeDigits().join('');

    if (code.length !== 6) {
      this.errorMessage.set(
        'Please enter all six digits of the verification code.'
      );
      return;
    }

    this.errorMessage.set('');
    this.currentStep.set('verifying');

    try {
      const email = this.getNormalizedEmail();

      await this.otpService.verifyOtp(email, code);

      const firebaseUser = this.authService.currentUser;

      if (!firebaseUser) {
        throw new Error(
          'Authentication completed, but no user session was found.'
        );
      }

      const existingUser = await this.userRepository.getById(
        firebaseUser.uid
      );

      if (!existingUser) {
        throw new Error(
          'No account was found for this email address. Please create an account first.'
        );
      }

      await this.userRepository.update(
        firebaseUser.uid,
        {
          emailVerified: true,
          lastLoginAt: new Date(),
          updatedAt: new Date()
        }
      );

      sessionStorage.removeItem('pendingOtpEmail');

      await this.router.navigate(['/seller/dashboard']);
    } catch (error) {
      console.error('Unable to verify OTP code:', error);

      this.currentStep.set('code');
      this.codeDigits.set(['', '', '', '', '', '']);

      this.errorMessage.set(
        this.getErrorMessage(
          error,
          'The verification code could not be verified.'
        )
      );

      setTimeout(() => {
        this.focusCodeInput(0);
      });
    }
  }

  async resendOtpCode(): Promise<void> {
    if (this.isLoading()) {
      return;
    }

    this.errorMessage.set('');
    this.codeDigits.set(['', '', '', '', '', '']);

    try {
      await this.otpService.sendOtp(
        this.getNormalizedEmail()
      );

      setTimeout(() => {
        this.focusCodeInput(0);
      });
    } catch (error) {
      console.error('Unable to resend OTP code:', error);

      this.errorMessage.set(
        this.getErrorMessage(
          error,
          'We could not resend your verification code.'
        )
      );
    }
  }

  goBackToEmail(): void {
    if (this.isLoading()) {
      return;
    }

    this.otpService.reset();
    this.codeDigits.set(['', '', '', '', '', '']);
    this.errorMessage.set('');
    this.currentStep.set('email');
  }

  onCodeDigitInput(
    index: number,
    event: Event
  ): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '').slice(0, 1);

    input.value = value;

    const digits = [...this.codeDigits()];
    digits[index] = value;
    this.codeDigits.set(digits);

    if (value && index < 5) {
      this.focusCodeInput(index + 1);
    }

    if (
      index === 5 &&
      value &&
      this.codeDigits().join('').length === 6
    ) {
      void this.verifyOtpCode();
    }
  }

  onCodeDigitKeydown(
    index: number,
    event: KeyboardEvent
  ): void {
    if (event.key === 'Backspace') {
      const digits = [...this.codeDigits()];

      if (!digits[index] && index > 0) {
        digits[index - 1] = '';
        this.codeDigits.set(digits);
        this.focusCodeInput(index - 1);
        event.preventDefault();
        return;
      }

      digits[index] = '';
      this.codeDigits.set(digits);
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      this.focusCodeInput(index - 1);
      event.preventDefault();
      return;
    }

    if (event.key === 'ArrowRight' && index < 5) {
      this.focusCodeInput(index + 1);
      event.preventDefault();
      return;
    }

    if (
      event.key.length === 1 &&
      !/^\d$/.test(event.key)
    ) {
      event.preventDefault();
    }
  }

  onCodePaste(event: ClipboardEvent): void {
    event.preventDefault();

    const pastedCode = event.clipboardData
      ?.getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);

    if (!pastedCode) {
      return;
    }

    const digits = pastedCode
      .padEnd(6, ' ')
      .slice(0, 6)
      .split('')
      .map(digit => digit.trim());

    this.codeDigits.set(digits);

    const focusIndex = Math.min(
      pastedCode.length,
      6
    ) - 1;

    this.focusCodeInput(Math.max(focusIndex, 0));

    if (pastedCode.length === 6) {
      void this.verifyOtpCode();
    }
  }

  async signInWithGoogle(): Promise<void> {
    if (this.isLoading()) {
      return;
    }

    this.googleLoading.set(true);
    this.errorMessage.set('');

    try {
      const credential =
        await this.authService.signInWithGoogle();

      const firebaseUser = credential.user;

      const existingUser =
        await this.userRepository.getById(
          firebaseUser.uid
        );

      if (!existingUser) {
        const displayName =
          firebaseUser.displayName?.trim() ?? '';

        const nameParts = displayName
          .split(/\s+/)
          .filter(Boolean);

        const firstName = nameParts[0] ?? '';
        const lastName = nameParts.slice(1).join(' ');

        await this.userRepository.create({
          id: firebaseUser.uid,
          email: firebaseUser.email ?? '',
          phone: firebaseUser.phoneNumber,

          firstName,
          lastName,
          displayName,

          roles: ['seller'],
          status: 'active',

          emailVerified: firebaseUser.emailVerified,
          phoneVerified: false,
          identityStatus: 'not_started',

          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: new Date()
        });
      } else {
        await this.userRepository.update(
          firebaseUser.uid,
          {
            emailVerified: firebaseUser.emailVerified,
            lastLoginAt: new Date(),
            updatedAt: new Date()
          }
        );
      }

      await this.router.navigate(['/seller/dashboard']);
    } catch (error) {
      console.error(
        'Unable to sign in with Google:',
        error
      );

      this.errorMessage.set(
        this.getErrorMessage(
          error,
          'Google sign-in could not be completed. Please try again.'
        )
      );
    } finally {
      this.googleLoading.set(false);
    }
  }

  private getNormalizedEmail(): string {
    return this.loginForm.controls.email.value
      .trim()
      .toLowerCase();
  }

  private focusCodeInput(index: number): void {
    const input = document.getElementById(
      `code-${index}`
    ) as HTMLInputElement | null;

    input?.focus();
    input?.select();
  }

  private getErrorMessage(
    error: unknown,
    fallback: string
  ): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallback;
  }
}