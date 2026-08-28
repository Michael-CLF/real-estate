import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal
} from '@angular/core';

import {
  Router,
  RouterLink
} from '@angular/router';

import {
  AnalyticsDataLayerService
} from '../../../core/analytics/analytics-data-layer.service';

import {
  AuthService
} from '../../../core/authentication/services/auth.service';

import {
  AuthState
} from '../../../core/authentication/state/auth.state';

import {
  NavigationComponent
} from '../navigation/navigation.component';

@Component({
  changeDetection:
    ChangeDetectionStrategy.OnPush,
  imports: [
    NavigationComponent,
    RouterLink
  ],
  selector: 'app-header',
  standalone: true,
  styleUrl:
    './header.component.scss',
  templateUrl:
    './header.component.html'
})
export class HeaderComponent {
  private readonly analytics =
    inject(
      AnalyticsDataLayerService
    );

  private readonly authService =
    inject(AuthService);

  private readonly router =
    inject(Router);

  protected readonly authState =
    inject(AuthState);

  protected readonly isMobileMenuOpen =
    signal(false);

  protected readonly isLoggingOut =
    signal(false);

  protected closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  protected handleHeaderNavigation(
    linkName: string,
    linkText: string,
    destination: string
  ): void {
    this.analytics.track(
      'navigation_click',
      {
        navigation_location:
          'header',
        navigation_mode:
          this.isMobileMenuOpen()
            ? 'mobile'
            : 'desktop',
        link_name:
          linkName,
        link_text:
          linkText,
        destination
      }
    );

    this.closeMobileMenu();
  }

  protected toggleMobileMenu(): void {
    const willOpen =
      !this.isMobileMenuOpen();

    this.isMobileMenuOpen.set(
      willOpen
    );

    this.analytics.track(
      'navigation_menu_toggle',
      {
        navigation_location:
          'header',
        menu_state:
          willOpen
            ? 'opened'
            : 'closed'
      }
    );
  }

  protected async logout():
    Promise<void> {
    if (this.isLoggingOut()) {
      return;
    }

    this.analytics.track(
      'navigation_click',
      {
        navigation_location:
          'header',
        navigation_mode:
          this.isMobileMenuOpen()
            ? 'mobile'
            : 'desktop',
        link_name:
          'logout',
        link_text:
          'Log out',
        destination:
          '/'
      }
    );

    this.isLoggingOut.set(true);

    try {
      await this.authService.logout();

      this.closeMobileMenu();

      await this.router.navigate([
        '/'
      ]);
    } catch (
      error: unknown
    ) {
      console.error(
        'Unable to sign out:',
        error
      );
    } finally {
      this.isLoggingOut.set(false);
    }
  }
}