import {
  Injectable,
  OnDestroy,
  computed,
  effect,
  signal
} from '@angular/core';
import {
  HttpsCallableResult,
  httpsCallable
} from 'firebase/functions';
import { signInWithCustomToken } from 'firebase/auth';

import {
  auth,
  functions
} from '../firebase/firebase';

export interface SendOtpResponse {
  success: boolean;
  message: string;
  expiresAt?: string;
  error?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  customToken?: string;
  token?: string;
  isNewUser?: boolean;
  error?: string;
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

  private readonly expiresAt = signal<Date | null>(null);
  private readonly currentTime = signal(new Date());

  readonly isExpired = computed(
    () => this.timeRemainingSeconds() <= 0
  );

  readonly formattedTimeRemaining = computed(() => {
    const totalSeconds = this.timeRemainingSeconds();
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  });

  private readonly timerId: ReturnType<typeof setInterval>;

  constructor() {
    this.timerId = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);

    effect(() => {
      const expiration = this.expiresAt();
      const now = this.currentTime();

      if (!expiration) {
        this.timeRemainingSeconds.set(0);
        return;
      }

      const remainingMilliseconds =
        expiration.getTime() - now.getTime();

      this.timeRemainingSeconds.set(
        Math.max(
          0,
          Math.floor(remainingMilliseconds / 1000)
        )
      );
    });
  }

  async sendOtp(email: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const callable = httpsCallable<
        { email: string },
        SendOtpResponse
      >(
        functions,
        'sendOTP'
      );

      const result: HttpsCallableResult<SendOtpResponse> =
        await callable({
          email: email.trim().toLowerCase()
        });

      const response = result.data;

      if (!response.success) {
        throw new Error(
          response.message || 'Unable to send verification code.'
        );
      }

      if (response.expiresAt) {
        this.expiresAt.set(
          new Date(response.expiresAt)
        );
      }

      this.otpSent.set(true);
      this.attemptsRemaining.set(3);
    } catch (error) {
      const message = this.getErrorMessage(
        error,
        'Unable to send verification code.'
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
      if (this.isExpired()) {
        throw new Error(
          'Code has expired. Please request a new one.'
        );
      }

      const callable = httpsCallable<
        {
          email: string;
          code: string;
        },
        VerifyOtpResponse
      >(
        functions,
        'verifyOTP'
      );

      const result: HttpsCallableResult<VerifyOtpResponse> =
        await callable({
          email: email.trim().toLowerCase(),
          code
        });

      const response = result.data;
      const customToken =
        response.customToken ?? response.token;

      if (!response.success || !customToken) {
        this.decreaseAttempts();

        throw new Error(
          response.message || 'Invalid verification code.'
        );
      }

      await signInWithCustomToken(
        auth,
        customToken
      );

      const isNewUser = response.isNewUser ?? false;

      this.reset();

      return isNewUser;
    } catch (error) {
      const message = this.getErrorMessage(
        error,
        'Invalid verification code.'
      );

      if (
        message.toLowerCase().includes('too many attempts')
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
    this.timeRemainingSeconds.set(0);
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

  private decreaseAttempts(): void {
    this.attemptsRemaining.update(
      attempts => Math.max(0, attempts - 1)
    );
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