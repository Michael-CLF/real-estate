import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  RouterLink
} from '@angular/router';

import {
  httpsCallable
} from 'firebase/functions';

import {
  AuthState
} from '../../../../core/authentication/state/auth.state';

import {
  PROFESSIONAL_TYPE_LABELS
} from '../../../../core/domains/users/models/professional-type';

import {
  ProfessionalUser
} from '../../../../core/domains/users/models/professional-user.model';

import {
  FirebaseProfessionalRepository
} from '../../../../core/infrastructure/firebase/firebase-professional.repository';

import {
  functions
} from '../../../../core/infrastructure/firebase/firebase';

interface ProfessionalProfileCheckoutResult {
  checkoutSessionId: string;
  checkoutUrl: string;
}

interface ProfessionalBillingPortalResult {
  portalUrl: string;
}

@Component({
  selector: 'app-dashboard-business',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl:
    './dashboard-business.component.html',
  styleUrl:
    './dashboard-business.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class DashboardBusinessComponent
  implements OnInit {

  private readonly authState =
    inject(AuthState);

  private readonly professionalRepository =
    inject(FirebaseProfessionalRepository);

  protected readonly professional =
    signal<ProfessionalUser | null>(null);

  protected readonly isLoading =
    signal(true);

  protected readonly loadError =
    signal('');

  protected readonly isStartingUpgrade =
    signal(false);

  protected readonly upgradeError =
    signal('');

  protected readonly isOpeningBillingPortal =
    signal(false);

  protected readonly billingError =
    signal('');

  protected readonly professionalTypeLabel =
    computed(() => {
      const professional =
        this.professional();

      return professional
        ? PROFESSIONAL_TYPE_LABELS[
            professional.professionalType
          ]
        : '';
    });

  protected readonly hasFullBusinessProfile =
    computed(
      () =>
        this.professional()
          ?.subscriptionStatus ===
        'profile'
    );

  protected readonly publicProfileRoute =
    computed<string[] | null>(() => {
      const professional =
        this.professional();

      if (
        !professional ||
        professional.subscriptionStatus !==
          'profile' ||
        !professional.profileSlug
      ) {
        return null;
      }

      return [
        '/find-a-pro',
        professional.stateSlug,
        professional.profileSlug
      ];
    });

  protected readonly profileSetupRoute =
    computed<string[] | null>(() => {
      const professional =
        this.professional();

      if (
        !professional ||
        professional.subscriptionStatus !==
          'profile'
      ) {
        return null;
      }

      return [
        '/professionals',
        professional.stateSlug,
        'profile',
        'setup'
      ];
    });

  protected readonly directoryRoute =
    computed(() => [
      '/find-a-pro',
      this.professional()?.stateSlug ??
        'north-carolina'
    ]);

  protected readonly registrationRoute =
    computed(() => [
      '/professionals',
      'register',
      'north-carolina'
    ]);

  protected readonly formattedTelephone =
    computed(() =>
      this.formatTelephone(
        this.professional()?.phone ?? ''
      )
    );

  protected readonly serviceArea =
    computed(() => {
      const professional =
        this.professional();

      if (!professional) {
        return '';
      }

      switch (
        professional.serviceAreaType
      ) {
        case 'counties':
          return professional.counties
            .map(county =>
              county
                .trim()
                .toLowerCase()
                .endsWith('county')
                ? county
                : `${county} County`
            )
            .join(', ');

        case 'cities':
          return professional.cities
            .join(', ');

        case 'statewide':
        default:
          return (
            `Statewide in ` +
            professional.stateName
          );
      }
    });

  async ngOnInit(): Promise<void> {
    await this.loadBusinessAccount();
  }

  protected reloadBusinessAccount(): void {
    void this.loadBusinessAccount();
  }

  protected async upgradeBusinessProfile():
    Promise<void> {

    if (
      this.isStartingUpgrade() ||
      !this.professional()
    ) {
      return;
    }

    this.isStartingUpgrade.set(true);
    this.upgradeError.set('');

    try {
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
          'Stripe did not return a checkout address.'
        );
      }

      window.location.assign(
        checkoutUrl
      );

    } catch (error: unknown) {
      console.error(
        'Unable to begin the business profile upgrade:',
        error
      );

      this.upgradeError.set(
        this.getErrorMessage(
          error,
          'We could not open the subscription checkout. Please try again.'
        )
      );

      this.isStartingUpgrade.set(false);
    }
  }

  protected async openBillingPortal():
    Promise<void> {

    if (
      this.isOpeningBillingPortal() ||
      !this.hasFullBusinessProfile()
    ) {
      return;
    }

    this.isOpeningBillingPortal.set(true);
    this.billingError.set('');

    try {
      const createPortalSession =
        httpsCallable<
          void,
          ProfessionalBillingPortalResult
        >(
          functions,
          'createProfessionalBillingPortalSession'
        );

      const result =
        await createPortalSession();

      const portalUrl =
        result.data.portalUrl?.trim();

      if (!portalUrl) {
        throw new Error(
          'Stripe did not return a billing portal address.'
        );
      }

      window.location.assign(
        portalUrl
      );

    } catch (error: unknown) {
      console.error(
        'Unable to open business billing:',
        error
      );

      this.billingError.set(
        this.getErrorMessage(
          error,
          'We could not open your subscription settings. Please try again.'
        )
      );

      this.isOpeningBillingPortal.set(false);
    }
  }

  private async loadBusinessAccount():
    Promise<void> {

    this.isLoading.set(true);
    this.loadError.set('');

    try {
      const ownerUid =
        this.authState.uid();

      if (!ownerUid) {
        this.professional.set(null);

        this.loadError.set(
          'Your authenticated NavStreet account could not be identified.'
        );

        return;
      }

      const professional =
        await this.professionalRepository
          .getProfessionalByOwnerUid(
            ownerUid
          );

      this.professional.set(
        professional
      );

    } catch (error: unknown) {
      console.error(
        'Unable to load the business account:',
        error
      );

      this.professional.set(null);

      this.loadError.set(
        'Your business account could not be loaded. Please try again.'
      );

    } finally {
      this.isLoading.set(false);
    }
  }

  private formatTelephone(
    value: string
  ): string {

    const digits =
      value.replace(/\D/g, '');

    if (digits.length === 10) {
      return (
        `(${digits.slice(0, 3)}) ` +
        `${digits.slice(3, 6)}-` +
        `${digits.slice(6)}`
      );
    }

    if (
      digits.length === 11 &&
      digits.startsWith('1')
    ) {
      return (
        `+1 (${digits.slice(1, 4)}) ` +
        `${digits.slice(4, 7)}-` +
        `${digits.slice(7)}`
      );
    }

    return value;
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