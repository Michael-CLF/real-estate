import {
  Injectable,
  OnDestroy,
  computed,
  effect,
  signal
} from '@angular/core';
import {
  FunctionsError,
  httpsCallable
} from 'firebase/functions';
import {
  signInWithCustomToken
} from 'firebase/auth';

import {
  auth,
  functions
} from '../../infrastructure/firebase/firebase';

interface SendOtpRequest {
  email: string;
}

interface SendOtpResponse {
  expiresInSeconds: number;
  resendAvailableInSeconds: number;
}

interface VerifyOtpRequest {
  email: string;
  code: string;
}

interface VerifyOtpResponse {
  customToken: string;
  isNewUser: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OtpService implements OnDestroy {

  readonly isLoading = signal(false);
  readonly otpSent = signal(false);
  readonly errorMessage = signal('');

  readonly attemptsRemaining = signal(3);
  readonly timeRemainingSeconds = signal(0);
  readonly resendRemainingSeconds = signal(0);

  private readonly expiresAt = signal<Date | null>(null);
  private readonly resendAvailableAt = signal<Date | null>(null);
  private readonly currentTime = signal(new Date());

  readonly isExpired = computed(
    () =>
      this.otpSent() &&
      this.timeRemainingSeconds() <= 0
  );

  readonly canResend = computed(
    () =>
      this.otpSent() &&
      this.resendRemainingSeconds() <= 0 &&
      !this.isLoading()
  );

  readonly formattedTimeRemaining = computed(() =>
    this.formatSeconds(this.timeRemainingSeconds())
  );

  readonly formattedResendRemaining = computed(() =>
    this.formatSeconds(this.resendRemainingSeconds())
  );

  private readonly timerId: ReturnType<typeof setInterval>;

  constructor() {
    this.timerId = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);

    effect(() => {
      const now = this.currentTime().getTime();

      this.timeRemainingSeconds.set(
        this.calculateRemainingSeconds(
          this.expiresAt(),
          now
        )
      );

      this.resendRemainingSeconds.set(
        this.calculateRemainingSeconds(
          this.resendAvailableAt(),
          now
        )
      );
    });
  }

  async sendOtp(email: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const callable = httpsCallable<
        SendOtpRequest,
        SendOtpResponse
      >(
        functions,
        'sendOtp'
      );

      const result = await callable({
        email: this.normalizeEmail(email)
      });

      console.log('verifyOtp function returned:', result.data);

      const {
        expiresInSeconds,
        resendAvailableInSeconds
      } = result.data;

      const now = Date.now();

      this.expiresAt.set(
        new Date(
          now + expiresInSeconds * 1000
        )
      );

      this.resendAvailableAt.set(
        new Date(
          now + resendAvailableInSeconds * 1000
        )
      );

      this.otpSent.set(true);
      this.attemptsRemaining.set(3);
    } catch (error) {
      const message = this.getErrorMessage(
        error,
        'Unable to send the verification code.'
      );

      this.errorMessage.set(message);
      throw new Error(message);
    } finally {
      this.isLoading.set(false);
    }
  }

  async verifyOtp(
    email: string,
    code: string
  ): Promise<boolean> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      if (!this.otpSent()) {
        throw new Error(
          'Request a verification code first.'
        );
      }

      if (this.isExpired()) {
        throw new Error(
          'The verification code has expired. Request a new code.'
        );
      }

      if (!/^\d{6}$/.test(code.trim())) {
        throw new Error(
          'Enter the complete six-digit verification code.'
        );
      }

      const callable = httpsCallable<
        VerifyOtpRequest,
        VerifyOtpResponse
      >(
        functions,
        'verifyOtp'
      );

      const result = await callable({
        email: this.normalizeEmail(email),
        code: code.trim()
      });

      console.log('verifyOtp returned:', result.data);

      const {
        customToken,
        isNewUser
      } = result.data;

      console.log('Signing in with custom token...');

      const credential = await signInWithCustomToken(
        auth,
        customToken
      );

      console.log('Credential:', credential);
      console.log('User:', credential.user);
      console.log('Current user:', auth.currentUser);

      this.reset();

      return isNewUser;

      if (!customToken) {
        throw new Error(
          'The authentication token was not returned.'
        );
      }

      await signInWithCustomToken(
        auth,
        customToken
      );

      this.reset();

      return isNewUser;
    } catch (error) {
      const message = this.getErrorMessage(
        error,
        'Unable to verify the code.'
      );

      if (this.isInvalidCodeError(error)) {
        this.decreaseAttempts();
      }

      if (
        message.toLowerCase().includes('too many') ||
        message.toLowerCase().includes('maximum')
      ) {
        this.attemptsRemaining.set(0);
      }

      this.errorMessage.set(message);
      throw new Error(message);
    } finally {
      this.isLoading.set(false);
    }
  }

  reset(): void {
    this.otpSent.set(false);
    this.expiresAt.set(null);
    this.resendAvailableAt.set(null);
    this.timeRemainingSeconds.set(0);
    this.resendRemainingSeconds.set(0);
    this.attemptsRemaining.set(3);
    this.errorMessage.set('');
    this.isLoading.set(false);
  }

  clearError(): void {
    this.errorMessage.set('');
  }

  ngOnDestroy(): void {
    clearInterval(this.timerId);
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private calculateRemainingSeconds(
    targetDate: Date | null,
    currentTime: number
  ): number {
    if (!targetDate) {
      return 0;
    }

    const remainingMilliseconds =
      targetDate.getTime() - currentTime;

    return Math.max(
      0,
      Math.ceil(remainingMilliseconds / 1000)
    );
  }

  private formatSeconds(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes
      .toString()
      .padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`;
  }

  private decreaseAttempts(): void {
    this.attemptsRemaining.update(
      attempts => Math.max(0, attempts - 1)
    );
  }

  private isInvalidCodeError(error: unknown): boolean {
    if (!(error instanceof FunctionsError)) {
      return false;
    }

    return (
      error.code === 'functions/invalid-argument' ||
      error.code === 'functions/permission-denied'
    );
  }

  private getErrorMessage(
    error: unknown,
    fallback: string
  ): string {
    if (error instanceof FunctionsError) {
      return this.cleanFirebaseMessage(
        error.message || fallback
      );
    }

    if (
      error instanceof Error &&
      error.message
    ) {
      return this.cleanFirebaseMessage(
        error.message
      );
    }

    return fallback;
  }

  private cleanFirebaseMessage(message: string): string {
    return message
      .replace(/^Firebase:\s*/i, '')
      .replace(/\s*\(functions\/[^)]+\)\.?$/i, '')
      .trim();
  }
}