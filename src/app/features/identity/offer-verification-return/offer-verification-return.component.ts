import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';

import {
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';

import {
  OfferIdentityVerificationService,
} from '../../../core/domains/identity/services/offer-identity-verification.service';

import type {
  OfferIdentityVerificationStatus,
} from '../../../core/domains/identity/services/offer-identity-verification.service';


@Component({
  selector:
    'app-offer-verification-return',
  standalone: true,
  imports: [
    RouterLink,
  ],
  templateUrl:
    './offer-verification-return.component.html',
  styleUrl:
    './offer-verification-return.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class OfferVerificationReturnComponent
  implements OnInit {
  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly destroyRef =
    inject(DestroyRef);

  private readonly identityService =
    inject(
      OfferIdentityVerificationService
    );

  readonly listingUid =
    signal('');
  private returnUrl = '';
  private checkTimer:
    ReturnType<typeof setTimeout> |
    null = null;

  readonly status =
    signal<OfferIdentityVerificationStatus>(
      'processing'
    );

  readonly checking =
    signal(true);

  readonly restarting =
    signal(false);

  readonly errorMessage =
    signal('');


  constructor() {
    this.destroyRef.onDestroy(
      () => {
        if (this.checkTimer) {
          clearTimeout(
            this.checkTimer
          );
        }
      }
    );
  }


  async ngOnInit(): Promise<void> {
    this.listingUid.set(
      this.route.snapshot.paramMap
        .get('listingUid') ?? ''
    );

    const requestedReturnUrl =
      this.route.snapshot.queryParamMap
        .get('returnUrl') ?? '';

    if (
      !this.listingUid() ||
      !this.identityService
        .isValidOfferReturnPath(
          requestedReturnUrl,
          this.listingUid()
        )
    ) {
      this.checking.set(false);
      this.errorMessage.set(
        'The offer return link is invalid. Please return to the property and select Make an Offer again.'
      );
      return;
    }

    this.returnUrl =
      requestedReturnUrl;

    if (
      this.route.snapshot.queryParamMap
        .get('startError') === 'true'
    ) {
      this.checking.set(false);
      this.status.set(
        'not_started'
      );
      this.errorMessage.set(
        'Identity verification could not be started. Please try again.'
      );
      return;
    }

    await this.checkStatus();
  }


  async checkStatus(): Promise<void> {
    this.clearTimer();
    this.checking.set(true);
    this.errorMessage.set('');

    try {
      const currentStatus =
        await this.identityService
          .getStatus();

      this.status.set(
        currentStatus
      );

      if (currentStatus === 'verified') {
        await this.router.navigateByUrl(
          this.returnUrl
        );
        return;
      }

      if (currentStatus === 'processing') {
        this.checkTimer =
          setTimeout(
            () => {
              void this.checkStatus();
            },
            2500
          );
      }
    } catch (error) {
      console.error(
        'Identity verification status could not be checked.',
        error
      );

      this.errorMessage.set(
        'We could not confirm your identity verification status. Please try again.'
      );
    } finally {
      this.checking.set(false);
    }
  }


  async restartVerification():
    Promise<void> {
    if (
      this.restarting() ||
      !this.listingUid() ||
      !this.returnUrl
    ) {
      return;
    }

    this.restarting.set(true);
    this.errorMessage.set('');

    try {
      const verification =
        await this.identityService
          .startVerification(
            this.listingUid(),
            this.returnUrl
          );

      if (
        verification.alreadyVerified ||
        verification.status ===
          'verified'
      ) {
        await this.router.navigateByUrl(
          this.returnUrl
        );
        return;
      }

      if (
        verification.verificationUrl
      ) {
        window.location.assign(
          verification.verificationUrl
        );
        return;
      }

      this.status.set(
        verification.status
      );

      await this.checkStatus();
    } catch (error) {
      console.error(
        'Identity verification could not be restarted.',
        error
      );

      this.errorMessage.set(
        'Identity verification could not be restarted. Please try again.'
      );
    } finally {
      this.restarting.set(false);
    }
  }


  private clearTimer(): void {
    if (!this.checkTimer) {
      return;
    }

    clearTimeout(
      this.checkTimer
    );

    this.checkTimer = null;
  }
}
