import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal
} from '@angular/core';

import {
  RouterLink
} from '@angular/router';

import {
  User,
  getIdTokenResult
} from 'firebase/auth';

import {
  AnalyticsDataLayerService
} from '../../../core/analytics/analytics-data-layer.service';

import {
  AuthState
} from '../../../core/authentication/state/auth.state';

interface FooterLink {
  analyticsName: string;
  label: string;
  route: string;
}

interface FooterSection {
  links: FooterLink[];
  title: string;
}

@Component({
  changeDetection:
    ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink
  ],
  selector:
    'app-footer',
  standalone:
    true,
  styleUrl:
    './footer.component.scss',
  templateUrl:
    './footer.component.html'
})
export class FooterComponent {
  private readonly analytics =
    inject(
      AnalyticsDataLayerService
    );

  private readonly authState =
    inject(AuthState);

  private administratorCheckId =
    0;

  protected readonly currentYear =
    new Date().getFullYear();

  protected readonly isAdministrator =
    signal(false);

  protected readonly footerSections:
    FooterSection[] = [
      {
        links: [
          {
            analyticsName:
              'company_about',
            label:
              'About',
            route:
              '/about'
          },
          {
            analyticsName:
              'company_contact',
            label:
              'Contact',
            route:
              '/contact'
          },
          {
            analyticsName:
              'company_careers',
            label:
              'Careers',
            route:
              '/careers'
          }
        ],
        title:
          'Company'
      },
      {
        links: [
          {
            analyticsName:
              'services_buy_a_home',
            label:
              'Buy a Home',
            route:
              '/buy'
          },
          {
            analyticsName:
              'services_sell_a_home',
            label:
              'Sell a Home',
            route:
              '/sell'
          },
          {
            analyticsName:
              'services_mortgage',
            label:
              'Mortgage',
            route:
              '/mortgage'
          }
        ],
        title:
          'Services'
      },
      {
        links: [
          {
            analyticsName:
              'resources_how-it-works',
            label:
              'How it Works',
            route:
              '/how-navstreet-works'
          },
          {
            analyticsName:
              'resources_pricing',
            label:
              'Pricing',
            route:
              '/pricing'
          },
          {
            analyticsName:
              'resources_mortgage_calculators',
            label:
              'Mortgage Calculators',
            route:
              '/mortgage/calculator'
          },
        ],
        title:
          'Resources'
      },
      {
        links: [
          {
            analyticsName:
              'legal_privacy_policy',
            label:
              'Privacy Policy',
            route:
              '/privacy'
          },
          {
            analyticsName:
              'legal_terms_of_service',
            label:
              'Terms of Service',
            route:
              '/terms'
          },
          {
            analyticsName:
              'legal_accessibility',
            label:
              'Accessibility',
            route:
              '/accessibility'
          }
        ],
        title:
          'Legal'
      }
    ];

  constructor() {
    effect(() => {
      const authenticationLoading =
        this.authState.loading();

      const authenticatedUser =
        this.authState.user();

      const administratorCheckId =
        ++this.administratorCheckId;

      this.isAdministrator.set(false);

      if (
        authenticationLoading ||
        !authenticatedUser
      ) {
        return;
      }

      void this.checkAdministratorClaim(
        authenticatedUser,
        administratorCheckId
      );
    });
  }

  protected trackFooterNavigation(
    linkName: string,
    linkText: string,
    destination: string
  ): void {
    this.analytics.track(
      'navigation_click',
      {
        navigation_location:
          'footer',
        link_name:
          linkName,
        link_text:
          linkText,
        destination
      }
    );
  }

  private async checkAdministratorClaim(
    user: User,
    administratorCheckId: number
  ): Promise<void> {
    try {
      const tokenResult =
        await getIdTokenResult(
          user
        );

      if (
        administratorCheckId !==
        this.administratorCheckId ||
        this.authState.user()?.uid !==
        user.uid
      ) {
        return;
      }

      const isAdministrator =
        tokenResult.claims['admin'] ===
        true ||
        tokenResult.claims['role'] ===
        'admin';

      this.isAdministrator.set(
        isAdministrator
      );
    } catch (
    error: unknown
    ) {
      if (
        administratorCheckId !==
        this.administratorCheckId
      ) {
        return;
      }

      console.error(
        'Unable to determine footer administration access:',
        error
      );

      this.isAdministrator.set(false);
    }
  }
}