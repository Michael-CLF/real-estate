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
  AuthState
} from '../../../core/authentication/state/auth.state';

interface FooterLink {
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
            label: 'About',
            route: '/about'
          },
          {
            label: 'Contact',
            route: '/contact'
          },
          {
            label: 'Careers',
            route: '/careers'
          }
        ],

        title: 'Company'
      },
      {
        links: [
          {
            label: 'Buy a Home',
            route: '/buy'
          },
          {
            label: 'Sell a Home',
            route: '/sell'
          },
          {
            label: 'Mortgage',
            route: '/mortgage'
          }
        ],

        title: 'Services'
      },
      {
        links: [
          {
            label: 'Mortgage Calculators',
            route: '/mortgage/calculator'
          },
          {
            label: 'Affordability Calculator',
            route: '/mortgage/affordability'
          },
          {
            label: 'Closing Cost Calculator',
            route: '/mortgage/closing-costs'
          }
        ],

        title: 'Resources'
      },
      {
        links: [
          {
            label: 'Privacy Policy',
            route: '/privacy'
          },
          {
            label: 'Terms of Use',
            route: '/terms'
          },
          {
            label: 'Accessibility',
            route: '/accessibility'
          }
        ],

        title: 'Legal'
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

    } catch (error: unknown) {
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